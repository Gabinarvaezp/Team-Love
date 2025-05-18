# Hubby Wifey Finances

## Firebase Real-Time Sync

This application uses Firebase for real-time synchronization between users. When one user (Jorgie) adds a transaction from their device, it will automatically appear on the other user's (Gabby) device in real-time.

### Features

- **Real-time Data Sync**: All transactions, user profiles, and goals are synchronized in real-time between devices
- **User Authentication**: Secure login with Firebase Authentication
- **Cloud Storage**: Images and files are stored securely in Firebase Storage
- **Multiple Currencies**: Support for both USD and COP currencies with automatic conversion

### How It Works

1. When a user logs in, their profile is loaded from Firestore and synchronized to Firebase Realtime Database
2. When a transaction is added or modified:
   - The data is saved to Firestore for persistence
   - The data is also pushed to the Realtime Database for instant synchronization
   - Other devices receive the update immediately through Realtime Database listeners
3. User profiles and settings are also synchronized in real-time

### Technical Implementation

The app uses two Firebase services for data management:
- **Firestore**: For persistent data storage and complex queries
- **Realtime Database**: For instant synchronization between devices

## Setup

1. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
   VITE_FIREBASE_DATABASE_URL=your_database_url_here
   ```

2. Both Firestore and Realtime Database rules should allow authenticated users to read/write

## Development

To run the application locally:

```
npm install
npm run dev
```

## Security Note

Never commit your Firebase API keys or any sensitive credentials to GitHub. Always use environment variables to store sensitive information.
