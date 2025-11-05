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
    sendBonusEventNotification,
    sendNotification
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
// ADMIN FUNCTIONS - GRANT TEST POINTS
// =====================================

export const grantTestPointsToUser = async (adminUserId, targetUserId, pointsToGrant = 500) => {
    try {
        console.log('🎯 Admin granting test points:', { adminUserId, targetUserId, pointsToGrant });

        // Verify admin permissions
        const adminRef = ref(database, `users/${adminUserId}`);
        const adminSnapshot = await get(adminRef);
        if (!adminSnapshot.exists() || adminSnapshot.val().role !== 'admin') {
            return { success: false, error: 'Admin permissions required' };
        }

        // Get target user
        const userRef = ref(database, `users/${targetUserId}`);
        const userSnapshot = await get(userRef);
        if (!userSnapshot.exists()) {
            return { success: false, error: 'Target user not found' };
        }

        const userData = userSnapshot.val();
        const currentPoints = userData.points || 0;
        const currentLevel = userData.level || 1;

        const newPoints = currentPoints + pointsToGrant;
        const newLevel = Math.floor(newPoints / 100) + 1;
        const leveledUp = newLevel > currentLevel;

        // Update user points and level
        await update(userRef, {
            points: newPoints,
            level: newLevel,
            updatedAt: serverTimestamp(),
            lastTestPointsGranted: serverTimestamp(),
            lastTestPointsBy: adminUserId
        });

        // Send notification to the user about receiving test points
        try {
            await sendNotification(targetUserId, {
                category: 'SYSTEM',
                title: 'Test Points Granted! 🎁',
                body: `An admin has granted you ${pointsToGrant} test points! Your new total is ${newPoints} points (Level ${newLevel}).`,
                data: {
                    type: 'test_points_granted',
                    pointsGranted: pointsToGrant,
                    newTotal: newPoints,
                    newLevel: newLevel,
                    grantedBy: adminUserId,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (notifError) {
            console.log('⚠️ Test points granted but notification failed:', notifError);
        }

        // Send level up notification if leveled up
        if (leveledUp) {
            try {
                const pointsToNext = ((newLevel + 1) * 100) - newPoints;
                await sendLevelUpNotification(targetUserId, newLevel, pointsToNext);
            } catch (levelNotifError) {
                console.log('⚠️ Level up notification failed:', levelNotifError);
            }
        }

        console.log('✅ Test points granted successfully');
        return {
            success: true,
            pointsGranted: pointsToGrant,
            oldPoints: currentPoints,
            newPoints: newPoints,
            oldLevel: currentLevel,
            newLevel: newLevel,
            leveledUp: leveledUp
        };

    } catch (error) {
        console.error('❌ Error granting test points:', error);
        return { success: false, error: error.message };
    }
};

// =====================================
// VOUCHER SYSTEM
// =====================================

export const generateVoucherCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ADV-${timestamp}-${random}`;
};

export const redeemRewardWithVoucher = async (userId, rewardId, pointsCost) => {
    try {
        console.log('🎫 Creating voucher for user:', userId, 'Reward:', rewardId);

        // First, verify user authentication
        if (!userId) {
            return { success: false, error: "User not authenticated" };
        }

        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
            return { success: false, error: "User profile not found" };
        }

        const userData = userSnapshot.val();

        if (!userData || (userData.points || 0) < pointsCost) {
            return {
                success: false,
                error: "Insufficient points. You need " + (pointsCost - (userData?.points || 0)) + " more points."
            };
        }

        const rewardRef = ref(database, `rewards/${rewardId}`);
        const rewardSnapshot = await get(rewardRef);

        if (!rewardSnapshot.exists()) {
            return { success: false, error: "Reward not found" };
        }

        const rewardData = rewardSnapshot.val();

        if (!rewardData || !rewardData.available) {
            return {
                success: false,
                error: "Reward is not available"
            };
        }

        const voucherCode = generateVoucherCode();
        const vouchersRef = ref(database, 'vouchers');
        const voucherRef = push(vouchersRef);
        const voucherId = voucherRef.key;

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
            expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            redeemedAt: null,
            redeemedBy: null,
            redeemedByName: null,
            threeDayNotificationSent: false,
            oneDayNotificationSent: false
        };

        // 🚨 FIXED: Use atomic update to prevent permission issues
        const updates = {};
        updates[`vouchers/${voucherId}`] = voucherData;
        updates[`userVouchers/${userId}/${voucherId}`] = {
            voucherId: voucherId,
            voucherCode: voucherCode,
            rewardName: rewardData.name,
            rewardDescription: rewardData.description,
            pointsCost: pointsCost,
            status: 'active',
            category: rewardData.category || 'general',
            createdAt: serverTimestamp(),
            expiresAt: voucherData.expiresAt
        };
        updates[`users/${userId}/points`] = userData.points - pointsCost;
        updates[`users/${userId}/totalVouchersCreated`] = (userData.totalVouchersCreated || 0) + 1;
        updates[`users/${userId}/updatedAt`] = serverTimestamp();
        updates[`rewards/${rewardId}/popularity`] = (rewardData.popularity || 0) + 1;
        updates[`rewards/${rewardId}/lastRedeemedAt`] = serverTimestamp();

        // Execute all updates atomically
        console.log('💾 Executing voucher creation updates...');
        await update(ref(database), updates);
        console.log('✅ Voucher database updates completed');

        // 🚨 CRITICAL FIX: Use setTimeout to ensure notification is sent AFTER database update completes
        setTimeout(async () => {
            try {
                console.log('📱 Sending voucher created notification to user:', userId);
                const notificationResult = await sendNotification(userId, {
                    category: 'SYSTEM',
                    title: 'Voucher Created! 🎟️',
                    body: `Your "${rewardData.name}" voucher (${pointsCost} pts) is ready! Go to the Vouchers tab and show the QR code to staff to redeem.`,
                    data: {
                        type: 'voucher_created',
                        voucherId: voucherId,
                        rewardId: rewardId,
                        rewardName: rewardData.name,
                        pointsCost: pointsCost,
                        voucherCode: voucherCode,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log('✅ Voucher created notification result:', notificationResult);
            } catch (notificationError) {
                console.log('⚠️ Voucher created but notification failed (non-critical):', notificationError);
            }
        }, 1000); // 1 second delay to ensure DB writes complete

        console.log('✅ Reward redeemed with voucher successfully');
        return {
            success: true,
            newPoints: userData.points - pointsCost,
            voucherCode: voucherCode,
            voucherId: voucherId,
            voucherData: voucherData
        };

    } catch (error) {
        console.error("❌ Error redeeming reward with voucher:", error);

        // Enhanced error handling
        if (error.code === 'PERMISSION_DENIED') {
            return {
                success: false,
                error: "Database permission denied. Please check Firebase rules or contact admin.",
                technical: true,
                code: 'PERMISSION_DENIED'
            };
        }

        return { success: false, error: error.message || 'Failed to create voucher' };
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
// STAFF FUNCTIONS
// =====================================

export const redeemVoucherByStaff = async (voucherCode, staffId, staffName) => {
    try {
        console.log('🎫 Staff redeeming voucher:', voucherCode);

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

        const now = new Date();
        const expiryDate = new Date(voucherData.expiresAt);
        if (now > expiryDate) {
            const voucherRef = ref(database, `vouchers/${voucherId}`);
            await update(voucherRef, { status: 'expired' });

            return {
                success: false,
                error: `Voucher expired on ${expiryDate.toLocaleDateString()}`
            };
        }

        const userRef = ref(database, `users/${voucherData.userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        // Update voucher status
        const voucherRef = ref(database, `vouchers/${voucherId}`);
        await update(voucherRef, {
            status: 'redeemed',
            redeemedAt: serverTimestamp(),
            redeemedBy: staffId,
            redeemedByName: staffName
        });

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

// =====================================
// REWARDS AND BASIC FUNCTIONS
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

            rewards.sort((a, b) => (a.points || 0) - (b.points || 0));
            return { success: true, data: rewards };
        }
        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting rewards:", error);
        return { success: false, error: error.message };
    }
};

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

export const createRewardWithNotification = async (rewardData) => {
    try {
        const result = await createReward(rewardData);
        if (result.success) {
            // Send notification to active users (simplified for now)
            console.log('🎁 New reward created with notification capability');
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const editReward = async (rewardId, updates) => {
    try {
        const rewardRef = ref(database, `rewards/${rewardId}`);
        await update(rewardRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteReward = async (rewardId) => {
    try {
        const rewardRef = ref(database, `rewards/${rewardId}`);
        await remove(rewardRef);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const toggleRewardAvailability = async (rewardId, newAvailability) => {
    try {
        const rewardRef = ref(database, `rewards/${rewardId}`);
        await update(rewardRef, {
            available: newAvailability,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const createBonusEvent = async (eventData) => {
    try {
        const eventsRef = ref(database, 'bonusEvents');
        const newEventRef = push(eventsRef);
        await set(newEventRef, {
            ...eventData,
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// =====================================
// USER MANAGEMENT
// =====================================

export const updateUserRole = async (userId, newRole) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            role: newRole,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteUser = async (userId) => {
    try {
        const updates = {};
        updates[`users/${userId}`] = null;
        updates[`userScans/${userId}`] = null;
        updates[`userVouchers/${userId}`] = null;
        await update(ref(database), updates);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateUserData = async (userId, updates) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const promoteToStaff = async (userId) => {
    return await updateUserRole(userId, 'staff');
};

export const resetUserPoints = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            points: 0,
            level: 1,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

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
                co2Saved: 0,
                energySaved: 0,
                waterSaved: 0
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

// =====================================
// SCANNING FUNCTIONS
// =====================================

export const recordScanWithNotifications = async (userId, scanData) => {
    try {
        console.log('🔄 PERMANENT TRACKING: Processing scan for user:', userId);
        console.log('📊 Scan data:', scanData);

        const { barcode, barcodeType, materialType } = scanData;
        const material = MATERIAL_TYPES[materialType];

        if (!material) {
            throw new Error("Invalid material type selected");
        }

        if (!barcode || barcode.trim().length < 3) {
            throw new Error("Invalid barcode format");
        }

        const cleanBarcode = barcode.trim();

        // 🚨 CRITICAL: Check if this EXACT barcode has EVER been scanned by ANYONE
        console.log('🔍 Checking global barcode registry for:', cleanBarcode);
        const barcodeRef = ref(database, `scannedBarcodes/${cleanBarcode}`);
        const barcodeSnapshot = await get(barcodeRef);

        if (barcodeSnapshot.exists()) {
            const existingBarcodeData = barcodeSnapshot.val();
            console.log('❌ DUPLICATE DETECTED - Barcode already exists:', existingBarcodeData);

            return {
                success: false,
                duplicate: true,
                error: "This item has already been recycled and cannot be scanned again",
                duplicateInfo: {
                    barcode: cleanBarcode,
                    firstScannedBy: existingBarcodeData.firstScannedBy || existingBarcodeData.userId,
                    firstScannedAt: existingBarcodeData.timestamp,
                    materialType: existingBarcodeData.materialType,
                    itemName: existingBarcodeData.itemName,
                    scanCount: (existingBarcodeData.scanCount || 1) + 1
                }
            };
        }

        // Generate unique scan ID
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const scanId = `${userId}_${timestamp}_${randomSuffix}`;

        console.log('✅ New barcode detected - proceeding with scan recording');

        // Create comprehensive scan record
        const scanRecord = {
            id: scanId,
            userId: userId,
            barcode: cleanBarcode,
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

        // 🚨 ATOMIC OPERATIONS: All database writes happen together
        const updates = {};

        // Main scan record
        updates[`scans/${scanId}`] = scanRecord;

        // 🚨 CRITICAL: Mark this barcode as PERMANENTLY SCANNED
        updates[`scannedBarcodes/${cleanBarcode}`] = {
            barcode: cleanBarcode,
            userId: userId,
            scanId: scanId,
            materialType: materialType,
            itemName: scanRecord.itemName,
            brand: scanRecord.brand,
            points: material.points,
            timestamp: serverTimestamp(),
            scanMode: 'user_classified',
            permanentlyScanned: true,
            scanCount: 1,
            firstScannedBy: userId,
            duplicateAttempts: 0,
            createdAt: serverTimestamp()
        };

        // User scan history
        updates[`userScans/${userId}/${scanId}`] = {
            scanId: scanId,
            barcode: cleanBarcode,
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

        // 🚨 EXECUTE ALL UPDATES ATOMICALLY
        console.log('💾 Executing atomic database updates...');
        await update(ref(database), updates);

        console.log('✅ PERMANENT TRACKING: Scan recorded successfully');
        console.log('🔒 Barcode permanently locked:', cleanBarcode);

        return {
            success: true,
            points: material.points,
            newTotalPoints: newPoints,
            newLevel: newLevel,
            newTotalScans: newTotalScans,
            scanId: scanId,
            itemName: scanRecord.itemName,
            materialType: materialType,
            userClassified: true,
            leveledUp: newLevel > currentLevel,
            firstTimeScanned: true,
            permanentlyLocked: true
        };

    } catch (error) {
        console.error("❌ PERMANENT TRACKING ERROR:", error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            technical: true
        };
    }
};

// Legacy compatibility
export const recordScan = async (userId, scanData) => {
    console.log('🔄 Legacy recordScan called - redirecting to enhanced version');
    return await recordScanWithNotifications(userId, scanData);
};

// =====================================
// UTILITY FUNCTIONS
// =====================================

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

// =====================================
// ADDITIONAL CORE FUNCTIONS
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

            users.sort((a, b) => {
                if (b.points !== a.points) {
                    return b.points - a.points;
                }
                return b.totalScans - a.totalScans;
            });

            const limitedUsers = users.slice(0, limit);
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

export const getUserStats = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userScansRef = ref(database, `userScans/${userId}`);

        const [userSnapshot, scansSnapshot] = await Promise.all([
            get(userRef),
            get(userScansRef)
        ]);

        const userData = userSnapshot.exists() ? userSnapshot.val() : {};

        const materialBreakdown = { plastic: 0, glass: 0, aluminum: 0, paper: 0 };
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

                const materialType = scan.materialType?.toLowerCase() || 'unknown';
                if (materialBreakdown[materialType] !== undefined) {
                    materialBreakdown[materialType]++;
                }

                const brand = scan.brand || 'Unknown';
                brandBreakdown[brand] = (brandBreakdown[brand] || 0) + 1;

                const category = scan.category || 'general';
                categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;

                totalPointsFromScans += scan.points || 0;

                if (scanDate >= todayStart) scansToday++;
                if (scanDate >= oneWeekAgo) scansThisWeek++;
                if (scanDate >= oneMonthAgo) scansThisMonth++;
            });
        }

        const environmentalImpact = {
            co2Saved: Math.round(userData.totalScans * 0.5 * 100) / 100,
            waterSaved: Math.round(userData.totalScans * 2.3 * 100) / 100,
            energySaved: Math.round(userData.totalScans * 1.2 * 100) / 100,
            landfillDiverted: Math.round(userData.totalScans * 0.3 * 100) / 100,
        };

        const stats = {
            totalScans: userData.totalScans || 0,
            totalPoints: userData.points || 0,
            level: userData.level || 1,
            streak: userData.streak || 0,
            longestStreak: userData.longestStreak || 0,
            achievements: userData.achievements || [],
            materialBreakdown,
            brandBreakdown,
            categoryBreakdown,
            scansToday,
            scansThisWeek,
            scansThisMonth,
            pointsFromScans: totalPointsFromScans,
            averagePointsPerScan: userData.totalScans > 0 ? Math.round((totalPointsFromScans / userData.totalScans) * 100) / 100 : 0,
            environmentalImpact,
            preferences: userData.preferences || { notifications: true, soundEffects: true, hapticFeedback: true }
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error("❌ Error getting user stats:", error);
        return { success: false, error: error.message };
    }
};

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

            scans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return { success: true, data: scans.slice(0, limit) };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error("❌ Error getting user scans:", error);
        return { success: false, error: error.message };
    }
};
