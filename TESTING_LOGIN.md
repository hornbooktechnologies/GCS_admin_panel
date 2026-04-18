# Testing the Login Functionality

## Quick Test Guide

### Step 1: Ensure Backend is Running

Make sure your backend API is running and accessible at the URL specified in `.env`:
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### Step 2: Start the Frontend

```bash
npm start
```

The app will open at `http://localhost:3000` (or another port if 3000 is busy).

### Step 3: Test Login

1. Navigate to `http://localhost:3000/auth/login`
2. You should see:
   - Hornbook Technologies logo
   - "Sign in to your account" heading
   - Email and Password fields (left-aligned labels)
   - Blue LOGIN button

### Step 4: Enter Credentials

Enter your test credentials. For example:

**Admin User:**
```
Email: admin@example.com
Password: admin123
```

**HR User:**
```
Email: hr@example.com
Password: hr123
```

**Manager User:**
```
Email: manager@example.com
Password: manager123
```

### Step 5: Submit Form

Click the "LOGIN" button. You should see:
- Button shows a spinner while loading
- Button is disabled during submission

### Expected Results

#### ✅ Successful Login

1. **Toast Notification**: Green success message appears at top
2. **Redirect**: Automatically redirected to dashboard (`/`)
3. **LocalStorage**: Check browser DevTools → Application → Local Storage
   - Should see `accessToken`
   - Should see `refreshToken`
   - Should see `auth-storage` with user data
4. **Dashboard**: Shows welcome message with user's name

#### ❌ Failed Login

1. **Toast Notification**: Red error message appears
2. **Stay on Page**: Remains on login page
3. **No Redirect**: Does not navigate away

## Testing Different Scenarios

### Test 1: Valid Credentials
- **Input**: Correct email and password
- **Expected**: Success toast → Redirect to dashboard

### Test 2: Invalid Email Format
- **Input**: `notanemail` (without @)
- **Expected**: Red error message below email field: "Enter a valid email."

### Test 3: Empty Email
- **Input**: Leave email blank
- **Expected**: Red error message: "Email is required."

### Test 4: Empty Password
- **Input**: Leave password blank
- **Expected**: Red error message: "Password is required."

### Test 5: Wrong Credentials
- **Input**: Valid email format but wrong password
- **Expected**: Error toast from backend (e.g., "Invalid credentials")

### Test 6: Network Error
- **Input**: Stop backend server, try to login
- **Expected**: Error toast: "Network Error" or similar

## Checking API Calls in Browser

### Open DevTools (F12)

1. Go to **Network** tab
2. Try to login
3. Look for request to `/auth/login`
4. Click on it to see:
   - **Request Headers**: Should include `Content-Type: application/json`
   - **Request Payload**: Your email and password
   - **Response**: Backend's response data
   - **Status Code**: 200 (success) or 400/401 (error)

### Console Logs

Check the **Console** tab for any errors or warnings.

## Testing Role-Based Access

After successful login, verify the user role:

1. Open **DevTools** → **Application** → **Local Storage**
2. Find `auth-storage`
3. Check the `state` → `user` → `role`
4. Should be one of: `admin`, `hr`, or `manager`

## Testing Protected Routes

### Test 1: Access Dashboard Without Login
1. Open browser in incognito/private mode
2. Navigate directly to `http://localhost:3000/dashboard`
3. **Expected**: Redirected to `/auth/login`

### Test 2: Access Dashboard After Login
1. Login successfully
2. Navigate to `http://localhost:3000/dashboard`
3. **Expected**: Dashboard page loads

### Test 3: Logout
1. Click "Logout" button on dashboard
2. **Expected**: 
   - Redirected to `/auth/login`
   - LocalStorage cleared
   - Cannot access dashboard without logging in again

## Common Issues & Solutions

### Issue 1: "Network Error"
**Solution**: 
- Check if backend is running
- Verify API URL in `.env` file
- Check CORS settings on backend

### Issue 2: Login successful but redirects back to login
**Solution**:
- Check browser console for errors
- Verify tokens are being saved to localStorage
- Check Zustand store state

### Issue 3: CORS Error
**Solution**:
- Backend must allow requests from `http://localhost:3000`
- Add CORS middleware to backend

### Issue 4: "Invalid credentials" for correct password
**Solution**:
- Verify backend user data
- Check password hashing on backend
- Ensure test user exists in database

## Backend API Requirements

Your backend `/auth/login` endpoint MUST return:

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
      "role": "admin",
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

If your backend returns a different structure, you'll need to update the Login component to match.

## Next Steps After Successful Login Test

1. ✅ Login working
2. ✅ Tokens saved
3. ✅ Redirect to dashboard
4. 🔄 Test logout functionality
5. 🔄 Test token refresh
6. 🔄 Add role-based features
7. 🔄 Build dashboard components

## Need Help?

Check the detailed API integration guide: `API_INTEGRATION.md`
