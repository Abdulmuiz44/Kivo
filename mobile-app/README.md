# Kivo Mobile App

React Native mobile application for Kivo Research Assistant, built with Expo.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for Android development)
- Expo Go app on your physical device (optional)

### Installation

```bash
cd mobile-app
pnpm install
```

### Running the App

```bash
# Start Expo development server
pnpm start

# Run on iOS Simulator
pnpm ios

# Run on Android Emulator
pnpm android

# Open in Expo Go (scan QR code with your phone)
# iOS: Use Camera app
# Android: Use Expo Go app
```

## 📱 Features

- **Research Form**: Create new research projects with topic and source selection
- **Real-time Progress**: Live updates during research processing
- **Results Dashboard**: View sentiment analysis, pain points, and topic clusters
- **Data Visualization**: Interactive charts for sentiment distribution
- **Export Options**: Download results as PDF or CSV
- **Dark Mode Support**: Automatic theme switching

## 🏗️ Project Structure

```
mobile-app/
├── app/
│   ├── _layout.tsx          # Root layout with navigation
│   ├── index.tsx             # Home screen (research form)
│   └── research/
│       └── [id].tsx          # Research results screen
├── assets/                   # Images, icons, fonts
├── app.json                  # Expo configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

## 🔧 Configuration

### API Backend

Update the API_BASE_URL in both screen files:

**Development:**

```typescript
const API_BASE_URL = 'http://localhost:3000';
```

**Production:**

```typescript
const API_BASE_URL = 'https://your-domain.vercel.app';
```

**Note for iOS Simulator:**

- Use `http://localhost:3000` for local development
- Make sure your Next.js backend is running

**Note for Android Emulator:**

- Use `http://10.0.2.2:3000` instead of `localhost`

**Note for Physical Devices:**

- Use your computer's IP address (e.g., `http://192.168.1.100:3000`)
- Make sure both devices are on the same network

## 📦 Building for Production

### iOS

```bash
# Build for iOS App Store
expo build:ios

# Or use EAS Build (recommended)
eas build --platform ios
```

### Android

```bash
# Build APK
expo build:android

# Or use EAS Build (recommended)
eas build --platform android
```

## 🎨 Customization

### App Icon & Splash Screen

- Replace `assets/icon.png` (1024x1024)
- Replace `assets/splash.png` (1284x2778 for iPhone 13 Pro Max)
- Replace `assets/adaptive-icon.png` (Android adaptive icon)

### App Name & Bundle ID

Edit `app.json`:

```json
{
  "name": "Your App Name",
  "slug": "your-app-slug",
  "ios": {
    "bundleIdentifier": "com.yourcompany.yourapp"
  },
  "android": {
    "package": "com.yourcompany.yourapp"
  }
}
```

## 🐛 Troubleshooting

### "Network request failed"

- Ensure your backend is running
- Check the API_BASE_URL is correct
- For physical devices, use your computer's IP address

### "Metro bundler error"

```bash
# Clear cache and restart
expo start -c
```

### "Unable to resolve module"

```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

## 📚 Tech Stack

- **Expo** - React Native framework
- **Expo Router** - File-based routing
- **React Native Chart Kit** - Data visualization
- **Axios** - HTTP client
- **TypeScript** - Type safety

## 🔗 Related

- [Main Project README](../README.md)
- [Backend API Documentation](../DEPLOYMENT.md)
- [Expo Documentation](https://docs.expo.dev/)
