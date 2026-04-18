# API Integration Guide

## Login API Integration

The login functionality is now fully integrated with your backend API.

### API Endpoint
- **URL**: `/auth/login`
- **Method**: `POST`
- **Base URL**: Configured in `.env` file as `REACT_APP_API_BASE_URL`

### Request Format

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Expected Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "user@example.com",
      "role": "admin",  // Can be: "admin", "hr", or "manager"
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Error Response (400/401)
```json
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401
}
```

## User Roles

The system supports three different user roles:

1. **Admin** (`admin`) - Full system access
2. **HR** (`hr`) - HR-specific access
3. **Manager** (`manager`) - Manager-specific access

## Authentication Flow

1. **User enters credentials** on the login page
2. **Form validation** using Zod schema:
   - Email: Required and must be valid email format
   - Password: Required
3. **API call** to `/auth/login` with credentials
4. **Response handling**:
   - **Success**: 
     - User data and tokens stored in Zustand store
     - Tokens saved to localStorage
     - User redirected to dashboard (`/`)
     - Success toast notification shown
   - **Error**:
     - Error message displayed via toast notification
     - User remains on login page

## Configuration

### Environment Variables

Update the `.env` file in the root directory:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

For production:
```env
REACT_APP_API_BASE_URL=https://your-backend-api.com/api
```

## Testing the Login

### Option 1: With Real Backend

1. Ensure your backend API is running
2. Update `.env` with the correct API URL
3. Restart the React app: `npm start`
4. Navigate to `http://localhost:3000/auth/login`
5. Enter valid credentials
6. Click "LOGIN"

### Option 2: Test Credentials (if your backend has seed data)

Example test users (update based on your backend):

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`
- Role: `admin`

**HR User:**
- Email: `hr@example.com`
- Password: `hr123`
- Role: `hr`

**Manager User:**
- Email: `manager@example.com`
- Password: `manager123`
- Role: `manager`

## State Management

### Zustand Store (`src/store/auth.js`)

The authentication state is managed using Zustand with persistence:

```javascript
{
  user: {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "user@example.com",
    role: "admin",
    status: "active"
  },
  tokens: {
    accessToken: "...",
    refreshToken: "..."
  },
  isAuthenticated: true
}
```

### Actions Available

- `login(user, tokens)` - Store user data and tokens
- `logout()` - Clear user data and tokens

## Protected Routes

The dashboard and other protected routes check authentication status:

- **Authenticated**: User can access the route
- **Not Authenticated**: User is redirected to `/auth/login`

## API Client Features

### Automatic Token Injection

The API client automatically adds the access token to all requests:

```javascript
headers: {
  Authorization: `Bearer ${accessToken}`
}
```

### Error Handling

The request handler catches and formats errors:

- **Network errors**: Returns formatted error message
- **Backend errors**: Returns backend error response
- **Timeout**: 15 seconds (configurable)

## Troubleshooting

### Common Issues

1. **CORS Error**
   - Ensure your backend allows requests from `http://localhost:3000`
   - Check backend CORS configuration

2. **Network Error**
   - Verify backend is running
   - Check API URL in `.env` file
   - Ensure no firewall blocking

3. **401 Unauthorized**
   - Check credentials are correct
   - Verify backend authentication logic

4. **Login successful but redirects to login**
   - Check if tokens are being saved to localStorage
   - Verify Zustand store is updating correctly

### Debug Mode

Open browser console (F12) to see:
- API requests and responses
- Error messages
- State changes

## Next Steps

After successful login integration:

1. ✅ Login API integration complete
2. ✅ Token management setup
3. ✅ Protected routes configured
4. 🔄 Add role-based access control
5. 🔄 Implement token refresh logic
6. 🔄 Add logout functionality
7. 🔄 Build dashboard features

## API Response Validation

The login component expects this exact structure from your backend:

```javascript
// Success
{
  success: true,
  data: {
    user: { ...userObject },
    tokens: { accessToken, refreshToken }
  },
  message: "Login successful"
}

// Error
{
  success: false,
  message: "Error message here"
}
```

Make sure your backend API returns responses in this format!
