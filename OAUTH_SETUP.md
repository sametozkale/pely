# OAuth Provider Setup Guide

## Firebase Console Configuration

For OAuth providers (Google and GitHub) to work, you need to configure them in the Firebase Console.

### 1. Enable Google Sign-In

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable** to ON
6. Enter your **Support email** (project support email)
7. Click **Save**

### 2. Enable GitHub Sign-In

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **GitHub** provider
3. Toggle **Enable** to ON
4. You'll need to create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - **Application name**: Your app name (e.g., "Pely AI")
   - **Homepage URL**: Your app URL (e.g., `http://localhost:3000` for dev)
   - **Authorization callback URL**: 
     - For development: `http://localhost:3000` or your Firebase auth domain
     - For production: Your production domain
   - Click "Register application"
   - Copy the **Client ID** and **Client Secret**
5. Back in Firebase Console, paste the **Client ID** and **Client Secret**
6. Click **Save**

### 3. Configure Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Make sure your domains are listed:
   - `localhost` (for development)
   - Your production domain
   - Your Firebase auth domain (automatically added)

### 4. Environment Variables

Make sure your `.env` file (or environment variables) includes:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Common Issues

#### Issue: "auth/popup-blocked"
- **Cause**: Browser blocked the popup
- **Solution**: Allow popups for your domain

#### Issue: "auth/unauthorized-domain"
- **Cause**: Domain not authorized in Firebase Console
- **Solution**: Add your domain to Authorized domains in Firebase Console

#### Issue: "auth/operation-not-allowed"
- **Cause**: OAuth provider not enabled in Firebase Console
- **Solution**: Enable the provider in Firebase Console > Authentication > Sign-in method

#### Issue: GitHub OAuth returns error
- **Cause**: Incorrect callback URL or Client ID/Secret
- **Solution**: 
  - Verify callback URL matches exactly (including http/https, port, trailing slash)
  - Double-check Client ID and Secret are correct
  - Make sure GitHub OAuth App is active

### 6. Testing

1. Start your dev server: `npm run dev`
2. Navigate to `/signin` or `/signup`
3. Click "Continue with Google" or "Continue with GitHub"
4. You should see a popup for authentication
5. After authentication, you should be redirected back to your app

### 7. Production Checklist

- [ ] Google Sign-In enabled in Firebase Console
- [ ] GitHub Sign-In enabled in Firebase Console
- [ ] Production domain added to Authorized domains
- [ ] GitHub OAuth App configured with production callback URL
- [ ] Environment variables set correctly for production
- [ ] Test OAuth flow in production environment

## Troubleshooting

If OAuth still doesn't work after following these steps:

1. Check browser console for errors
2. Verify Firebase configuration is correct
3. Check Firebase Console > Authentication > Users to see if sign-in attempts are logged
4. Ensure popups are not blocked by browser
5. Check network tab for failed requests

