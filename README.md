<div align="center">

# 🌱 AdBeam Recycling Mobile App V2

### *Transforming Campus Recycling Through Gamification & Rewards*

[![React Native](https://img.shields.io/badge/React%20Native-v0.73-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-v50-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Version:** 1.0.0 | **Build:** 2024.10.31 | **Developer:** AdBeam Team

[Features](#-features) • [Screenshots](#-screenshots) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Team](#-team)

---

</div>

## 🎯 Problem Statement

Land pollution remains a critical challenge in university campuses, with traditional cleanup campaigns failing to create lasting behavioral change. Students lack incentives to recycle consistently, and existing programs don't leverage the mobile-first lifestyle of modern college students.

## 💡 The Solution

**AdBeam Mobile** is an innovative React Native application that gamifies recycling by rewarding students with redeemable points for scanning recyclable items. By making recycling as simple as taking a photo and as rewarding as earning credits toward campus perks, we're building sustainable habits that extend beyond graduation.

---

## ✨ Features

### 🎥 **Instant Barcode Scanning**
- Real-time camera integration using Expo Camera
- Advanced barcode recognition for recyclable items
- Material type classification (Paper, Plastic, Glass, Aluminum)
- Duplicate detection to prevent abuse
- Works in low-light conditions with flash support

### 💰 **Smart Points & Rewards System**
- **Points per Material:**
  - 📄 Paper/Cardboard: +3 points
  - 🍾 Plastic Bottles: +5 points
  - 🥫 Aluminum Cans: +7 points
  - 🍷 Glass Bottles: +10 points
- Real-time point accumulation
- 57 progressive levels with increasing thresholds
- Rewards marketplace with campus perks
- QR-based voucher redemption system

### 📊 **Comprehensive Dashboards**

#### 👤 **User Dashboard**
- Real-time eco-points and level progress
- Weekly recycling stats with percentage changes
- Campus leaderboard ranking with streak tracking
- Environmental impact metrics (CO₂ saved)
- Live weather and air quality data (OpenWeather API)
- Environmental news feed integration

#### 👨‍💼 **Admin Dashboard**
- Total users, items recycled, and points analytics
- Top recyclers leaderboard with detailed stats
- Rewards management (create, edit, delete, stock control)
- User management with role assignment (User/Staff/Admin)
- Bonus event creation for engagement campaigns
- Real-time system overview with beautiful visualizations

#### 👷 **Staff Dashboard**
- Dedicated voucher scanner for reward redemption
- QR code verification system
- Real-time redemption processing
- Transaction history tracking

### 🎮 **Gamification Elements**
- **Streak Tracking:** Consecutive recycling days bonus
- **Achievement Badges:** Milestone celebrations
- **Campus Leaderboard:** Competitive rankings
- **Level Progression:** 57 levels of eco-warrior advancement
- **Social Sharing:** Share environmental impact achievements

### 🔔 **Smart Notifications**
- Welcome notifications for new users
- Scan reminders to maintain streaks
- Reward alerts when new perks are available
- Achievement badges celebrations
- Leaderboard updates and competitions
- Weekly recycling impact summaries
- **48+ push notifications** for maximum engagement

### 🎨 **Beautiful UI/UX**
- Modern gradient-based design system
- Smooth animations and transitions
- Haptic feedback for tactile responses
- Sound effects for actions and alerts
- Dark mode support (coming soon)
- Accessibility features (VoiceOver, high contrast)

### 🔐 **Security & Authentication**
- Firebase Authentication (Email/Password)
- Forgot password with email reset
- Role-based access control (User/Staff/Admin)
- Secure local data storage
- Real-time database rules for data protection
- Anti-fraud barcode locking system

---

## 📱 Screenshots

### 👤 User Dashboard

<div align="center">
  <img src="InAppScreenshots/dashboard-main.jpg" width="270" alt="Main Dashboard" />
  <img src="InAppScreenshots/dashboard-stats.jpg" width="270" alt="Dashboard Stats" />
  <img src="InAppScreenshots/dashboard-weekly-insights.jpg" width="270" alt="Weekly Insights" />
</div>

<p align="center"><em>Level 57 Eco Warrior • 5,611 points • 25 items recycled • #8 campus rank • 12.5 kg CO₂ saved • Live weather & environmental news</em></p>

---

### 📸 Scanner Experience

<div align="center">
  <img src="InAppScreenshots/scanner-active.jpg" width="270" alt="Active Scanner" />
  <img src="InAppScreenshots/scanner-interface.jpg" width="270" alt="Scanner Interface" />
  <img src="InAppScreenshots/scanner-material-selection.jpg" width="270" alt="Material Selection" />
</div>

<p align="center"><em>Real-time barcode scanning with green frame • "Never scanned before" verification • Material selection (Paper +3, Plastic +5, Aluminum +7, Glass +10)</em></p>

---

### 🎁 Rewards & Vouchers

<div align="center">
  <img src="InAppScreenshots/rewards-marketplace.jpg" width="270" alt="Rewards Marketplace" />
  <img src="InAppScreenshots/vouchers-my-vouchers.jpg" width="270" alt="My Vouchers" />
  <img src="InAppScreenshots/vouchers-qr-code.jpg" width="270" alt="Voucher QR Code" />
</div>

<p align="center"><em>Eco Rewards marketplace • 13 active vouchers • QR code redemption • Campus cafeteria vouchers, water bottles, T-shirts</em></p>

---

### 👨‍💼 Admin Dashboard & Management

<div align="center">
  <img src="InAppScreenshots/admin-dashboard.jpg" width="270" alt="Admin Overview" />
  <img src="InAppScreenshots/admin-rewards-management.jpg" width="270" alt="Rewards Management" />
  <img src="InAppScreenshots/notifications_settings.jpg" width="270" alt="Notifications Settings" />
</div>

<p align="center"><em>Admin analytics: 14 users, 43 items, 10,757 points • Top recyclers leaderboard • Rewards management with bonus events • Granular notification controls</em></p>

---

### ➕ Create & Edit Rewards

<div align="center">
  <img src="InAppScreenshots/admin-create-reward.jpg" width="270" alt="Create Reward" />
  <img src="InAppScreenshots/admin-edit-reward.jpg" width="270" alt="Edit Reward" />
  <img src="InAppScreenshots/admin-edit-user.jpg" width="270" alt="Edit User" />
</div>

<p align="center"><em>Create reward form with categories • Edit stock & availability toggle • User profile editing with role management (Admin/Staff/User)</em></p>

---

### 👤 Profile & Settings

<div align="center">
  <img src="InAppScreenshots/user-profile.jpg" width="270" alt="User Profile" />
  <img src="InAppScreenshots/developer-tools.jpg" width="270" alt="Developer Tools" />
  <img src="InAppScreenshots/admin-users-list.jpg" width="270" alt="Admin Users List" />
</div>

<p align="center"><em>Profile with admin badge • Developer tools (test notifications, add points) • 2,824 total points • 9 items recycled • Admin users management</em></p>

---

### ⚙️ App Settings & Configuration

<div align="center">
  <img src="InAppScreenshots/app-settings.jpg" width="270" alt="App Settings" />
  <img src="InAppScreenshots/settings page.jpg" width="270" alt="Settings Menu" />
  <img src="InAppScreenshots/privacy page.jpg" width="270" alt="Privacy Page" />
</div>

<p align="center"><em>Sound effects & haptic feedback toggles • App info (v1.0.0, Build 2024.10.31) • Privacy settings and terms</em></p>

---

### 👷 Staff Voucher Scanner

<div align="center">
  <img src="InAppScreenshots/staff-voucher-scanner.jpg" width="270" alt="Voucher Scanner" />
  <img src="InAppScreenshots/scanner-processing.jpg" width="270" alt="Processing Scan" />
  <img src="InAppScreenshots/achievements-page.jpg" width="270" alt="Achievements Page" />
</div>

<p align="center"><em>Staff voucher QR scanner • "Point camera at student's voucher QR code" • Scanner processing interface • Achievements & badges page</em></p>

---

## 🏗️ Tech Stack

### **Frontend**
- **React Native** - Cross-platform mobile framework
- **Expo SDK 50** - Development toolchain and managed workflow
- **React Navigation** - Native navigation library
- **Expo Camera** - Barcode/QR scanning
- **React Native Linear Gradient** - Beautiful gradient UI
- **Expo Notifications** - Push notification system
- **Expo Haptics** - Tactile feedback
- **Expo AV** - Sound effects

### **Backend & Services**
- **Firebase Authentication** - User authentication & management
- **Firebase Realtime Database** - Real-time data synchronization
- **Firestore** - Document-based NoSQL database
- **OpenWeather API** - Live weather & air quality data
- **GNews API** - Environmental news integration

### **Development Tools**
- **Expo CLI** - Development server and build tools
- **EAS Build** - Cloud-based builds for iOS/Android
- **Git & GitHub** - Version control and collaboration
- **VS Code / IntelliJ IDEA** - Development environments

---

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)
- Physical device or emulator

### Quick Start

```bash
# Clone the repository
git clone https://github.com/siba18k/Adbeam_Recycling_MobileApp_V2.git

# Navigate to project directory
cd Adbeam_Recycling_MobileApp_V2

# Install dependencies
npm install
# or
yarn install

# Start the development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

### Firebase Configuration

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Realtime Database and Firestore
4. Copy your Firebase config to `src/config/firebase.js`
5. Set up Firebase rules from `firebase-rules.json`

```javascript
// src/config/firebase.js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Environment Variables

Create a `.env` file in the root directory:

```env
OPENWEATHER_API_KEY=your_openweather_api_key
GNEWS_API_KEY=your_gnews_api_key
```

---

## 🏗️ Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

### iOS IPA

```bash
# Build for iOS
eas build --platform ios --profile production
```

---

## 🎮 How It Works

### For Students (Users)

1. **Sign Up** with your university email (@student.uj.ac.za)
2. **Scan** recyclable items using the in-app camera
3. **Select** material type (Paper, Plastic, Glass, Aluminum)
4. **Earn** points instantly based on material value
5. **Level Up** through 57 progressive ranks
6. **Redeem** rewards at the campus marketplace
7. **Compete** on the campus leaderboard
8. **Track** your environmental impact in real-time

### For Staff

1. **Login** with staff credentials
2. **Access** the voucher scanner
3. **Scan** student QR codes to redeem rewards
4. **Verify** voucher authenticity
5. **Process** redemptions in real-time

### For Administrators

1. **Login** with admin credentials
2. **Monitor** system-wide analytics
3. **Manage** users, rewards, and vouchers
4. **Create** bonus events and campaigns
5. **Assign** roles (User/Staff/Admin)
6. **Track** campus recycling trends

---

## 📊 Key Metrics

- **14 Active Users** across University of Johannesburg
- **43 Items Recycled** preventing landfill waste
- **10,757 Total Points** earned by eco-warriors
- **18 Active Vouchers** ready for redemption
- **12.5 kg CO₂ Saved** through collective effort
- **5 Material Categories** with dynamic point values
- **Level 57 Top User** demonstrating sustained engagement
- **48+ Notifications** keeping users engaged

---

## 🔐 Security Features

- **Barcode Locking:** Items can only be scanned once to prevent abuse
- **Geolocation Verification:** Campus boundary enforcement (future)
- **Role-Based Access:** Three-tier permission system (User/Staff/Admin)
- **Firebase Rules:** Strict database read/write permissions
- **Encrypted Communications:** All data transmitted via HTTPS
- **Biometric Auth:** Fingerprint/Face ID support (planned)

---

## 🗺️ Roadmap

### ✅ Phase 1: Core Functionality (Complete)
- ✅ Barcode scanning with real camera integration
- ✅ User registration and authentication
- ✅ Basic rewards redemption
- ✅ Push notification system
- ✅ Admin dashboard with analytics
- ✅ Staff voucher scanner
- ✅ Developer testing tools

### 🚧 Phase 2: Enhanced Features (In Progress)
- 🚧 Social features for sharing achievements
- 🚧 Campus recycling challenges and competitions
- 🚧 Advanced analytics and impact visualization
- 🚧 Integration with campus event systems

### 🔮 Phase 3: Smart Integration (Planned)
- 🔮 IoT integration with smart recycling bins
- 🔮 AR features for identifying recyclable items
- 🔮 Voice commands for accessibility
- 🔮 Multi-campus deployment
- 🔮 Blockchain-based credit verification
- 🔮 Machine learning for improved item recognition

---

## 👥 Team

### AdBeam Corporation

| Role | Name | Student Number | GitHub |
|------|------|---------------|--------|
| **Group Leader & Lead Developer** | ST Dube (Sibahle) | 223003057 | [@siba18k](https://github.com/siba18k) |
| **Developer** | L Mbokazi | 223153718 | - |
| **Developer** | AD Mnamateli | 223029043 | - |
| **Developer** | NW Dlamini | 224019401 | - |
| **Developer** | LSM Masalesa (Lebohang) | 223014114 | [@Lebohang01](https://github.com/Lebohang01) |
| **Developer** | BG Simango | 224095653 | - |

**Institution:** University of Johannesburg  
**Semester:** 2nd Semester 2025  
**Course:** Development Software (DSW)

---

## 🤝 Contributing

We welcome contributions from the UJ community! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **University of Johannesburg** - For supporting sustainable campus initiatives
- **Firebase** - For providing robust backend infrastructure
- **Expo Team** - For an amazing React Native development platform
- **OpenWeather** - For environmental data API access
- **All Beta Testers** - For invaluable feedback and support

---

## 📞 Contact & Support

- **Project Repository:** [github.com/siba18k/Adbeam_Recycling_MobileApp_V2](https://github.com/siba18k/Adbeam_Recycling_MobileApp_V2)
- **Lead Developer:** Sibahle Dube - dubesibahle4@gmail.com
- **University Email:** test@student.uj.ac.za
- **Organization:** AdBeam Corporation

---

## 🌍 Impact Statement

> *"When recycling becomes as easy as scanning a barcode, and as rewarding as earning credits toward meaningful rewards, environmental consciousness becomes a natural part of daily campus life."*

By leveraging the power of smartphones and mobile technology, we're not just reducing campus waste—**we're building sustainable habits that students will carry with them long after graduation.**

---

<div align="center">

### 🌱 Made with 💚 by AdBeam Corporation

**Transforming Recycling • One Scan at a Time**

[![GitHub stars](https://img.shields.io/github/stars/siba18k/Adbeam_Recycling_MobileApp_V2?style=social)](https://github.com/siba18k/Adbeam_Recycling_MobileApp_V2/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/siba18k/Adbeam_Recycling_MobileApp_V2?style=social)](https://github.com/siba18k/Adbeam_Recycling_MobileApp_V2/network/members)

</div>
