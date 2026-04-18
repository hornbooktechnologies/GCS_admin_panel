import axios from 'axios';
import { getFromLocalStorage, removeFromLocalStorage, setToLocalStorage } from './storage-utils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = getFromLocalStorage('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// Token Refresh Queue
// Prevents multiple concurrent refresh calls; queues any requests that arrive
// while a refresh is already in progress.
// ─────────────────────────────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const refreshAccessToken = async () => {
    const refreshToken = getFromLocalStorage('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    // Use a plain axios call to avoid interceptor loop
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
    });

    const data = response.data;

    if (data.success) {
        // Robustly handle both nested and flat structures
        const accessToken = data.data?.tokens?.accessToken || data.data?.accessToken;
        const newRefreshToken = data.data?.tokens?.refreshToken || data.data?.refreshToken;

        if (accessToken) {
            setToLocalStorage('accessToken', accessToken);
            if (newRefreshToken) {
                setToLocalStorage('refreshToken', newRefreshToken);
            }
            return accessToken;
        }
    }

    throw new Error('Token refresh failed');
};

const triggerLogout = () => {
    removeFromLocalStorage('accessToken');
    removeFromLocalStorage('refreshToken');
    removeFromLocalStorage('auth-storage');
    window.location.href = '/auth/login';
};

// Response interceptor to handle token expiration and auto-refresh
apiClient.interceptors.response.use(
    (response) => {
        const data = response.data;
        // Some backends return 200 with a token-error body
        if (
            data &&
            data.success === false &&
            (data.error?.code === 'TOKEN_INVALID' ||
                data.error?.code === 'TOKEN_EXPIRED')
        ) {
            return response;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            return Promise.reject(error);
        }

        const status = error.response.status;
        const data = error.response.data;

        // Check for 401 (Unauthorized) OR 403 (Forbidden) with Token Error
        const isTokenError =
            status === 401 ||
            (status === 403 &&
                data &&
                (data.error?.code === 'TOKEN_INVALID' ||
                    data.error?.code === 'TOKEN_EXPIRED' ||
                    data.message?.toLowerCase().includes('token')));

        const isAuthAttempt = originalRequest?.url?.includes('/auth/');

        // Don't intercept actual auth requests (login, refresh)
        if (!isTokenError || isAuthAttempt) {
            return Promise.reject(error);
        }

        // Already retried once — give up and logout
        if (originalRequest._retry) {
            triggerLogout();
            return Promise.reject(error);
        }

        // Another refresh is already running — queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        // Start refresh
        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const newToken = await refreshAccessToken();
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            triggerLogout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export const requestHandler = async (url, options = {}) => {
    try {
        const { method = 'GET', body, headers, params } = options;

        const config = {
            method,
            url,
            params,
            headers,
        };

        if (body) {
            config.data = body;
        }

        const response = await apiClient(config);

        // Check if response contains token error (interceptor will handle redirect)
        const data = response.data;
        if (
            data &&
            data.success === false &&
            (data.error?.code === 'TOKEN_INVALID' ||
                data.error?.code === 'TOKEN_EXPIRED')
        ) {
            // Interceptor has already handled logout/redirect
            // Just return the error response
            return data;
        }

        // Return the response data directly (backend should return {success, data, message})
        return response.data;
    } catch (error) {
        // If it's a 401 error, the response interceptor has already handled it
        // (cleared localStorage and redirected to login), UNLESS it was a login attempt
        if (error.response?.status === 401) {
            // If it was a login attempt, we want to return the actual error response
            // so the login page can display "Invalid credentials"
            if (error.response.config?.url?.includes('/auth/login')) {
                return error.response.data;
            }

            // Otherwise, don't process further as interceptor handled redirect
            return {
                success: false,
                statusCode: 401,
                message: 'Unauthorized - Session expired',
            };
        }

        // Handle other axios errors (including 403 - permission denied)
        if (error.response?.data) {
            // Backend returned an error response
            return error.response.data;
        }

        // Network or other error
        return {
            success: false,
            statusCode: error.response?.status || 500,
            message: error.message || 'Network Error',
            error: {
                code: error.code || 'ERR_UNKNOWN',
                details: error.stack || '',
            },
        };
    }
};

export default apiClient;
