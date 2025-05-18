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

1. Make sure you have Firebase configured in your project
2. The Firebase configuration is already set up in `src/firebase.js`
3. Both Firestore and Realtime Database rules should allow authenticated users to read/write

## Development

To run the application locally:

```
npm install
npm run dev
```
