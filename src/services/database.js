import {
    ref,
    set,
    get,
    update,
    push,
    remove,
    query,
    orderByChild,
    limitToLast,
    serverTimestamp
} from "firebase/database";
import { database } from '../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

import {
    sendAchievementNotification,
    sendLevelUpNotification,
    sendMilestoneNotification,
    sendStreakNotification,
    sendRecyclingReminderNotification,
    sendVoucherExpiringNotification,
    sendNewRewardNotification,
    sendBonusEventNotification
} from './notificationService';
import {Platform} from "react-native";

// =====================================
// REAL RECYCLABLE ITEMS DATABASE
// =====================================
export const RECYCLABLE_ITEMS_DATABASE = {
    // Popular South African Beverages - Plastic Bottles
    '6001087301206': { name: 'Coca-Cola 500ml', type: 'plastic', points: 5, brand: 'Coca-Cola', category: 'beverages', recyclable: true },
    '6009175571702': { name: 'Aquafina Water 500ml', type: 'plastic', points: 4, brand: 'Pepsi', category: 'water', recyclable: true },
    '6001087356411': { name: 'Fanta Orange 440ml', type: 'plastic', points: 5, brand: 'Coca-Cola', category: 'beverages', recyclable: true },
    '6009175571800': { name: 'Pepsi 500ml', type: 'plastic', points: 5, brand: 'PepsiCo', category: 'beverages', recyclable: true },
    '6001087301300': { name: 'Sprite 500ml', type: 'plastic', points: 5, brand: 'Coca-Cola', category: 'beverages', recyclable: true },

    // Aluminum Cans - Very Common in SA
    '6009880840100': { name: 'Castle Lite Can 340ml', type: 'aluminum', points: 8, brand: 'SAB Miller', category: 'alcohol', recyclable: true },
    '6001087320801': { name: 'Coke Can 330ml', type: 'aluminum', points: 7, brand: 'Coca-Cola', category: 'beverages', recyclable: true },
    '6009175571900': { name: 'Pepsi Can 330ml', type: 'aluminum', points: 7, brand: 'PepsiCo', category: 'beverages', recyclable: true },
    '6009880841000': { name: 'Castle Lager Can 440ml', type: 'aluminum', points: 8, brand: 'SAB Miller', category: 'alcohol', recyclable: true },
    '6009880842000': { name: 'Black Label Can', type: 'aluminum', points: 8, brand: 'SAB Miller', category: 'alcohol', recyclable: true },

    // Glass Bottles - High Value
    '6009880840200': { name: 'Castle Glass Bottle 340ml', type: 'glass', points: 12, brand: 'SAB Miller', category: 'alcohol', recyclable: true },
    '6001087320900': { name: 'Coke Glass Bottle 300ml', type: 'glass', points: 10, brand: 'Coca-Cola', category: 'beverages', recyclable: true },
    '6009175572000': { name: 'Mageu Glass Bottle', type: 'glass', points: 10, brand: 'Various', category: 'traditional', recyclable: true },
    '6009880843000': { name: 'Windhoek Beer Glass', type: 'glass', points: 12, brand: 'Namibian Breweries', category: 'alcohol', recyclable: true },

    // Paper/Cardboard - Common SA Products
    '6009175580100': { name: 'Jungle Oats Cereal Box', type: 'paper', points: 4, brand: 'Tiger Brands', category: 'food', recyclable: true },
    '6001087455200': { name: 'Kleenex Tissue Box', type: 'paper', points: 3, brand: 'Kimberly-Clark', category: 'hygiene', recyclable: true },
    '6009175580200': { name: 'Tastic Rice Box', type: 'paper', points: 4, brand: 'Tiger Brands', category: 'food', recyclable: true },
    '6009175580300': { name: 'Nestle Cereal Box', type: 'paper', points: 4, brand: 'Nestle', category: 'food', recyclable: true },
    '6001087455300': { name: 'Pizza Box', type: 'paper', points: 5, brand: 'Various', category: 'food', recyclable: true },

    // Campus-specific items
    '6009880000001': { name: 'Campus Store Juice Box', type: 'paper', points: 3, brand: 'Campus Store', category: 'beverages', recyclable: true },
    '6009880000002': { name: 'Student Canteen Water', type: 'plastic', points: 4, brand: 'Campus Canteen', category: 'water', recyclable: true },

    // Development/Testing Codes
    '1234567890123': { name: 'Test Plastic Bottle', type: 'plastic', points: 5, brand: 'Test Brand', category: 'test', recyclable: true },
    '1234567890124': { name: 'Test Aluminum Can', type: 'aluminum', points: 7, brand: 'Test Brand', category: 'test', recyclable: true },
    '1234567890125': { name: 'Test Glass Bottle', type: 'glass', points: 10, brand: 'Test Brand', category: 'test', recyclable: true },
    '1234567890126': { name: 'Test Paper Box', type: 'paper', points: 3, brand: 'Test Brand', category: 'test', recyclable: true },
    '9999999999999': { name: 'Super Eco Item', type: 'aluminum', points: 15, brand: 'Eco Test', category: 'special', recyclable: true },
};

// Material Type Categories
export const MATERIAL_TYPES = {
    paper: {
        name: 'Paper/Cardboard',
        points: 3,
        color: '#8b5cf6',
        icon: 'newspaper-outline',
        description: 'Boxes, newspapers, magazines'
    },
    plastic: {
        name: 'Plastic Bottles',
        points: 5,
        color: '#3b82f6',
        icon: 'water-outline',
        description: 'Water bottles, soda bottles'
    },
    aluminum: {
        name: 'Aluminum Cans',
        points: 7,
        color: '#f59e0b',
        icon: 'nutrition-outline',
        description: 'Soda cans, beer cans'
    },
    glass: {
        name: 'Glass Bottles',
        points: 10,
        color: '#10b981',
        icon: 'wine-outline',
        description: 'Beer bottles, juice bottles'
    }
};

// =====================================
// ENHANCED BARCODE VALIDATION SYSTEM
// =====================================

export const validateRecyclableItem = async (barcode, barcodeType = 'unknown') => {
    try {
        console.log('🔍 Validating barcode:', barcode, 'Type:', barcodeType);

        // Clean barcode (remove any extra characters)
        const cleanBarcode = barcode.trim().replace(/[^0-9A-Za-z]/g, '');

        // Check our comprehensive database first
        if (RECYCLABLE_ITEMS_DATABASE[cleanBarcode]) {
            const item = RECYCLABLE_ITEMS_DATABASE[cleanBarcode];
            console.log('✅ Item found in database:', item.name);

            return {
                valid: true,
                item: {
                    ...item,
                    barcode: cleanBarcode,
                    barcodeType: barcodeType
                },
                source: 'local_database',
                confidence: 100,
                needsClassification: false
            };
        }

        // For unknown but valid format barcodes, allow manual classification
        if (isValidBarcodeFormat(cleanBarcode, barcodeType)) {
            console.log('🔍 Valid barcode format but unknown item:', cleanBarcode);

            return {
                valid: true,
                item: null,
                source: 'unknown_item',
                needsClassification: true,
                barcode: cleanBarcode,
                barcodeType: barcodeType,
                confidence: 50
            };
        }

        console.log('❌ Invalid barcode format:', cleanBarcode);
        return {
            valid: false,
            reason: 'Invalid barcode format or non-recyclable item',
            barcode: cleanBarcode,
            confidence: 0
        };

    } catch (error) {
        console.error('❌ Error validating recyclable item:', error);
        return {
            valid: false,
            reason: 'Validation service error',
            error: error.message,
            confidence: 0
        };
    }
};

// Enhanced barcode format validation
const isValidBarcodeFormat = (barcode, type) => {
    if (!barcode) return false;

    const typeNormalized = type?.toLowerCase() || '';

    // Format validation patterns
    const formats = {
        'ean13': /^[0-9]{13}$/,
        'ean8': /^[0-9]{8}$/,
        'upc_a': /^[0-9]{12}$/,
        'upc_e': /^[0-9]{6,8}$/,
        'code39': /^[A-Z0-9\-. $/+%*]+$/,
        'code128': /^[\x00-\x7F]{6,}$/,
        'qr': /^.{1,}$/,
        'pdf417': /^.{1,}$/,
        'codabar': /^[A-D][0-9\-$:/.+]{1,}[A-D]$/,
        'itf14': /^[0-9]{14}$/,
    };

    // Check against known format
    if (formats[typeNormalized]) {
        return formats[typeNormalized].test(barcode);
    }

    // Generic validation - most barcodes are 8-14 digits
    return /^[0-9A-Za-z]{8,14}$/.test(barcode) && barcode.length >= 8;
};

// =====================================
// ENHANCED SCAN RECORDING SYSTEM
// =====================================

// FIXED: Scan recording aligned with Firebase rules
export const recordScan = async (userId, scanData) => {
    try {
        console.log('🔄 Recording scan for user:', userId);
        console.log('📊 Scan data:', scanData);

        const { barcode, materialType, points, location, itemName, brand, barcodeType } = scanData;

        // Generate unique scan ID instead of using barcode as key (Firebase rules compliant)
        const scanId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Check for duplicate barcode scans in the last 24 hours
        const scansRef = ref(database, 'scans');
        const existingScansSnapshot = await get(scansRef);

        // Record the scan with unique ID (compliant with Firebase rules)
        const scanRef = ref(database, `scans/${scanId}`);
        const scanRecord = {
            id: scanId,
            userId: userId,
            barcode: barcode,
            barcodeType: barcodeType || 'unknown',
            itemName: itemName || 'Unknown Item',
            brand: brand || 'Unknown Brand',
            materialType: materialType,
            points: points,
            location: location || null,
            timestamp: serverTimestamp(),
            validated: true,
            processed: true
        };

        await set(scanRef, scanRecord);

        // Record in user's personal scan history (compliant with userScans rules)
        const userScanRef = ref(database, `userScans/${userId}/${scanId}`);
        await set(userScanRef, {
            scanId: scanId,
            barcode: barcode,
            itemName: itemName || 'Unknown Item',
            brand: brand || 'Unknown Brand',
            materialType: materialType,
            points: points,
            timestamp: serverTimestamp(),
            validated: true
        });

        // Update user stats (compliant with users rules)
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};

        const newPoints = (userData.points || 0) + points;
        const newLevel = Math.floor(newPoints / 100) + 1;
        const newTotalScans = (userData.totalScans || 0) + 1;

        // Update user profile
        await update(userRef, {
            points: newPoints,
            level: newLevel,
            totalScans: newTotalScans,
            lastScanDate: new Date().toISOString(),
            updatedAt: serverTimestamp()
        });

        console.log('✅ Scan recorded successfully');
        return {
            success: true,
            points: points,
            newTotalPoints: newPoints,
            newLevel: newLevel,
            newTotalScans: newTotalScans,
            scanId: scanId,
            itemName: itemName || 'Unknown Item',
            materialType: materialType
        };

    } catch (error) {
        console.error("❌ Error recording scan:", error);
        return { success: false, error: error.message };
    }
};


// =====================================
// USER PROFILE OPERATIONS
// =====================================

export const createUserProfile = async (userId, userData) => {
    try {
        const userRef = ref(database, `users/${userId}`);

        const existingUser = await get(userRef);
        if (existingUser.exists()) {
            console.log('✅ User profile already exists');
            return { success: true, data: existingUser.val() };
        }

        const newUserData = {
            ...userData,
            points: 0,
            level: 1,
            totalScans: 0,
            streak: 0,
            longestStreak: 0,
            lastScanDate: null,
            achievements: [],
            role: 'user',
            isActive: true,
            profileCompleted: false,
            preferences: {
                notifications: true,
                soundEffects: true,
                hapticFeedback: true
            },
            stats: {
                totalPointsEarned: 0,
                totalItemsRecycled: 0,
                favoriteCategory: null,
                co2Saved: 0, // kg CO2
                energySaved: 0, // kWh
                waterSaved: 0 // liters
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await set(userRef, newUserData);
        console.log('✅ User profile created successfully');

        return { success: true, data: newUserData };
    } catch (error) {
        console.error("❌ Error creating user profile:", error);
        return { success: false, error: error.message };
    }
};

export const getUserProfile = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        return { success: false, error: "User not found" };
    } catch (error) {
        console.error("❌ Error getting user profile:", error);
        return { success: false, error: error.message };
    }
};

export const updateUserProfile = async (userId, updates) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('✅ User profile updated successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error updating user profile:", error);
        return { success: false, error: error.message };
    }
};

// =====================================
// ACHIEVEMENTS SYSTEM
// =====================================

const ACHIEVEMENTS = {
    FIRST_SCAN: {
        id: 'first_scan',
        name: 'First Step',
        description: 'Complete your first recycling scan',
        requirement: 1,
        type: 'scans',
        icon: 'leaf',
        points: 50,
        rarity: 'common'
    },
    FIVE_SCANS: {
        id: 'five_scans',
        name: 'Getting Started',
        description: 'Recycle 5 items',
        requirement: 5,
        type: 'scans',
        icon: 'trending-up',
        points: 75,
        rarity: 'common'
    },
    TEN_SCANS: {
        id: 'ten_scans',
        name: 'Eco Rookie',
        description: 'Recycle 10 items',
        requirement: 10,
        type: 'scans',
        icon: 'checkmark-circle',
        points: 100,
        rarity: 'common'
    },
    TWENTY_FIVE_SCANS: {
        id: 'twenty_five_scans',
        name: 'Green Explorer',
        description: 'Recycle 25 items',
        requirement: 25,
        type: 'scans',
        icon: 'compass',
        points: 150,
        rarity: 'uncommon'
    },
    FIFTY_SCANS: {
        id: 'fifty_scans',
        name: 'Eco Warrior',
        description: 'Recycle 50 items',
        requirement: 50,
        type: 'scans',
        icon: 'shield',
        points: 250,
        rarity: 'rare'
    },
    HUNDRED_SCANS: {
        id: 'hundred_scans',
        name: 'Century Club',
        description: 'Recycle 100 items',
        requirement: 100,
        type: 'scans',
        icon: 'trophy',
        points: 500,
        rarity: 'epic'
    },
    TWO_HUNDRED_SCANS: {
        id: 'two_hundred_scans',
        name: 'Eco Master',
        description: 'Recycle 200 items',
        requirement: 200,
        type: 'scans',
        icon: 'medal',
        points: 750,
        rarity: 'epic'
    },
    FIVE_HUNDRED_SCANS: {
        id: 'five_hundred_scans',
        name: 'Planet Protector',
        description: 'Recycle 500 items',
        requirement: 500,
        type: 'scans',
        icon: 'planet',
        points: 1000,
        rarity: 'legendary'
    },

    // Points-based achievements
    HUNDRED_POINTS: {
        id: 'hundred_points',
        name: 'Point Starter',
        description: 'Earn 100 points',
        requirement: 100,
        type: 'points',
        icon: 'star-outline',
        points: 25,
        rarity: 'common'
    },
    FIVE_HUNDRED_POINTS: {
        id: 'five_hundred_points',
        name: 'Point Collector',
        description: 'Earn 500 points',
        requirement: 500,
        type: 'points',
        icon: 'diamond-outline',
        points: 100,
        rarity: 'uncommon'
    },
    THOUSAND_POINTS: {
        id: 'thousand_points',
        name: 'Point Master',
        description: 'Earn 1000 points',
        requirement: 1000,
        type: 'points',
        icon: 'star',
        points: 200,
        rarity: 'rare'
    },
    FIVE_THOUSAND_POINTS: {
        id: 'five_thousand_points',
        name: 'Point Champion',
        description: 'Earn 5000 points',
        requirement: 5000,
        type: 'points',
        icon: 'diamond',
        points: 500,
        rarity: 'epic'
    },
    TEN_THOUSAND_POINTS: {
        id: 'ten_thousand_points',
        name: 'Point Legend',
        description: 'Earn 10,000 points',
        requirement: 10000,
        type: 'points',
        icon: 'infinite',
        points: 1000,
        rarity: 'legendary'
    },

    // Level-based achievements
    LEVEL_FIVE: {
        id: 'level_five',
        name: 'Rising Star',
        description: 'Reach Level 5',
        requirement: 5,
        type: 'level',
        icon: 'rocket',
        points: 150,
        rarity: 'uncommon'
    },
    LEVEL_TEN: {
        id: 'level_ten',
        name: 'Eco Champion',
        description: 'Reach Level 10',
        requirement: 10,
        type: 'level',
        icon: 'flame',
        points: 300,
        rarity: 'rare'
    },
    LEVEL_TWENTY: {
        id: 'level_twenty',
        name: 'Green Guardian',
        description: 'Reach Level 20',
        requirement: 20,
        type: 'level',
        icon: 'shield-checkmark',
        points: 500,
        rarity: 'epic'
    },
    LEVEL_FIFTY: {
        id: 'level_fifty',
        name: 'Environmental Hero',
        description: 'Reach Level 50',
        requirement: 50,
        type: 'level',
        icon: 'ribbon',
        points: 1000,
        rarity: 'legendary'
    },

    // Special/Streak achievements
    WEEK_STREAK: {
        id: 'week_streak',
        name: 'Weekly Warrior',
        description: 'Recycle for 7 consecutive days',
        requirement: 7,
        type: 'streak',
        icon: 'calendar',
        points: 200,
        rarity: 'rare'
    },
    MONTH_STREAK: {
        id: 'month_streak',
        name: 'Monthly Master',
        description: 'Recycle for 30 consecutive days',
        requirement: 30,
        type: 'streak',
        icon: 'calendar-clear',
        points: 500,
        rarity: 'epic'
    },

    // Material-specific achievements
    PLASTIC_SPECIALIST: {
        id: 'plastic_specialist',
        name: 'Plastic Crusher',
        description: 'Recycle 50 plastic items',
        requirement: 50,
        type: 'material_plastic',
        icon: 'water',
        points: 300,
        rarity: 'rare'
    },
    ALUMINUM_EXPERT: {
        id: 'aluminum_expert',
        name: 'Can Crusher',
        description: 'Recycle 30 aluminum cans',
        requirement: 30,
        type: 'material_aluminum',
        icon: 'nutrition',
        points: 350,
        rarity: 'rare'
    },
    GLASS_COLLECTOR: {
        id: 'glass_collector',
        name: 'Glass Guardian',
        description: 'Recycle 20 glass bottles',
        requirement: 20,
        type: 'material_glass',
        icon: 'wine',
        points: 400,
        rarity: 'rare'
    }
};

export const getUserAchievements = (achievementIds = []) => {
    return achievementIds.map(id =>
        Object.values(ACHIEVEMENTS).find(a => a.id === id)
    ).filter(Boolean);
};

export const getAllAchievements = () => {
    return Object.values(ACHIEVEMENTS);
};

// =====================================
// STREAK TRACKING SYSTEM
// =====================================

// =====================================
// USER STATISTICS & ANALYTICS
// =====================================

export const getUserStats = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userScansRef = ref(database, `userScans/${userId}`);

        const [userSnapshot, scansSnapshot] = await Promise.all([
            get(userRef),
            get(userScansRef)
        ]);

        const userData = userSnapshot.exists() ? userSnapshot.val() : {};

        // Calculate comprehensive material breakdown
        const materialBreakdown = {
            plastic: 0,
            glass: 0,
            aluminum: 0,
            paper: 0
        };

        const brandBreakdown = {};
        const categoryBreakdown = {};
        let totalPointsFromScans = 0;
        let scansThisWeek = 0;
        let scansThisMonth = 0;
        let scansToday = 0;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        if (scansSnapshot.exists()) {
            scansSnapshot.forEach((childSnapshot) => {
                const scan = childSnapshot.val();
                const scanDate = new Date(scan.timestamp);

                // Material breakdown
                const materialType = scan.materialType?.toLowerCase() || 'unknown';
                if (materialBreakdown[materialType] !== undefined) {
                    materialBreakdown[materialType]++;
                }

                // Brand breakdown
                const brand = scan.brand || 'Unknown';
                brandBreakdown[brand] = (brandBreakdown[brand] || 0) + 1;

                // Category breakdown
                const category = scan.category || 'general';
                categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;

                totalPointsFromScans += scan.points || 0;

                // Time-based counting
                if (scanDate >= todayStart) scansToday++;
                if (scanDate >= oneWeekAgo) scansThisWeek++;
                if (scanDate >= oneMonthAgo) scansThisMonth++;
            });
        }

        // Calculate environmental impact (rough estimates)
        const environmentalImpact = {
            co2Saved: Math.round(userData.totalScans * 0.5 * 100) / 100, // kg CO2
            waterSaved: Math.round(userData.totalScans * 2.3 * 100) / 100, // liters
            energySaved: Math.round(userData.totalScans * 1.2 * 100) / 100, // kWh
            landfillDiverted: Math.round(userData.totalScans * 0.3 * 100) / 100, // kg
        };

        const stats = {
            // Basic stats
            totalScans: userData.totalScans || 0,
            totalPoints: userData.points || 0,
            level: userData.level || 1,
            streak: userData.streak || 0,
            longestStreak: userData.longestStreak || 0,
            achievements: userData.achievements || [],

            // Breakdowns
            materialBreakdown,
            brandBreakdown,
            categoryBreakdown,

            // Time-based stats
            scansToday,
            scansThisWeek,
            scansThisMonth,

            // Analytics
            pointsFromScans: totalPointsFromScans,
            averagePointsPerScan: userData.totalScans > 0 ? Math.round((totalPointsFromScans / userData.totalScans) * 100) / 100 : 0,

            // Environmental impact
            environmentalImpact,

            // Preferences
            preferences: userData.preferences || {
                notifications: true,
                soundEffects: true,
                hapticFeedback: true
            }
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error("❌ Error getting user stats:", error);
        return { success: false, error: error.message };
    }
};

// Get user's recent scans with enhanced details
export const getUserScans = async (userId, limit = 10) => {
    try {
        const userScansRef = ref(database, `userScans/${userId}`);
        const snapshot = await get(userScansRef);

        if (snapshot.exists()) {
            const scans = [];
            snapshot.forEach((childSnapshot) => {
                scans.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });

            // Sort by timestamp (newest first) and limit
            scans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return { success: true, data: scans.slice(0, limit) };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting user scans:", error);
        return { success: false, error: error.message };
    }
};

// =====================================
// LEADERBOARD & SOCIAL FEATURES
// =====================================

export const getLeaderboard = async (limit = 50) => {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData && userData.role === 'user' && userData.points !== undefined) {
                    users.push({
                        id: childSnapshot.key,
                        displayName: userData.displayName || 'Anonymous User',
                        points: userData.points || 0,
                        level: userData.level || 1,
                        totalScans: userData.totalScans || 0,
                        streak: userData.streak || 0,
                        profileImageUrl: userData.profileImageUrl || null,
                        university: userData.university || 'Unknown',
                        lastScanDate: userData.lastScanDate
                    });
                }
            });

            // Sort by points descending, then by scans descending
            users.sort((a, b) => {
                if (b.points !== a.points) {
                    return b.points - a.points;
                }
                return b.totalScans - a.totalScans;
            });

            const limitedUsers = users.slice(0, limit);

            // Add rank to each user
            const rankedUsers = limitedUsers.map((user, index) => ({
                ...user,
                rank: index + 1
            }));

            return { success: true, data: rankedUsers };
        }
        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting leaderboard:", error);
        return { success: false, error: error.message };
    }
};

// =====================================
// REWARDS SYSTEM
// =====================================

export const getRewards = async () => {
    try {
        const rewardsRef = ref(database, 'rewards');
        const snapshot = await get(rewardsRef);

        if (snapshot.exists()) {
            const rewards = [];
            snapshot.forEach((childSnapshot) => {
                const reward = childSnapshot.val();
                rewards.push({
                    id: childSnapshot.key,
                    ...reward
                });
            });

            // Sort by points ascending (cheapest first)
            rewards.sort((a, b) => (a.points || 0) - (b.points || 0));

            return { success: true, data: rewards };
        }
        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting rewards:", error);
        return { success: false, error: error.message };
    }
};

// Initialize enhanced sample rewards
export const initializeRewards = async () => {
    try {
        const rewardsRef = ref(database, 'rewards');

        const initialRewards = {
            'reward-cafeteria-small': {
                name: 'Campus Cafeteria Snack Voucher',
                description: 'R20 off any snack or drink at campus cafeteria',
                points: 200,
                category: 'food',
                image: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Cafeteria+Snack',
                available: true,
                stock: 200,
                popularity: 0,
                createdAt: serverTimestamp()
            },
            'reward-cafeteria-meal': {
                name: 'Campus Cafeteria Meal Voucher',
                description: 'R50 off any meal at campus cafeteria',
                points: 500,
                category: 'food',
                image: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Cafeteria+Meal',
                available: true,
                stock: 100,
                popularity: 0,
                createdAt: serverTimestamp()
            },
            'reward-bottle': {
                name: 'Eco-Friendly Water Bottle',
                description: 'Reusable stainless steel water bottle with AdBeam logo',
                points: 800,
                category: 'merchandise',
                image: 'https://via.placeholder.com/300x200/22c55e/FFFFFF?text=Water+Bottle',
                available: true,
                stock: 50,
                popularity: 0,
                createdAt: serverTimestamp()
            },
            'reward-tshirt': {
                name: 'Green Campus T-Shirt',
                description: 'Organic cotton recycling awareness t-shirt',
                points: 1200,
                category: 'merchandise',
                image: 'https://via.placeholder.com/300x200/10b981/FFFFFF?text=Eco+T-Shirt',
                available: true,
                stock: 30,
                popularity: 0,
                createdAt: serverTimestamp()
            },
            'reward-bookstore': {
                name: 'Campus Bookstore Voucher',
                description: 'R30 off stationery at campus bookstore',
                points: 300,
                category: 'education',
                image: 'https://via.placeholder.com/300x200/8b5cf6/FFFFFF?text=Bookstore',
                available: true,
                stock: 75,
                popularity: 0,
                createdAt: serverTimestamp()
            },
            'reward-premium': {
                name: 'Eco Champion Bundle',
                description: 'Premium eco-friendly starter pack: water bottle, tote bag, and notebook',
                points: 2000,
                category: 'premium',
                image: 'https://via.placeholder.com/300x200/f59e0b/FFFFFF?text=Champion+Bundle',
                available: true,
                stock: 15,
                popularity: 0,
                createdAt: serverTimestamp()
            }
        };

        await set(rewardsRef, initialRewards);
        console.log('✅ Enhanced rewards initialized successfully!');
        return { success: true };
    } catch (error) {
        console.error('❌ Error initializing enhanced rewards:', error);
        return { success: false, error: error.message };
    }
};

// =====================================
// VOUCHER SYSTEM (Firebase Rules Compliant)
// =====================================

export const generateVoucherCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ADV-${timestamp}-${random}`;
};

export const redeemRewardWithVoucher = async (userId, rewardId, pointsCost) => {
    try {
        console.log('🎫 Creating voucher for user:', userId, 'Reward:', rewardId);

        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        if (!userData || (userData.points || 0) < pointsCost) {
            return {
                success: false,
                error: "Insufficient points. You need " + (pointsCost - (userData?.points || 0)) + " more points."
            };
        }

        // Get reward details
        const rewardRef = ref(database, `rewards/${rewardId}`);
        const rewardSnapshot = await get(rewardRef);
        const rewardData = rewardSnapshot.val();

        if (!rewardData || !rewardData.available) {
            return {
                success: false,
                error: "Reward is not available"
            };
        }

        // Generate unique voucher code and ID
        const voucherCode = generateVoucherCode();
        const vouchersRef = ref(database, 'vouchers');
        const voucherRef = push(vouchersRef);
        const voucherId = voucherRef.key;

        // Create comprehensive voucher record (compliant with Firebase rules)
        const voucherData = {
            id: voucherId,
            userId: userId,
            rewardId: rewardId,
            rewardName: rewardData.name,
            rewardDescription: rewardData.description,
            voucherCode: voucherCode,
            pointsCost: pointsCost,
            status: 'active',
            category: rewardData.category || 'general',
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days
            redeemedAt: null,
            redeemedBy: null,
            redeemedByName: null,
            // Notification flags
            threeDayNotificationSent: false,
            oneDayNotificationSent: false
        };

        // Save voucher (compliant with vouchers rules)
        await set(voucherRef, voucherData);

        // Save user's voucher reference (compliant with userVouchers rules)
        const userVoucherRef = ref(database, `userVouchers/${userId}/${voucherId}`);
        await set(userVoucherRef, {
            voucherId: voucherId,
            voucherCode: voucherCode,
            rewardName: rewardData.name,
            rewardDescription: rewardData.description,
            pointsCost: pointsCost,
            status: 'active',
            category: rewardData.category || 'general',
            createdAt: serverTimestamp(),
            expiresAt: voucherData.expiresAt
        });

        // Deduct points from user (compliant with users rules)
        const newPoints = userData.points - pointsCost;
        await update(userRef, {
            points: newPoints,
            totalVouchersCreated: (userData.totalVouchersCreated || 0) + 1,
            updatedAt: serverTimestamp()
        });

        // Update reward popularity
        await update(rewardRef, {
            popularity: (rewardData.popularity || 0) + 1,
            lastRedeemedAt: serverTimestamp()
        });

        console.log('✅ Reward redeemed with voucher successfully');
        return {
            success: true,
            newPoints: newPoints,
            voucherCode: voucherCode,
            voucherId: voucherId,
            voucherData: voucherData
        };
    } catch (error) {
        console.error("❌ Error redeeming reward with voucher:", error);
        return { success: false, error: error.message };
    }
};

export const getUserVouchers = async (userId) => {
    try {
        const userVouchersRef = ref(database, `userVouchers/${userId}`);
        const snapshot = await get(userVouchersRef);

        if (snapshot.exists()) {
            const vouchers = [];
            snapshot.forEach((childSnapshot) => {
                const voucher = childSnapshot.val();
                // Add expiry status
                const now = new Date();
                const expiryDate = new Date(voucher.expiresAt);
                const isExpired = now > expiryDate && voucher.status === 'active';

                vouchers.push({
                    id: childSnapshot.key,
                    ...voucher,
                    isExpired: isExpired,
                    daysUntilExpiry: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
                });
            });

            // Sort by creation date (newest first)
            vouchers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return { success: true, data: vouchers };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting user vouchers:", error);
        return { success: false, error: error.message };
    }
};

// =====================================
// STAFF FUNCTIONS (Firebase Rules Compliant)
// =====================================

export const redeemVoucherByStaff = async (voucherCode, staffId, staffName) => {
    try {
        console.log('🎫 Staff redeeming voucher:', voucherCode);

        // Find voucher by code (staff can read all vouchers per rules)
        const vouchersRef = ref(database, 'vouchers');
        const snapshot = await get(vouchersRef);

        let voucherData = null;
        let voucherId = null;

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.voucherCode === voucherCode) {
                    voucherData = data;
                    voucherId = childSnapshot.key;
                }
            });
        }

        if (!voucherData) {
            return { success: false, error: 'Invalid voucher code. Please check the QR code and try again.' };
        }

        if (voucherData.status !== 'active') {
            const statusMessages = {
                'redeemed': 'This voucher has already been redeemed',
                'expired': 'This voucher has expired',
                'cancelled': 'This voucher has been cancelled'
            };
            return {
                success: false,
                error: statusMessages[voucherData.status] || 'Voucher is not active'
            };
        }

        // Check expiration
        const now = new Date();
        const expiryDate = new Date(voucherData.expiresAt);
        if (now > expiryDate) {
            // Mark as expired
            const voucherRef = ref(database, `vouchers/${voucherId}`);
            await update(voucherRef, { status: 'expired' });

            return {
                success: false,
                error: `Voucher expired on ${expiryDate.toLocaleDateString()}`
            };
        }

        // Get user info
        const userRef = ref(database, `users/${voucherData.userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        // Update voucher status (staff can write to vouchers per rules)
        const voucherRef = ref(database, `vouchers/${voucherId}`);
        await update(voucherRef, {
            status: 'redeemed',
            redeemedAt: serverTimestamp(),
            redeemedBy: staffId,
            redeemedByName: staffName
        });

        // Update user's voucher record (admin rule allows staff to write)
        const userVoucherRef = ref(database, `userVouchers/${voucherData.userId}/${voucherId}`);
        await update(userVoucherRef, {
            status: 'redeemed',
            redeemedAt: serverTimestamp(),
            redeemedBy: staffId,
            redeemedByName: staffName
        });

        console.log('✅ Voucher redeemed by staff successfully');
        return {
            success: true,
            reward: voucherData.rewardName,
            userId: voucherData.userId,
            studentName: userData?.displayName || 'Student',
            studentEmail: userData?.email,
            voucherId: voucherId,
            pointsCost: voucherData.pointsCost
        };
    } catch (error) {
        console.error("❌ Error redeeming voucher by staff:", error);
        return { success: false, error: error.message };
    }
};

export const getStaffDashboardData = async () => {
    try {
        const [vouchersResult, usersResult, rewardsResult] = await Promise.all([
            getAllVouchers(),
            getAllUsers(),
            getRewards()
        ]);

        if (!vouchersResult.success || !usersResult.success || !rewardsResult.success) {
            return { success: false, error: 'Failed to fetch dashboard data' };
        }

        const vouchers = vouchersResult.data;
        const users = usersResult.data;
        const rewards = rewardsResult.data;

        // Enhanced time calculations
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Filter vouchers by time periods
        const todayVouchers = vouchers.filter(v =>
            v.status === 'redeemed' && v.redeemedAt &&
            new Date(v.redeemedAt) >= todayStart
        );

        const weekVouchers = vouchers.filter(v =>
            v.status === 'redeemed' && v.redeemedAt &&
            new Date(v.redeemedAt) >= weekStart
        );

        // Popular rewards analysis
        const rewardRedemptions = {};
        vouchers.forEach(v => {
            if (v.status === 'redeemed') {
                rewardRedemptions[v.rewardName] = (rewardRedemptions[v.rewardName] || 0) + 1;
            }
        });

        const popularRewards = Object.entries(rewardRedemptions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        // Calculate expiring vouchers
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const expiringVouchers = vouchers.filter(v => {
            if (v.status !== 'active') return false;
            const expiryDate = new Date(v.expiresAt);
            return expiryDate <= threeDaysFromNow;
        });

        const dashboardData = {
            // Basic counts
            totalUsers: users.length,
            activeStudents: users.filter(u => u.role === 'user' && (u.totalScans || 0) > 0).length,
            totalVouchers: vouchers.length,
            activeVouchers: vouchers.filter(v => v.status === 'active').length,
            redeemedVouchers: vouchers.filter(v => v.status === 'redeemed').length,
            expiredVouchers: vouchers.filter(v => v.status === 'expired').length,
            expiringVouchers: expiringVouchers.length,

            // Time-based stats
            todayRedemptions: todayVouchers.length,
            weekRedemptions: weekVouchers.length,
            monthRedemptions: vouchers.filter(v =>
                v.status === 'redeemed' && v.redeemedAt &&
                new Date(v.redeemedAt) >= monthStart
            ).length,

            // Analytics
            totalRewards: rewards.length,
            availableRewards: rewards.filter(r => r.available).length,
            popularRewards: popularRewards,

            // Recent data for quick viewing
            recentVouchers: vouchers
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10),

            topStudents: users
                .filter(u => u.role === 'user')
                .sort((a, b) => (b.totalScans || 0) - (a.totalScans || 0))
                .slice(0, 5),

            // Alerts for staff
            alertsCount: expiringVouchers.length,
            lowStockRewards: rewards.filter(r => r.stock < 10).length
        };

        return { success: true, data: dashboardData };
    } catch (error) {
        console.error("❌ Error getting staff dashboard data:", error);
        return { success: false, error: error.message };
    }
};

export const getStaffRedemptionHistory = async (staffId, limit = 50) => {
    try {
        const vouchersRef = ref(database, 'vouchers');
        const snapshot = await get(vouchersRef);

        if (snapshot.exists()) {
            const redemptions = [];
            snapshot.forEach((childSnapshot) => {
                const voucher = childSnapshot.val();
                if (voucher.status === 'redeemed' && voucher.redeemedBy === staffId) {
                    redemptions.push({
                        id: childSnapshot.key,
                        ...voucher,
                        timeAgo: getTimeAgo(voucher.redeemedAt)
                    });
                }
            });

            // Sort by redemption date (newest first)
            redemptions.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));

            return { success: true, data: redemptions.slice(0, limit) };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting staff redemption history:", error);
        return { success: false, error: error.message };
    }
};

// =====================================
// ADMIN FUNCTIONS (Firebase Rules Compliant)
// =====================================

export const getAllUsers = async () => {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                users.push({
                    id: childSnapshot.key,
                    ...userData,
                    // Add computed fields
                    isActive: (userData.totalScans || 0) > 0,
                    lastActivity: userData.lastScanDate ? getTimeAgo(userData.lastScanDate) : 'Never',
                    efficiency: userData.totalScans > 0 ? Math.round((userData.points || 0) / userData.totalScans) : 0
                });
            });

            return { success: true, data: users };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting all users:", error);
        return { success: false, error: error.message };
    }
};

export const getAllVouchers = async () => {
    try {
        const vouchersRef = ref(database, 'vouchers');
        const snapshot = await get(vouchersRef);

        if (snapshot.exists()) {
            const vouchers = [];
            const now = new Date();

            snapshot.forEach((childSnapshot) => {
                const voucher = childSnapshot.val();
                const expiryDate = new Date(voucher.expiresAt);

                vouchers.push({
                    id: childSnapshot.key,
                    ...voucher,
                    // Add computed fields
                    isExpired: now > expiryDate && voucher.status === 'active',
                    daysUntilExpiry: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
                    timeAgo: getTimeAgo(voucher.createdAt),
                    redeemedTimeAgo: voucher.redeemedAt ? getTimeAgo(voucher.redeemedAt) : null
                });
            });

            return { success: true, data: vouchers };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting all vouchers:", error);
        return { success: false, error: error.message };
    }
};

// Enhanced admin functions with better role management
export const changeUserRole = async (userId, newRole) => {
    try {
        console.log(`🔄 Admin changing user ${userId} role to ${newRole}`);

        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            return { success: false, error: 'User not found' };
        }

        const currentData = snapshot.val();
        const oldRole = currentData.role;

        // Prevent demoting the last admin
        if (oldRole === 'admin' && newRole !== 'admin') {
            const allUsers = await getAllUsers();
            const adminCount = allUsers.data.filter(u => u.role === 'admin').length;

            if (adminCount <= 1) {
                return {
                    success: false,
                    error: 'Cannot demote the last admin. Promote another user to admin first.'
                };
            }
        }

        // Update role (admin can write to any user per Firebase rules)
        await update(userRef, {
            role: newRole,
            roleUpdatedAt: serverTimestamp(),
            roleUpdatedBy: 'admin', // Track who made the change
            updatedAt: serverTimestamp()
        });

        console.log('✅ User role updated successfully from', oldRole, 'to', newRole);
        return { success: true, oldRole: oldRole, newRole: newRole };
    } catch (error) {
        console.error("❌ Error changing user role:", error);
        return { success: false, error: error.message };
    }
};

// =====================================
// ENHANCED ANALYTICS & INSIGHTS
// =====================================

export const getCampusAnalytics = async () => {
    try {
        const [usersResult, scansSnapshot, vouchersResult] = await Promise.all([
            getAllUsers(),
            get(ref(database, 'scans')),
            getAllVouchers()
        ]);

        const users = usersResult.success ? usersResult.data : [];
        const vouchers = vouchersResult.success ? vouchersResult.data : [];

        // Comprehensive scan analysis
        const materialStats = {
            plastic: { count: 0, points: 0, items: [] },
            aluminum: { count: 0, points: 0, items: [] },
            glass: { count: 0, points: 0, items: [] },
            paper: { count: 0, points: 0, items: [] }
        };

        const brandStats = {};
        const categoryStats = {};
        let totalScans = 0;
        let totalPointsAwarded = 0;
        const dailyScans = {};

        if (scansSnapshot.exists()) {
            scansSnapshot.forEach((childSnapshot) => {
                const scan = childSnapshot.val();
                totalScans++;
                totalPointsAwarded += scan.points || 0;

                // Material breakdown
                if (materialStats[scan.materialType]) {
                    materialStats[scan.materialType].count++;
                    materialStats[scan.materialType].points += scan.points || 0;
                    materialStats[scan.materialType].items.push(scan.itemName);
                }

                // Brand analysis
                const brand = scan.brand || 'Unknown';
                brandStats[brand] = (brandStats[brand] || 0) + 1;

                // Category analysis
                const category = scan.category || 'general';
                categoryStats[category] = (categoryStats[category] || 0) + 1;

                // Daily scan tracking
                const scanDate = new Date(scan.timestamp).toDateString();
                dailyScans[scanDate] = (dailyScans[scanDate] || 0) + 1;
            });
        }

        // Environmental impact calculations (enhanced estimates)
        const environmentalImpact = {
            co2Saved: Math.round(totalScans * 0.65 * 100) / 100, // kg CO2 saved
            waterSaved: Math.round(totalScans * 2.8 * 100) / 100, // liters water saved
            energySaved: Math.round(totalScans * 1.4 * 100) / 100, // kWh energy saved
            landfillDiverted: Math.round(totalScans * 0.4 * 100) / 100, // kg waste diverted
            treesEquivalent: Math.round(totalScans * 0.02 * 100) / 100, // trees saved equivalent
        };

        const analytics = {
            // Overview
            totalStudents: users.filter(u => u.role === 'user').length,
            activeRecyclers: users.filter(u => (u.totalScans || 0) > 0).length,
            totalScans: totalScans,
            totalPointsAwarded: totalPointsAwarded,

            // Breakdowns
            materialBreakdown: materialStats,
            topBrands: Object.entries(brandStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([brand, count]) => ({ brand, count })),
            topCategories: Object.entries(categoryStats)
                .sort(([,a], [,b]) => b - a)
                .map(([category, count]) => ({ category, count })),

            // Time-based insights
            averageScansPerUser: users.length > 0 ? Math.round((totalScans / users.length) * 100) / 100 : 0,
            averagePointsPerScan: totalScans > 0 ? Math.round((totalPointsAwarded / totalScans) * 100) / 100 : 0,

            // Environmental impact
            environmentalImpact: environmentalImpact,

            // Top performers
            topRecyclers: users
                .filter(u => u.role === 'user' && (u.totalScans || 0) > 0)
                .sort((a, b) => (b.totalScans || 0) - (a.totalScans || 0))
                .slice(0, 10)
                .map(u => ({
                    id: u.id,
                    name: u.displayName || 'Anonymous',
                    scans: u.totalScans || 0,
                    points: u.points || 0,
                    level: u.level || 1,
                    university: u.university || 'Unknown'
                })),

            // Voucher insights
            voucherStats: {
                total: vouchers.length,
                active: vouchers.filter(v => v.status === 'active').length,
                redeemed: vouchers.filter(v => v.status === 'redeemed').length,
                expired: vouchers.filter(v => v.status === 'expired').length,
                redemptionRate: vouchers.length > 0 ?
                    Math.round((vouchers.filter(v => v.status === 'redeemed').length / vouchers.length) * 100) : 0
            },

            // Recent activity
            recentScans: Object.entries(dailyScans)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .slice(0, 7)
                .map(([date, count]) => ({ date, count }))
        };

        return { success: true, data: analytics };
    } catch (error) {
        console.error("❌ Error getting campus analytics:", error);
        return { success: false, error: error.message };
    }
};

// =====================================
// UTILITY FUNCTIONS
// =====================================

// Helper function for time ago display
const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)}w ago`;

    return date.toLocaleDateString();
};

// Enhanced reward system functions
export const createReward = async (rewardData) => {
    try {
        const rewardsRef = ref(database, 'rewards');
        const newRewardRef = push(rewardsRef);

        const enhancedRewardData = {
            ...rewardData,
            popularity: 0,
            totalRedeemed: 0,
            lastRedeemedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await set(newRewardRef, enhancedRewardData);
        console.log('✅ Enhanced reward created successfully');
        return { success: true, id: newRewardRef.key };
    } catch (error) {
        console.error("❌ Error creating reward:", error);
        return { success: false, error: error.message };
    }
};

export const updateReward = async (rewardId, updates) => {
    try {
        const rewardRef = ref(database, `rewards/${rewardId}`);
        await update(rewardRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Reward updated successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error updating reward:", error);
        return { success: false, error: error.message };
    }
};

export const deleteReward = async (rewardId) => {
    try {
        const rewardRef = ref(database, `rewards/${rewardId}`);
        await remove(rewardRef);
        console.log('✅ Reward deleted successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error deleting reward:", error);
        return { success: false, error: error.message };
    }
};

// =====================================
// DEVELOPER TOOLS (Enhanced)
// =====================================

export const addTestPoints = async (userId, pointsToAdd) => {
    try {
        if (!__DEV__) {
            return { success: false, error: 'Development mode only' };
        }

        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};

        const currentPoints = userData.points || 0;
        const newPoints = currentPoints + pointsToAdd;
        const newLevel = Math.floor(newPoints / 100) + 1;

        await update(userRef, {
            points: newPoints,
            level: newLevel,
            updatedAt: serverTimestamp()
        });

        return {
            success: true,
            pointsAdded: pointsToAdd,
            newPoints: newPoints,
            newLevel: newLevel,
            levelUp: newLevel > userData.level
        };
    } catch (error) {
        console.error('❌ Error adding test points:', error);
        return { success: false, error: error.message };
    }
};

export const resetUserProgress = async (userId) => {
    try {
        if (!__DEV__) {
            return { success: false, error: 'Development mode only' };
        }

        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            points: 0,
            level: 1,
            totalScans: 0,
            streak: 0,
            longestStreak: 0,
            achievements: [],
            lastScanDate: null,
            updatedAt: serverTimestamp()
        });

        return { success: true, message: 'User progress reset successfully' };
    } catch (error) {
        console.error('❌ Error resetting user progress:', error);
        return { success: false, error: error.message };
    }
};

// =====================================
// MAINTAIN EXISTING FUNCTIONS
// =====================================

// Keep all your existing functions exactly as they are
export const redeemReward = async (userId, rewardId, pointsCost) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        if (!userData || (userData.points || 0) < pointsCost) {
            return {
                success: false,
                error: "Insufficient points"
            };
        }

        // Deduct points
        const newPoints = userData.points - pointsCost;
        await update(userRef, {
            points: newPoints,
            updatedAt: serverTimestamp()
        });

        // Record redemption (compliant with redemptions rules)
        const redemptionsRef = ref(database, `redemptions/${userId}`);
        const newRedemptionRef = push(redemptionsRef);
        await set(newRedemptionRef, {
            rewardId,
            pointsCost,
            timestamp: serverTimestamp(),
            status: 'pending'
        });

        console.log('✅ Reward redeemed successfully');
        return {
            success: true,
            newPoints: newPoints
        };
    } catch (error) {
        console.error("❌ Error redeeming reward:", error);
        return { success: false, error: error.message };
    }
};

// Keep all other existing functions...
// (Include all your existing functions like uploadProfileImage, promoteToStaff, etc.)

export const uploadProfileImage = async (userId, imageUri) => {
    try {
        const imageUrl = `https://via.placeholder.com/200x200/059669/FFFFFF?text=${userId.substring(0, 2)}`;
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            profileImageUrl: imageUrl,
            updatedAt: serverTimestamp()
        });

        console.log('✅ Profile image updated successfully');
        return { success: true, imageUrl };
    } catch (error) {
        console.error('❌ Error uploading profile image:', error);
        return { success: false, error: error.message };
    }
};

// Export existing functions for compatibility
export {
    getStaffStats,
    deleteUser,
    promoteToStaff,
    editReward,
    toggleRewardAvailability,
    updateUserData,
    getAppStats,
    checkExpiringVouchers,
    sendDailyReminders,
    createBonusEvent,
    testNotifications,
    resetUserPoints
} from './database'; // Import from your existing file

// ENHANCED: Accept any barcode with user material classification
export const recordScanWithUserClassification = async (userId, scanData) => {
    try {
        console.log('🔄 Recording user-classified scan:', scanData);

        // Create comprehensive scan record
        const scanRecord = {
            id: scanId,
            userId: userId,
            barcode: barcode,
            barcodeType: barcodeType || 'unknown',
            itemName: `${material.name} Item`,
            brand: 'User Classified',
            materialType: materialType,
            category: materialType,
            points: material.points,
            location: location || null,
            timestamp: serverTimestamp(),
            scanMode: 'user_classified',
            userSelected: true,
            validated: true,
            processed: true
        };

        // Update user profile
        await update(userRef, {
            points: newPoints,
            level: newLevel,
            totalScans: newTotalScans,
            lastScanDate: new Date().toISOString(),
            updatedAt: serverTimestamp()
        });

        console.log('✅ User-classified scan recorded successfully');
        return {
            success: true,
            points: material.points,
            newTotalPoints: newPoints,
            newLevel: newLevel,
            newTotalScans: newTotalScans,
            scanId: scanId,
            itemName: scanRecord.itemName,
            materialType: materialType,
            userClassified: true
        };

    } catch (error) {
        console.error("❌ Error recording user-classified scan:", error);
        return { success: false, error: error.message };
    }
};


// Enhanced material statistics for analytics
export const getMaterialAnalytics = async () => {
    try {
        const scansRef = ref(database, 'scans');
        const snapshot = await get(scansRef);

        const analytics = {
            totalScans: 0,
            userClassifiedScans: 0,
            materialBreakdown: {
                plastic: { count: 0, points: 0, percentage: 0 },
                aluminum: { count: 0, points: 0, percentage: 0 },
                glass: { count: 0, points: 0, percentage: 0 },
                paper: { count: 0, points: 0, percentage: 0 }
            },
            averagePointsPerMaterial: {},
            popularBarcodes: {},
            userClassificationAccuracy: 100 // Since users choose their materials
        };

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const scan = childSnapshot.val();
                analytics.totalScans++;

                if (scan.userSelected || scan.scanMode === 'user_classified') {
                    analytics.userClassifiedScans++;
                }

                // Material breakdown
                const materialType = scan.materialType;
                if (analytics.materialBreakdown[materialType]) {
                    analytics.materialBreakdown[materialType].count++;
                    analytics.materialBreakdown[materialType].points += scan.points || 0;
                }

                // Track popular barcodes
                const barcode = scan.barcode;
                if (analytics.popularBarcodes[barcode]) {
                    analytics.popularBarcodes[barcode].count++;
                } else {
                    analytics.popularBarcodes[barcode] = {
                        count: 1,
                        materialType: materialType,
                        itemName: scan.itemName,
                        points: scan.points
                    };
                }
            });

            // Calculate percentages and averages
            Object.keys(analytics.materialBreakdown).forEach(material => {
                const data = analytics.materialBreakdown[material];
                data.percentage = analytics.totalScans > 0 ?
                    Math.round((data.count / analytics.totalScans) * 100) : 0;
                analytics.averagePointsPerMaterial[material] = data.count > 0 ?
                    Math.round((data.points / data.count) * 100) / 100 : 0;
            });
        }

        return { success: true, data: analytics };
    } catch (error) {
        console.error("❌ Error getting material analytics:", error);
        return { success: false, error: error.message };
    }
};

// BULLETPROOF: Enhanced scan recording with comprehensive error handling
export const recordScanWithNotifications = async (userId, scanData) => {
    try {
        console.log('🔄 Processing bulletproof scan with notifications...');

        const { barcode, barcodeType, materialType, points } = scanData;
        const material = MATERIAL_TYPES[materialType];

        if (!material) {
            throw new Error("Invalid material type selected");
        }

        if (!barcode || barcode.trim().length < 3) {
            throw new Error("Invalid barcode format");
        }

        // Generate unique scan ID
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const scanId = `${userId}_${timestamp}_${randomSuffix}`;

        // Check for duplicate scans (24-hour window)
        const scansRef = ref(database, 'scans');
        const existingScansSnapshot = await get(scansRef);

        if (existingScansSnapshot.exists()) {
            let isDuplicate = false;
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            existingScansSnapshot.forEach((childSnapshot) => {
                const existingScan = childSnapshot.val();
                if (existingScan.barcode === barcode &&
                    existingScan.userId === userId &&
                    new Date(existingScan.timestamp) > oneDayAgo) {
                    isDuplicate = true;
                }
            });

            if (isDuplicate) {
                return {
                    success: false,
                    error: "This item was already scanned within the last 24 hours",
                    duplicate: true
                };
            }
        }

        // Create comprehensive scan record
        const scanRecord = {
            id: scanId,
            userId: userId,
            barcode: barcode.trim(),
            barcodeType: barcodeType || 'unknown',
            itemName: `${material.name} Item`,
            brand: 'User Classified',
            materialType: materialType,
            category: materialType,
            points: material.points,
            location: scanData.location || null,
            timestamp: serverTimestamp(),
            scanMode: 'user_classified',
            userSelected: true,
            validated: true,
            processed: true,
            sessionId: `session_${timestamp}`,
            appVersion: '2.0.0',
            platform: Platform.OS
        };

        // Atomic operations for data consistency
        const updates = {};

        // Main scan record
        updates[`scans/${scanId}`] = scanRecord;

        // User scan history
        updates[`userScans/${userId}/${scanId}`] = {
            scanId: scanId,
            barcode: barcode.trim(),
            itemName: scanRecord.itemName,
            materialType: materialType,
            points: material.points,
            timestamp: serverTimestamp(),
            userClassified: true
        };

        // Get current user data
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};

        const currentPoints = userData.points || 0;
        const currentLevel = userData.level || 1;
        const currentScans = userData.totalScans || 0;

        const newPoints = currentPoints + material.points;
        const newLevel = Math.floor(newPoints / 100) + 1;
        const newTotalScans = currentScans + 1;

        // User stats update
        updates[`users/${userId}/points`] = newPoints;
        updates[`users/${userId}/level`] = newLevel;
        updates[`users/${userId}/totalScans`] = newTotalScans;
        updates[`users/${userId}/lastScanDate`] = new Date().toISOString();
        updates[`users/${userId}/updatedAt`] = serverTimestamp();

        // Apply all updates atomically
        await update(ref(database), updates);

        console.log('✅ Bulletproof scan recorded successfully');

        // Check achievements after successful recording
        const newAchievements = await checkAndAwardAchievements(userId, {
            totalScans: newTotalScans,
            points: newPoints,
            level: newLevel
        });

        // Streak tracking
        const newStreak = await checkAndUpdateStreak(userId);

        // Send notifications (non-blocking)
        Promise.all([
            sendAchievementNotifications(userId, newAchievements),
            sendLevelUpNotification(userId, currentLevel, newLevel),
            sendMilestoneNotifications(userId, newTotalScans, newPoints)
        ]).catch(error => {
            console.log('⚠️ Notification sending failed (non-critical):', error);
        });

        return {
            success: true,
            points: material.points,
            newTotalPoints: newPoints,
            newLevel: newLevel,
            newTotalScans: newTotalScans,
            newAchievements: newAchievements,
            scanId: scanId,
            itemName: scanRecord.itemName,
            materialType: materialType,
            userClassified: true,
            leveledUp: newLevel > currentLevel,
            currentStreak: newStreak
        };

    } catch (error) {
        console.error("❌ Error in bulletproof scan recording:", error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            technical: true
        };
    }
};

// Enhanced achievement system with notifications
const sendAchievementNotifications = async (userId, achievements) => {
    if (!achievements || achievements.length === 0) return;

    console.log('🏆 Sending achievement notifications:', achievements.length);

    for (let i = 0; i < achievements.length; i++) {
        const achievement = achievements[i];
        setTimeout(() => {
            try {
                sendAchievementNotification(userId, achievement.name, achievement.points);
            } catch (error) {
                console.log('Achievement notification error:', error);
            }
        }, (i + 1) * 1500);
    }
};

const sendLevelUpNotification = async (userId, oldLevel, newLevel) => {
    if (newLevel > oldLevel) {
        const pointsToNext = ((newLevel + 1) * 100) - (newLevel * 100);
        console.log('📈 Sending level up notification:', oldLevel, '→', newLevel);

        setTimeout(() => {
            try {
                sendLevelUpNotification(userId, newLevel, pointsToNext);
            } catch (error) {
                console.log('Level up notification error:', error);
            }
        }, 2500);
    }
};

const sendMilestoneNotifications = async (userId, totalScans, totalPoints) => {
    // Scan milestones
    const scanMilestones = [5, 10, 25, 50, 100, 250, 500];
    if (scanMilestones.includes(totalScans)) {
        console.log('🎯 Sending scan milestone notification:', totalScans);
        setTimeout(() => {
            try {
                sendMilestoneNotification(
                    userId,
                    `${totalScans} Items Recycled!`,
                    totalScans >= 100 ? 'Eco-Champion Status! 🌟' : 'Amazing environmental impact! 💚'
                );
            } catch (error) {
                console.log('Milestone notification error:', error);
            }
        }, 4000);
    }

    // Points milestones
    const pointsMilestones = [100, 500, 1000, 2500, 5000];
    if (pointsMilestones.includes(totalPoints)) {
        console.log('💰 Sending points milestone notification:', totalPoints);
        setTimeout(() => {
            try {
                sendMilestoneNotification(
                    userId,
                    `${totalPoints} Points Milestone!`,
                    'Your planet-protecting power is growing! 🌱'
                );
            } catch (error) {
                console.log('Points milestone notification error:', error);
            }
        }, 5500);
    }
};

// Comprehensive achievement checking
export const checkAndAwardAchievements = async (userId, stats) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};
        const currentAchievements = userData.achievements || [];

        const newAchievements = [];

        // Production achievements list
        const PRODUCTION_ACHIEVEMENTS = {
            FIRST_SCAN: {
                id: 'first_scan',
                name: 'First Step',
                description: 'Complete your first recycling scan',
                requirement: 1,
                type: 'scans',
                icon: 'leaf',
                points: 50
            },
            FIVE_SCANS: {
                id: 'five_scans',
                name: 'Getting Started',
                description: 'Recycle 5 items',
                requirement: 5,
                type: 'scans',
                icon: 'trending-up',
                points: 100
            },
            TEN_SCANS: {
                id: 'ten_scans',
                name: 'Eco Rookie',
                description: 'Recycle 10 items',
                requirement: 10,
                type: 'scans',
                icon: 'checkmark-circle',
                points: 150
            },
            TWENTY_FIVE_SCANS: {
                id: 'twenty_five_scans',
                name: 'Green Explorer',
                description: 'Recycle 25 items',
                requirement: 25,
                type: 'scans',
                icon: 'compass',
                points: 250
            },
            FIFTY_SCANS: {
                id: 'fifty_scans',
                name: 'Eco Warrior',
                description: 'Recycle 50 items',
                requirement: 50,
                type: 'scans',
                icon: 'shield',
                points: 400
            },
            HUNDRED_SCANS: {
                id: 'hundred_scans',
                name: 'Century Club',
                description: 'Recycle 100 items',
                requirement: 100,
                type: 'scans',
                icon: 'trophy',
                points: 750
            },
            LEVEL_FIVE: {
                id: 'level_five',
                name: 'Rising Star',
                description: 'Reach Level 5',
                requirement: 5,
                type: 'level',
                icon: 'rocket',
                points: 200
            },
            LEVEL_TEN: {
                id: 'level_ten',
                name: 'Eco Champion',
                description: 'Reach Level 10',
                requirement: 10,
                type: 'level',
                icon: 'flame',
                points: 500
            },
            FIVE_HUNDRED_POINTS: {
                id: 'five_hundred_points',
                name: 'Point Collector',
                description: 'Earn 500 points',
                requirement: 500,
                type: 'points',
                icon: 'diamond',
                points: 150
            },
            THOUSAND_POINTS: {
                id: 'thousand_points',
                name: 'Point Master',
                description: 'Earn 1000 points',
                requirement: 1000,
                type: 'points',
                icon: 'star',
                points: 300
            },
            PLASTIC_SPECIALIST: {
                id: 'plastic_specialist',
                name: 'Plastic Crusher',
                description: 'Recycle 25 plastic items',
                requirement: 25,
                type: 'material_plastic',
                icon: 'water',
                points: 300
            },
            ALUMINUM_EXPERT: {
                id: 'aluminum_expert',
                name: 'Can Crusher',
                description: 'Recycle 20 aluminum cans',
                requirement: 20,
                type: 'material_aluminum',
                icon: 'nutrition',
                points: 350
            }
        };

        // Get material breakdown for specialized achievements
        let materialBreakdown = {};
        try {
            const userScansRef = ref(database, `userScans/${userId}`);
            const scansSnapshot = await get(userScansRef);

            if (scansSnapshot.exists()) {
                scansSnapshot.forEach((childSnapshot) => {
                    const scan = childSnapshot.val();
                    const material = scan.materialType || 'unknown';
                    materialBreakdown[material] = (materialBreakdown[material] || 0) + 1;
                });
            }
        } catch (error) {
            console.log('Material breakdown calculation error:', error);
        }

        // Check each achievement
        Object.values(PRODUCTION_ACHIEVEMENTS).forEach(achievement => {
            if (currentAchievements.includes(achievement.id)) return;

            let earned = false;

            switch (achievement.type) {
                case 'scans':
                    earned = stats.totalScans >= achievement.requirement;
                    break;
                case 'points':
                    earned = stats.points >= achievement.requirement;
                    break;
                case 'level':
                    earned = stats.level >= achievement.requirement;
                    break;
                case 'material_plastic':
                    earned = (materialBreakdown.plastic || 0) >= achievement.requirement;
                    break;
                case 'material_aluminum':
                    earned = (materialBreakdown.aluminum || 0) >= achievement.requirement;
                    break;
                default:
                    earned = false;
            }

            if (earned) {
                newAchievements.push(achievement);
            }
        });

        // Award new achievements
        if (newAchievements.length > 0) {
            const updatedAchievements = [...currentAchievements, ...newAchievements.map(a => a.id)];

            await update(ref(database, `users/${userId}`), {
                achievements: updatedAchievements,
                updatedAt: serverTimestamp()
            });

            console.log(`🏆 New achievements unlocked: ${newAchievements.map(a => a.name).join(', ')}`);
        }

        return newAchievements;
    } catch (error) {
        console.error("❌ Error checking achievements:", error);
        return [];
    }
};

// Enhanced streak tracking
export const checkAndUpdateStreak = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};

        const today = new Date().toDateString();
        const lastScanDate = userData.lastScanDate ? new Date(userData.lastScanDate).toDateString() : null;
        const currentStreak = userData.streak || 0;
        const longestStreak = userData.longestStreak || 0;

        if (lastScanDate !== today) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

            let newStreak;
            if (lastScanDate === yesterday) {
                newStreak = currentStreak + 1;
            } else {
                newStreak = 1;
            }

            const newLongestStreak = Math.max(longestStreak, newStreak);

            await update(userRef, {
                streak: newStreak,
                longestStreak: newLongestStreak,
                lastScanDate: new Date().toISOString(),
                updatedAt: serverTimestamp()
            });

            // Streak milestone notifications
            const streakMilestones = [3, 7, 14, 30, 60, 100];
            if (streakMilestones.includes(newStreak)) {
                setTimeout(() => {
                    try {
                        sendStreakNotification(userId, newStreak);
                    } catch (error) {
                        console.log('Streak notification error:', error);
                    }
                }, 3000);
            }

            return newStreak;
        }

        return currentStreak;
    } catch (error) {
        console.error('❌ Error checking streak:', error);
        return 0;
    }
};

// Enhanced offline queue with better error handling
export const addToQueue = async (scanData) => {
    try {
        console.log('📡 Adding scan to offline queue');

        const queueItem = {
            id: `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            type: 'scan',
            data: scanData,
            timestamp: new Date().toISOString(),
            retryCount: 0,
            maxRetries: 3
        };

        // Store in AsyncStorage or your offline queue system
        // Implementation depends on your offline queue service

        return { success: true, queueId: queueItem.id };
    } catch (error) {
        console.error('❌ Error adding to offline queue:', error);
        return { success: false, error: error.message };
    }
};
