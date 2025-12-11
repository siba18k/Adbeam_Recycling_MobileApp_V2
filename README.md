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

> **Note:** To add screenshots to this README, upload your screenshot images to the repository (e.g., in `assets/screenshots/` folder) and update the image links below.

### Authentication & Onboarding

*Clean authentication flow with University of Johannesburg email integration*

**Features shown:**
- User profile with administrator badge
- App settings (Sound Effects, Haptic Feedback)
- Privacy and notification settings
- Developer tools for testing

---

### User Experience

*Level 57 Eco Warrior | 5,611 Points | 25 Items Recycled | #8 Campus Rank*

**Dashboard highlights:**
- **Welcome Section:** Personalized greeting with level badge and plant emoji 🌱
- **Progress Tracking:** 5,611/5,800 points to Level 58 with progress bar
- **Eco Points Card:** 5,611 total points with star icon ⭐
- **Items Scanned:** 25 total items recycled 🍃
- **Environmental Impact:** 12.5 kg CO₂ saved ☁️
- **Campus Leaderboard:** #8 ranking with 0 day streak ⚡
- **Live Data:** Weather (12°C), Air Quality (44), Humidity (81%) for Johannesburg
- **Environmental News:** Real-time updates from green sources

---

### Scanning Experience

*"Never scanned before" detection • Material type classification • Instant point rewards*

**Scanning workflow:**
1. **Camera Scanner:** Real-time barcode detection with green targeting frame
2. **Item Verification:** "This item is new to our system! What material type is it?"
3. **Verified Barcode:** 6009881091149 - Never scanned before ✅
4. **Material Selection:**
   - 📄 Paper/Cardboard - Boxes, newspapers, magazines (+3 points)
   - 🍾 Plastic Bottles - Water bottles, soda bottles (+5 points)
   - 🥫 Aluminum Cans - Beverage cans (+7 points)
   - 🍷 Glass - Bottles and jars (+10 points)
5. **Success Confirmation:** Points added with celebration animation

**Smart Features:**
- "Checking item history..." real-time validation
- Duplicate prevention system
- Sound effects toggle 🔇
- Haptic feedback toggle 🔊
- Instant dashboard update button

---

### Rewards & Vouchers

*5,616 points available • 13 active vouchers • QR-based redemption system*

**Rewards Marketplace:**
- **Juice** - Beverage (15 pts) - Redeem ✅
- **Campus Cafeteria Voucher** - R50 off any meal (500 pts) - Redeem ✅
- **Eco-Friendly Water Bottle** - Reusable stainless steel (800 pts) - Redeem ✅
- **Green Campus T-Shirt** - Organic cotton recycling awareness (1200 pts) - Redeem ✅

**My Vouchers:**
- 13 total vouchers ready to use
- **Eco-Friendly Water Bottle** voucher displayed
  - Code: #ADV-MJ1ACZIS-ZYUQQE
  - QR code for staff scanning
  - "Ready to Use" badge 🎫
  - Share Voucher functionality 📤

---

### Admin & Staff Tools

*14 total users • 43 items recycled • 10,757 points earned • 18 active vouchers*

**Admin Dashboard Overview:**
- **Total Users:** 14 👥
- **Items Recycled:** 43 🍃
- **Active Vouchers:** 18 🎫
- **Points Earned:** 10,757 ⭐

**Top Recyclers Leaderboard:**
1. 🥇 **Ugene** - 5,611 pts
2. 🥈 **Nkosilenhle** - 505 pts
3. 🥉 **Lindile** - 12 pts

**Rewards Management:**
- **Create New Reward** form with:
  - Reward Name (required)
  - Description (required)
  - Points Required (required)
  - Category (merchandise, food, voucher)
  - Stock Quantity (default: 100)
  - Create Reward button ✅

- **Edit Reward** functionality:
  - Example: Juice - Beverage - 15 pts - Food & drinks category - Stock: 50
  - Toggle availability for redemption
  - Update/Delete options ✏️🗑️

**User Management:**
- Search users by name, email, or role
- **User Cards** showing:
  - Name, email, role badge (user/staff/admin)
  - Points and level
  - Scan count
  - Edit ✏️, Promote ⬆️, Delete 🗑️ actions

- **Edit User** form:
  - Display Name
  - Email
  - Points (manual adjustment)
  - Level
  - User Role selection (User/Staff/Admin)
  - Example: Batman (batman😝@student.uj.ac.za) - 985 pts - Level 10 - Admin role

**Staff Voucher Scanner:**
- Full-screen QR scanner
- "Point camera at student's voucher QR code"
- Ready to scan indicator
- Reset and Back buttons
- Instant redemption processing

**Bonus Events:**
- Create special point multiplier campaigns
- Time-limited recycling challenges
- Campus-wide competitions

---

### Weekly Insights & Analytics

**Weekly Report Card:**
- **Total Recycled:** 23 items (📈 15% vs last week)
- **Goal Achievement:** 2 of 7 days (📉 12% vs last week)
- Visual trend indicators with percentage changes

**Environmental News Feed:**
- Real-time articles from Pypi.org, IPWatchdog.com, mindbodygreen.com
- "View All Environmental News" button 🔗
- Refresh capability for latest updates

---

### Notifications & Settings

*48 notifications • Granular notification controls • Developer testing tools*

**Notification Center:**
- **Welcome to Adbeam! 🌱** - "Hi Eco Warrior! Ready to make a difference? Start by scanning your first recyclable item..."
- Timestamp tracking ("Just now", "4m ago")
- Mark all as read ✅
- Delete all 🗑️
- Mute notifications 🔕
- Notification count badge (48)

**Notification Types Settings:**
- 🔔 **Scan Reminders** - Weekly reminders to recycle items (ON)
- 🎁 **Reward Alerts** - Notify when new rewards are available (ON)
- 🏆 **Achievement Badges** - Celebrate your eco-milestones (ON)
- 📊 **Leaderboard Updates** - Ranking changes and competitions (ON)
- 📈 **Weekly Report** - Your recycling impact summary (ON)

**Developer Tools:**
- 🔔 **Test Notification** - Send test push notification
- ➕ **Add Test Points** - Add points for testing purposes (default: 1000)
  - Input field for custom amount
  - "Add" button for instant credit
- 🔄 **Reset Points** - Reset all points to 0 (destructive)

**System Information:**
```
Environment: Production
Platform: android
Device: Physical Device
Notifications: Full Support
```

**App Settings:**
- ⚙️ **Settings** - App preferences and configuration
- 🔒 **Privacy** - Data privacy and security settings
- 💾 **Free up storage space** option

**App Information:**
- **Version:** 1.0.0
- **Build:** 2024.10.31
- **Developer:** AdBeam Team
- 🔄 **Reset Settings** - Reset all settings to default values

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
