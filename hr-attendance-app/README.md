# HR & Attendance Management - React Native App

A comprehensive HR and Attendance management system built with React Native and Expo.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android development)
- Expo CLI (optional but recommended)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Install Expo CLI globally (if not already installed):**
```bash
npm install -g @expo/cli
```

### Running the App

#### Option 1: Using Expo Go (Recommended for development)
```bash
npm start
```
- Scan the QR code with Expo Go app on your Android device
- Or press 'a' to open in Android emulator

#### Option 2: Development Build
```bash
npm run android
```

#### Option 3: iOS (if on macOS)
```bash
npm run ios
```

## 📱 Features

### 👨‍💼 Employee Features
- ✅ **Attendance Management**
  - Check-in/Check-out with timestamp
  - Field attendance with camera and GPS
  - Office attendance
  - Attendance history

- ✅ **Leave Management**
  - Apply for different types of leaves
  - View leave balance
  - Track leave request status
  - Department and HR approval workflow

- ✅ **Profile Management**
  - View personal information
  - Upload profile picture
  - Edit profile details

### 👩‍💼 HR Features
- ✅ **Employee Management**
  - View all employees
  - Add new employees
  - Employee details and profiles
  - Download employee reports

- ✅ **Attendance Tracking**
  - Monitor daily attendance
  - View attendance reports
  - Filter by date and company
  - Export attendance data

- ✅ **Leave Approval**
  - Review leave requests
  - Approve/Reject with reasons
  - Department and HR approval workflow
  - Leave reports and analytics

## 🔧 Configuration

### Environment Setup
The app connects to the API at: `https://local.api.mitrsewa.co/api/v1`

### Authentication
- Username format: Uppercase with numbers (e.g., MSFD001)
- JWT token-based authentication
- Secure token storage with Expo SecureStore

## 📁 Project Structure

```
hr-attendance-app/
├── app/                    # App screens and navigation
│   ├── (employee)/        # Employee dashboard screens
│   ├── (hr)/             # HR dashboard screens
│   ├── _layout.tsx       # Root layout
│   ├── index.tsx         # App entry point
│   └── login.tsx         # Login screen
├── stores/               # State management
├── lib/                  # Utilities and API
└── assets/              # Images and icons
```

## 🎨 UI Components

- **React Native Paper** for Material Design components
- **Expo Vector Icons** for consistent iconography
- **Custom styling** with responsive design
- **Toast notifications** for user feedback

## 📊 State Management

- **Zustand** for global state (auth, user data)
- **React Query** for server state and caching
- **Expo SecureStore** for secure token storage

## 🔐 Security Features

- JWT token authentication
- Secure token storage
- API request interceptors
- Permission-based routing
- Input validation

## 📱 Mobile Features

- **Camera integration** for field attendance
- **GPS location** tracking
- **Image picker** for profile uploads
- **Offline-ready** architecture
- **Push notifications** ready

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
```bash
npx expo start --clear
```

2. **Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

3. **Dependencies issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Development Tips

- Use **Expo Go** for faster development
- Enable **hot reload** for instant updates
- Use **Flipper** for debugging
- Test on **real devices** for camera/GPS features

## 📦 Build for Production

### Android APK
```bash
expo build:android
```

### Android App Bundle (recommended)
```bash
expo build:android -t app-bundle
```

## 🚀 Deployment

1. **Google Play Store** - Upload the generated APK/AAB
2. **Internal distribution** - Share APK directly
3. **Expo Updates** - OTA updates for published apps

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Expo documentation
- Check React Native documentation

## 🔄 Updates

The app supports over-the-air updates through Expo Updates for seamless user experience.