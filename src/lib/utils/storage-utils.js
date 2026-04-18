export const setToLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.error('Error setting to localStorage:', error);
    }
};

export const getFromLocalStorage = (key) => {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error('Error getting from localStorage:', error);
        return null;
    }
};

export const removeFromLocalStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
};
