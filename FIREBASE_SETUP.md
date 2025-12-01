# Firebase Setup Guide

## Required Firebase Console Configuration

### 1. Enable Anonymous Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **Pely**
3. Navigate to **Authentication** > **Sign-in method**
4. Find **Anonymous** in the list
5. Click on it and toggle **Enable** to ON
6. Click **Save**

**Note:** Anonymous authentication is required for the app to work properly. It allows users to use the app without signing in, and their data can be migrated when they create an account.

### 2. Enable Google Sign-In

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google**
3. Toggle **Enable** to ON
4. Enter your **Support email** (project support email)
5. Click **Save**

### 3. Enable GitHub Sign-In

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **GitHub**
3. Toggle **Enable** to ON
4. You'll need to create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - **Application name**: Pely AI
   - **Homepage URL**: `http://localhost:3000` (for dev) or your production URL
   - **Authorization callback URL**: 
     - For development: `http://localhost:3000` or `https://pelyai.firebaseapp.com/__/auth/handler`
     - For production: Your production domain
   - Click "Register application"
   - Copy the **Client ID** and **Client Secret**
5. Back in Firebase Console, paste the **Client ID** and **Client Secret**
6. Click **Save**

### 4. Configure Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Make sure these domains are listed:
   - `localhost` (for development)
   - Your production domain
   - `pelyai.firebaseapp.com` (Firebase auth domain - automatically added)

### 5. Firestore Security Rules

Make sure your Firestore security rules allow authenticated users to access their data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Environment Variables

Make sure your `.env` file contains:

```env
VITE_FIREBASE_API_KEY=AIzaSyCTK0thwxR2WmognLo3XCWYEYmThy8zBsA
VITE_FIREBASE_AUTH_DOMAIN=pelyai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pelyai
VITE_FIREBASE_STORAGE_BUCKET=pelyai.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=881516192888
VITE_FIREBASE_APP_ID=1:881516192888:web:52c96bace32f382575f98d
```

## Troubleshooting

### Error: auth/admin-restricted-operation

**Cause:** Anonymous authentication is not enabled in Firebase Console.

**Solution:** Enable Anonymous authentication in Firebase Console > Authentication > Sign-in method.

### Error: Cross-Origin-Opener-Policy

**Cause:** OAuth popups require proper COOP headers.

**Solution:** The Vite config has been updated with `Cross-Origin-Opener-Policy: same-origin-allow-popups`. Make sure to restart your dev server after changes.

### Error: auth/unauthorized-domain

**Cause:** Your domain is not in the authorized domains list.

**Solution:** Add your domain to Firebase Console > Authentication > Settings > Authorized domains.

### Error: auth/operation-not-allowed

**Cause:** The sign-in provider is not enabled.

**Solution:** Enable the provider in Firebase Console > Authentication > Sign-in method.

## Testing Checklist

- [ ] Anonymous authentication enabled
- [ ] Google sign-in enabled
- [ ] GitHub sign-in enabled (if using)
- [ ] Authorized domains configured
- [ ] Environment variables set correctly
- [ ] Dev server restarted after config changes
- [ ] Test OAuth flow in browser
- [ ] Check browser console for errors

