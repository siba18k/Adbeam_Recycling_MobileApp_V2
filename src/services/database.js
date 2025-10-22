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
// Material types and their point values
export const MATERIAL_TYPES = {
    PLASTIC: {
        name: 'Plastic Bottle',
        points: 5,
        color: '#3b82f6',
        icon: 'water-outline'
    },
    GLASS: {
        name: 'Glass Bottle',
        points: 10,
        color: '#10b981',
        icon: 'wine-outline'
    },
    ALUMINUM: {
        name: 'Aluminum Can',
        points: 7,
        color: '#f59e0b',
        icon: 'nutrition-outline'
    },
    PAPER: {
        name: 'Paper/Cardboard',
        points: 3,
        color: '#8b5cf6',
        icon: 'newspaper-outline'
    }
};
import {
    sendAchievementNotification,
    sendLevelUpNotification,
    sendMilestoneNotification,
    sendStreakNotification,
    sendRecyclingReminderNotification, sendVoucherExpiringNotification, sendNewRewardNotification,
    sendBonusEventNotification
} from './notificationService';

// User Database Operations
export const createUserProfile = async (userId, userData) => {
    try {
        const userRef = ref(database, `users/${userId}`);

        const existingUser = await get(userRef);
        if (existingUser.exists()) {
            console.log('User profile already exists');
            return { success: true, data: existingUser.val() };
        }

        const newUserData = {
            ...userData,
            points: 0,
            level: 1,
            totalScans: 0,
            streak: 0,
            lastScanDate: null,
            achievements: [],
            role: 'user',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await set(userRef, newUserData);
        console.log('User profile created successfully');

        return { success: true, data: newUserData };
    } catch (error) {
        console.error("Error creating user profile:", error);
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
        console.error("Error getting user profile:", error);
        return { success: false, error: error.message };
    }
};

// FIXED: Leaderboard Operations (Realtime Database)
export const getLeaderboard = async (limit = 50) => {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData && userData.points !== undefined) {
                    users.push({
                        id: childSnapshot.key,
                        ...userData
                    });
                }
            });

            // Sort by points descending and limit
            users.sort((a, b) => (b.points || 0) - (a.points || 0));
            const limitedUsers = users.slice(0, limit);

            return { success: true, data: limitedUsers };
        }
        return { success: true, data: [] };
    } catch (error) {
        console.error("Error getting leaderboard:", error);
        return { success: false, error: error.message };
    }
};

// FIXED: Rewards Operations (Realtime Database)
export const getRewards = async () => {
    try {
        const rewardsRef = ref(database, 'rewards');
        const snapshot = await get(rewardsRef);

        if (snapshot.exists()) {
            const rewards = [];
            snapshot.forEach((childSnapshot) => {
                rewards.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return { success: true, data: rewards };
        }
        return { success: true, data: [] };
    } catch (error) {
        console.error("Error getting rewards:", error);
        return { success: false, error: error.message };
    }
};

// Initialize sample data
export const initializeRewards = async () => {
    try {
        const rewardsRef = ref(database, 'rewards');

        const initialRewards = {
            'reward-1': {
                name: 'Campus Cafeteria Voucher',
                description: '₦50 off any meal at campus cafeteria',
                points: 500,
                category: 'food',
                image: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Cafeteria+Voucher',
                available: true,
                stock: 100,
                createdAt: serverTimestamp()
            },
            'reward-2': {
                name: 'Eco-Friendly Water Bottle',
                description: 'Reusable stainless steel water bottle',
                points: 800,
                category: 'merchandise',
                image: 'https://via.placeholder.com/300x200/22c55e/FFFFFF?text=Water+Bottle',
                available: true,
                stock: 50,
                createdAt: serverTimestamp()
            },
            'reward-3': {
                name: 'Green Campus T-Shirt',
                description: 'Organic cotton recycling awareness t-shirt',
                points: 1200,
                category: 'merchandise',
                image: 'https://via.placeholder.com/300x200/10b981/FFFFFF?text=Eco+T-Shirt',
                available: true,
                stock: 30,
                createdAt: serverTimestamp()
            }
        };

        await set(rewardsRef, initialRewards);
        console.log('✅ Rewards initialized successfully!');
        return { success: true };
    } catch (error) {
        console.error('❌ Error initializing rewards:', error);
        return { success: false, error: error.message };
    }
};

// Scan recording with material selection
export const recordScan = async (userId, scanData) => {
    try {
        const { barcode, materialType, points, location } = scanData;

        // Check if barcode already scanned
        const scanRef = ref(database, `scans/${barcode}`);
        const existingScan = await get(scanRef);

        if (existingScan.exists()) {
            return {
                success: false,
                error: "This item has already been recycled!",
                duplicate: true
            };
        }

        // Record the scan
        await set(scanRef, {
            userId,
            materialType,
            points,
            location,
            timestamp: serverTimestamp(),
            validated: true
        });

        // Update user stats
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};

        const newPoints = (userData.points || 0) + points;
        const newLevel = Math.floor(newPoints / 100) + 1;
        const newTotalScans = (userData.totalScans || 0) + 1;

        await update(userRef, {
            points: newPoints,
            level: newLevel,
            totalScans: newTotalScans,
            lastScanDate: new Date().toISOString(),
            updatedAt: serverTimestamp()
        });

        return {
            success: true,
            points,
            newTotalPoints: newPoints,
            newLevel,
            newTotalScans
        };
    } catch (error) {
        console.error("Error recording scan:", error);
        return { success: false, error: error.message };
    }
};
// Add these functions to the existing database.js file:

// Achievements System
const ACHIEVEMENTS = {
    FIRST_SCAN: {
        id: 'first_scan',
        name: 'First Step',
        description: 'Complete your first recycling scan',
        requirement: 1,
        type: 'scans',
        icon: 'leaf',
        points: 50
    },
    TEN_SCANS: {
        id: 'ten_scans',
        name: 'Getting Started',
        description: 'Recycle 10 items',
        requirement: 10,
        type: 'scans',
        icon: 'trending-up',
        points: 100
    },
    FIFTY_SCANS: {
        id: 'fifty_scans',
        name: 'Eco Warrior',
        description: 'Recycle 50 items',
        requirement: 50,
        type: 'scans',
        icon: 'shield',
        points: 250
    },
    HUNDRED_SCANS: {
        id: 'hundred_scans',
        name: 'Century Club',
        description: 'Recycle 100 items',
        requirement: 100,
        type: 'scans',
        icon: 'trophy',
        points: 500
    },
    FIVE_HUNDRED_POINTS: {
        id: 'five_hundred_points',
        name: 'Point Collector',
        description: 'Earn 500 points',
        requirement: 500,
        type: 'points',
        icon: 'diamond',
        points: 100
    },
    THOUSAND_POINTS: {
        id: 'thousand_points',
        name: 'Point Master',
        description: 'Earn 1000 points',
        requirement: 1000,
        type: 'points',
        icon: 'star',
        points: 200
    },
    LEVEL_FIVE: {
        id: 'level_five',
        name: 'Rising Star',
        description: 'Reach Level 5',
        requirement: 5,
        type: 'level',
        icon: 'rocket',
        points: 150
    },
    LEVEL_TEN: {
        id: 'level_ten',
        name: 'Eco Champion',
        description: 'Reach Level 10',
        requirement: 10,
        type: 'level',
        icon: 'flame',
        points: 300
    }
};

export const checkAndAwardAchievements = async (userId, stats) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        const currentAchievements = userData?.achievements || [];

        const newAchievements = [];

        Object.values(ACHIEVEMENTS).forEach(achievement => {
            // Skip if already earned
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
            }

            if (earned) {
                newAchievements.push(achievement.id);
            }
        });

        if (newAchievements.length > 0) {
            await update(userRef, {
                achievements: [...currentAchievements, ...newAchievements],
                updatedAt: serverTimestamp()
            });

            console.log(`🏆 New achievements earned: ${newAchievements.join(', ')}`);
        }

        return newAchievements.map(id =>
            Object.values(ACHIEVEMENTS).find(a => a.id === id)
        );
    } catch (error) {
        console.error("Error checking achievements:", error);
        return [];
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

// Get user's recent scans
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
        console.error("Error getting user scans:", error);
        return { success: false, error: error.message };
    }
};

// Get user's scanning statistics
export const getUserStats = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const scansRef = ref(database, `userScans/${userId}`);

        const [userSnapshot, scansSnapshot] = await Promise.all([
            get(userRef),
            get(scansRef)
        ]);

        const userData = userSnapshot.exists() ? userSnapshot.val() : {};

        // Calculate material breakdown
        const materialBreakdown = {
            plastic: 0,
            glass: 0,
            aluminum: 0,
            paper: 0
        };

        let totalPointsFromScans = 0;
        let scansThisWeek = 0;
        let scansThisMonth = 0;

        if (scansSnapshot.exists()) {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            scansSnapshot.forEach((childSnapshot) => {
                const scan = childSnapshot.val();
                const scanDate = new Date(scan.timestamp);

                // Count materials
                const materialType = scan.materialType.toLowerCase();
                if (materialType.includes('plastic')) materialBreakdown.plastic++;
                else if (materialType.includes('glass')) materialBreakdown.glass++;
                else if (materialType.includes('aluminum')) materialBreakdown.aluminum++;
                else if (materialType.includes('paper')) materialBreakdown.paper++;

                totalPointsFromScans += scan.points || 0;

                // Count recent scans
                if (scanDate > oneWeekAgo) scansThisWeek++;
                if (scanDate > oneMonthAgo) scansThisMonth++;
            });
        }

        const stats = {
            totalScans: userData.totalScans || 0,
            totalPoints: userData.points || 0,
            level: userData.level || 1,
            achievements: userData.achievements || [],
            materialBreakdown,
            scansThisWeek,
            scansThisMonth,
            pointsFromScans: totalPointsFromScans,
            averagePointsPerScan: userData.totalScans > 0 ? Math.round(totalPointsFromScans / userData.totalScans) : 0
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error("Error getting user stats:", error);
        return { success: false, error: error.message };
    }
};

// Update the recordScan function to include achievement checking
export const recordScanWithAchievements = async (userId, scanData) => {
    try {
        const result = await recordScan(userId, scanData);

        if (result.success) {
            // Check for new achievements
            const newAchievements = await checkAndAwardAchievements(userId, {
                totalScans: result.newTotalScans,
                points: result.newTotalPoints,
                level: result.newLevel
            });

            return {
                ...result,
                newAchievements
            };
        }

        return result;
    } catch (error) {
        console.error("Error recording scan with achievements:", error);
        return { success: false, error: error.message };
    }
};

// Add these missing functions to the end of your database.js file

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

        // Record redemption
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

export const addTestPoints = async (userId, points) => {
    if (!__DEV__) {
        return { success: false, error: 'Only available in development' };
    }

    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};

        const currentPoints = userData.points || 0;
        const newPoints = currentPoints + points;
        const newLevel = Math.floor(newPoints / 100) + 1;

        await update(userRef, {
            points: newPoints,
            level: newLevel,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Added ${points} points. Total: ${newPoints}`);
        return {
            success: true,
            newPoints,
            newLevel,
            pointsAdded: points
        };
    } catch (error) {
        console.error('❌ Error adding test points:', error);
        return { success: false, error: error.message };
    }
};

export const resetUserPoints = async (userId) => {
    if (!__DEV__) {
        return { success: false, error: 'Only available in development' };
    }

    try {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            points: 0,
            level: 1,
            totalScans: 0,
            updatedAt: serverTimestamp()
        });

        console.log('✅ Reset user points to 0');
        return { success: true };
    } catch (error) {
        console.error('❌ Error resetting points:', error);
        return { success: false, error: error.message };
    }
};

// Add this function to handle profile image uploads
export const uploadProfileImage = async (userId, imageUri) => {
    try {
        // For now, we'll store a placeholder URL
        // In production, you'd upload to Firebase Storage
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

// Voucher System Functions
export const generateVoucherCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ADV-${timestamp}-${random}`.toUpperCase();
};

export const redeemRewardWithVoucher = async (userId, rewardId, pointsCost) => {
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

        // Generate unique voucher code
        const voucherCode = generateVoucherCode();
        const voucherId = push(ref(database, 'vouchers')).key;

        // Get reward details
        const rewardRef = ref(database, `rewards/${rewardId}`);
        const rewardSnapshot = await get(rewardRef);
        const rewardData = rewardSnapshot.val();

        // Create voucher record
        const voucherData = {
            id: voucherId,
            userId: userId,
            rewardId: rewardId,
            rewardName: rewardData?.name || 'Unknown Reward',
            rewardDescription: rewardData?.description || '',
            voucherCode: voucherCode,
            pointsCost: pointsCost,
            status: 'active',
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days
            redeemedAt: null,
            redeemedBy: null
        };

        // Save voucher
        const voucherRef = ref(database, `vouchers/${voucherId}`);
        await set(voucherRef, voucherData);

        // Save user's voucher reference
        const userVoucherRef = ref(database, `userVouchers/${userId}/${voucherId}`);
        await set(userVoucherRef, {
            voucherId: voucherId,
            voucherCode: voucherCode,
            rewardName: rewardData?.name || 'Unknown Reward',
            pointsCost: pointsCost,
            status: 'active',
            createdAt: serverTimestamp()
        });

        // Deduct points from user
        const newPoints = userData.points - pointsCost;
        await update(userRef, {
            points: newPoints,
            updatedAt: serverTimestamp()
        });

        console.log('✅ Reward redeemed with voucher successfully');
        return {
            success: true,
            newPoints: newPoints,
            voucherCode: voucherCode,
            voucherId: voucherId
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
                vouchers.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
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

export const redeemVoucher = async (voucherCode, redeemedBy) => {
    try {
        // Find voucher by code
        // Update voucher status
        const voucherRef = ref(database, `vouchers/${voucherId}`);
        await update(voucherRef, {
            status: 'redeemed',
            redeemedAt: serverTimestamp(),
            redeemedBy: redeemedBy
        });

        // Update user's voucher record
        const userVoucherRef = ref(database, `userVouchers/${voucherData.userId}/${voucherId}`);
        await update(userVoucherRef, {
            status: 'redeemed',
            redeemedAt: serverTimestamp()
        });

        console.log('✅ Voucher redeemed successfully');
        return {
            success: true,
            reward: voucherData.rewardName,
            userId: voucherData.userId
        };
    } catch (error) {
        console.error("❌ Error redeeming voucher:", error);
        return { success: false, error: error.message };
    }
};

// Admin Functions
export const getAllUsers = async () => {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                users.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
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
            snapshot.forEach((childSnapshot) => {
                vouchers.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
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


export const createReward = async (rewardData) => {
    try {
        const rewardsRef = ref(database, 'rewards');
        const newRewardRef = push(rewardsRef);
        await set(newRewardRef, {
            ...rewardData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log('✅ Reward created successfully');
        return { success: true, id: newRewardRef.key };
    } catch (error) {
        console.error("❌ Error creating reward:", error);
        return { success: false, error: error.message };
    }
};

export const updateUserRole = async (userId, role) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            role: role,
            updatedAt: serverTimestamp()
        });
        console.log('✅ User role updated successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error updating user role:", error);
        return { success: false, error: error.message };
    }
};

export const getAppStats = async () => {
    try {
        const [usersResult, vouchersResult, scansSnapshot] = await Promise.all([
            getAllUsers(),
            getAllVouchers(),
            get(ref(database, 'scans'))
        ]);

        const users = usersResult.success ? usersResult.data : [];
        const vouchers = vouchersResult.success ? vouchersResult.data : [];

        let totalScans = 0;
        if (scansSnapshot.exists()) {
            scansSnapshot.forEach(() => totalScans++);
        }

        const stats = {
            totalUsers: users.length,
            totalPoints: users.reduce((sum, user) => sum + (user.points || 0), 0),
            totalScans: totalScans,
            totalVouchers: vouchers.length,
            activeVouchers: vouchers.filter(v => v.status === 'active').length,
            redeemedVouchers: vouchers.filter(v => v.status === 'redeemed').length,
            topUsers: users
                .sort((a, b) => (b.points || 0) - (a.points || 0))
                .slice(0, 10)
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error("❌ Error getting app stats:", error);
        return { success: false, error: error.message };
    }
};

// Enhanced Admin User Management Functions
export const deleteUser = async (userId) => {
    try {
        // First check if trying to delete an admin
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        if (userData?.role === 'admin') {
            return { success: false, error: 'Cannot delete admin users' };
        }

        // Delete user data using the imported remove function
        await Promise.all([
            remove(ref(database, `users/${userId}`)),
            remove(ref(database, `userScans/${userId}`)),
            remove(ref(database, `userVouchers/${userId}`)),
            remove(ref(database, `redemptions/${userId}`))
        ]);

        console.log('✅ User deleted successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        return { success: false, error: error.message };
    }
};


export const promoteToStaff = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            role: 'staff',
            updatedAt: serverTimestamp()
        });
        console.log('✅ User promoted to staff successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error promoting user to staff:", error);
        return { success: false, error: error.message };
    }
};


// Fix the existing deleteReward function to use the imported remove
export const deleteReward = async (rewardId) => {
    try {
        const rewardRef = ref(database, `rewards/${rewardId}`);
        await remove(rewardRef); // Now uses the properly imported remove function
        console.log('✅ Reward deleted successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error deleting reward:", error);
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
        console.log('✅ User data updated successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error updating user data:", error);
        return { success: false, error: error.message };
    }
};

// Enhanced Reward Management with Edit Functionality
export const editReward = async (rewardId, updates) => {
    try {
        const rewardRef = ref(database, `rewards/${rewardId}`);
        await update(rewardRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Reward edited successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error editing reward:", error);
        return { success: false, error: error.message };
    }
};

export const toggleRewardAvailability = async (rewardId, available) => {
    try {
        const rewardRef = ref(database, `rewards/${rewardId}`);
        await update(rewardRef, {
            available: available,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Reward availability toggled successfully');
        return { success: true };
    } catch (error) {
        console.error("❌ Error toggling reward availability:", error);
        return { success: false, error: error.message };
    }
};

// Staff-specific functions
export const getStaffStats = async () => {
    try {
        const vouchersResult = await getAllVouchers();
        const usersResult = await getAllUsers();

        if (!vouchersResult.success || !usersResult.success) {
            return { success: false, error: 'Failed to fetch data' };
        }

        const vouchers = vouchersResult.data;
        const users = usersResult.data;

        // Calculate today's redemptions
        const today = new Date().toDateString();
        const todayRedemptions = vouchers.filter(v =>
            v.status === 'redeemed' &&
            v.redeemedAt &&
            new Date(v.redeemedAt).toDateString() === today
        ).length;

        // Calculate this week's redemptions
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekRedemptions = vouchers.filter(v =>
            v.status === 'redeemed' &&
            v.redeemedAt &&
            new Date(v.redeemedAt) > oneWeekAgo
        ).length;

        const stats = {
            totalUsers: users.length,
            activeStudents: users.filter(u => u.role === 'user').length,
            totalVouchers: vouchers.length,
            activeVouchers: vouchers.filter(v => v.status === 'active').length,
            redeemedVouchers: vouchers.filter(v => v.status === 'redeemed').length,
            todayRedemptions,
            weekRedemptions
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error("❌ Error getting staff stats:", error);
        return { success: false, error: error.message };
    }
};

// Staff-specific enhanced functions
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

        // Calculate comprehensive stats
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const todayVouchers = vouchers.filter(v =>
            v.status === 'redeemed' &&
            v.redeemedAt &&
            new Date(v.redeemedAt) >= todayStart
        );

        const weekVouchers = vouchers.filter(v =>
            v.status === 'redeemed' &&
            v.redeemedAt &&
            new Date(v.redeemedAt) >= weekStart
        );

        const monthVouchers = vouchers.filter(v =>
            v.status === 'redeemed' &&
            v.redeemedAt &&
            new Date(v.redeemedAt) >= monthStart
        );

        // Popular rewards
        const rewardRedemptions = {};
        vouchers.forEach(v => {
            if (v.status === 'redeemed') {
                rewardRedemptions[v.rewardName] = (rewardRedemptions[v.rewardName] || 0) + 1;
            }
        });

        const popularRewards = Object.entries(rewardRedemptions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const dashboardData = {
            totalUsers: users.length,
            activeStudents: users.filter(u => u.role === 'user' && u.totalScans > 0).length,
            totalVouchers: vouchers.length,
            activeVouchers: vouchers.filter(v => v.status === 'active').length,
            redeemedVouchers: vouchers.filter(v => v.status === 'redeemed').length,
            expiredVouchers: vouchers.filter(v => {
                if (v.status !== 'active') return false;
                return new Date() > new Date(v.expiresAt);
            }).length,

            // Time-based stats
            todayRedemptions: todayVouchers.length,
            weekRedemptions: weekVouchers.length,
            monthRedemptions: monthVouchers.length,

            // Recent data
            recentVouchers: vouchers
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 15),

            topStudents: users
                .filter(u => u.role === 'user')
                .sort((a, b) => (b.totalScans || 0) - (a.totalScans || 0))
                .slice(0, 10),

            popularRewards,

            // Reward availability
            totalRewards: rewards.length,
            availableRewards: rewards.filter(r => r.available).length,
        };

        return { success: true, data: dashboardData };
    } catch (error) {
        console.error("❌ Error getting staff dashboard data:", error);
        return { success: false, error: error.message };
    }
};

export const redeemVoucherByStaff = async (voucherCode, staffId, staffName) => {
    try {
        // Find voucher by code
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
            return { success: false, error: 'Invalid voucher code' };
        }

        if (voucherData.status !== 'active') {
            return { success: false, error: 'Voucher has already been redeemed' };
        }

        // Check if expired
        const now = new Date();
        const expiryDate = new Date(voucherData.expiresAt);
        if (now > expiryDate) {
            return { success: false, error: 'Voucher has expired' };
        }

        // Get user info for notification
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

        // Update user's voucher record
        const userVoucherRef = ref(database, `userVouchers/${voucherData.userId}/${voucherId}`);
        await update(userVoucherRef, {
            status: 'redeemed',
            redeemedAt: serverTimestamp(),
            redeemedBy: staffId
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
                        ...voucher
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

// Enhanced role change function with better feedback
export const changeUserRole = async (userId, newRole) => {
    try {
        console.log(`🔄 Changing user ${userId} role to ${newRole}`);

        const userRef = ref(database, `users/${userId}`);

        // Get current user data first
        const snapshot = await get(userRef);
        if (!snapshot.exists()) {
            return { success: false, error: 'User not found' };
        }

        const currentData = snapshot.val();
        console.log('📋 Current user role:', currentData.role);

        // Update role
        await update(userRef, {
            role: newRole,
            roleUpdatedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        console.log('✅ User role updated successfully to:', newRole);
        return { success: true, oldRole: currentData.role, newRole };
    } catch (error) {
        console.error("❌ Error changing user role:", error);
        return { success: false, error: error.message };
    }
};

// Enhanced recordScan with comprehensive notifications
export const recordScanWithNotifications = async (userId, scanData) => {
    try {
        const result = await recordScan(userId, scanData);

        if (result.success) {
            // Check for achievements and send notifications
            const newAchievements = await checkAndAwardAchievements(userId, {
                totalScans: result.newTotalScans,
                points: result.newTotalPoints,
                level: result.newLevel
            });

            // Send achievement notifications
            for (const achievement of newAchievements) {
                await sendAchievementNotification(
                    userId,
                    achievement.name,
                    achievement.points
                );
            }

            // Level up notification
            if (result.newLevel > (result.newLevel - Math.floor(result.points / 100))) {
                const pointsToNext = ((result.newLevel + 1) * 100) - result.newTotalPoints;
                await sendLevelUpNotification(userId, result.newLevel, pointsToNext);
            }

            // Milestone notifications
            const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
            if (milestones.includes(result.newTotalScans)) {
                await sendMilestoneNotification(
                    userId,
                    `${result.newTotalScans} Items Recycled`,
                    result.newTotalScans >= 100 ? 'Special eco-warrior badge!' : null
                );
            }

            // Points milestones
            const pointsMilestones = [100, 500, 1000, 2500, 5000];
            if (pointsMilestones.includes(result.newTotalPoints)) {
                await sendMilestoneNotification(
                    userId,
                    `${result.newTotalPoints} Points Earned`,
                    'You\'re becoming an eco-champion!'
                );
            }

            // Streak tracking and notifications
            await checkAndUpdateStreak(userId);

            return {
                ...result,
                newAchievements
            };
        }

        return result;
    } catch (error) {
        console.error("Error recording scan with notifications:", error);
        return { success: false, error: error.message };
    }
};

// Streak tracking system
export const checkAndUpdateStreak = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        const today = new Date().toDateString();
        const lastScanDate = userData?.lastScanDate ? new Date(userData.lastScanDate).toDateString() : null;
        const currentStreak = userData?.streak || 0;

        if (lastScanDate !== today) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

            let newStreak;
            if (lastScanDate === yesterday) {
                // Consecutive day
                newStreak = currentStreak + 1;
            } else {
                // Streak broken or first scan
                newStreak = 1;
            }

            await update(userRef, {
                streak: newStreak,
                lastScanDate: new Date().toISOString()
            });

            // Send streak notifications
            if ([3, 7, 14, 30, 100].includes(newStreak)) {
                await sendStreakNotification(userId, newStreak);
            }

            return newStreak;
        }

        return currentStreak;
    } catch (error) {
        console.error('Error checking streak:', error);
        return 0;
    }
};

// Enhanced reward creation with notifications
export const createRewardWithNotification = async (rewardData) => {
    try {
        const result = await createReward(rewardData);

        if (result.success) {
            // Get all users to notify about new reward
            const usersResult = await getAllUsers();

            if (usersResult.success) {
                // Notify all users about new reward (limit to active users)
                const activeUsers = usersResult.data.filter(user =>
                    user.role === 'user' &&
                    (user.totalScans || 0) > 0 &&
                    (user.points || 0) >= rewardData.points * 0.5 // Only notify users who are close to affording it
                );

                // Send notifications in batches to avoid overwhelming
                for (let i = 0; i < Math.min(activeUsers.length, 100); i++) {
                    const user = activeUsers[i];
                    setTimeout(() => {
                        sendNewRewardNotification(user.id, rewardData.name, rewardData.points, rewardData.category);
                    }, i * 100); // Stagger notifications
                }
            }
        }

        return result;
    } catch (error) {
        console.error("Error creating reward with notification:", error);
        return { success: false, error: error.message };
    }
};

// Check for expiring vouchers and send notifications
export const checkExpiringVouchers = async () => {
    try {
        const vouchersResult = await getAllVouchers();

        if (!vouchersResult.success) return;

        const vouchers = vouchersResult.data;
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        for (const voucher of vouchers) {
            if (voucher.status === 'active') {
                const expiryDate = new Date(voucher.expiresAt);

                // Notify 3 days before expiry
                if (expiryDate <= threeDays && expiryDate > tomorrow && !voucher.threeDayNotificationSent) {
                    await sendVoucherExpiringNotification(voucher.userId, voucher.rewardName, '3 days');

                    // Mark as notified
                    const voucherRef = ref(database, `vouchers/${voucher.id}`);
                    await update(voucherRef, { threeDayNotificationSent: true });
                }

                // Notify 1 day before expiry
                if (expiryDate <= tomorrow && expiryDate > now && !voucher.oneDayNotificationSent) {
                    await sendVoucherExpiringNotification(voucher.userId, voucher.rewardName, '1 day');

                    // Mark as notified
                    const voucherRef = ref(database, `vouchers/${voucher.id}`);
                    await update(voucherRef, { oneDayNotificationSent: true });
                }
            }
        }

        console.log('✅ Expiring voucher check completed');
    } catch (error) {
        console.error('Error checking expiring vouchers:', error);
    }
};

// Send daily recycling reminders
export const sendDailyReminders = async () => {
    try {
        const usersResult = await getAllUsers();

        if (!usersResult.success) return;

        const users = usersResult.data;
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        for (const user of users) {
            if (user.role === 'user' && user.lastScanDate) {
                const lastScan = new Date(user.lastScanDate);
                const daysSinceLastScan = Math.floor((now - lastScan) / (24 * 60 * 60 * 1000));

                // Send reminder if inactive for 3+ days
                if (daysSinceLastScan >= 3 && lastScan < threeDaysAgo) {
                    await sendRecyclingReminderNotification(user.id, daysSinceLastScan);
                }
            }
        }

        console.log('✅ Daily reminders sent');
    } catch (error) {
        console.error('Error sending daily reminders:', error);
    }
};

// Create bonus events
export const createBonusEvent = async (eventData) => {
    try {
        const eventsRef = ref(database, 'events');
        const newEventRef = push(eventsRef);

        const event = {
            ...eventData,
            id: newEventRef.key,
            active: true,
            createdAt: serverTimestamp()
        };

        await set(newEventRef, event);

        // Notify all active users about bonus event
        const usersResult = await getAllUsers();
        if (usersResult.success) {
            const activeUsers = usersResult.data.filter(u => u.role === 'user' && (u.totalScans || 0) > 0);

            for (let i = 0; i < Math.min(activeUsers.length, 200); i++) {
                setTimeout(() => {
                    sendBonusEventNotification(
                        activeUsers[i].id,
                        eventData.name,
                        eventData.bonusMultiplier,
                        eventData.endsAt
                    );
                }, i * 50);
            }
        }

        return { success: true, eventId: newEventRef.key };
    } catch (error) {
        console.error('Error creating bonus event:', error);
        return { success: false, error: error.message };
    }
};
// Test function to trigger various notifications (remove in production)
export const testNotifications = async (userId) => {
    if (!__DEV__) return;

    try {
        console.log('🧪 Testing notifications for user:', userId);

        // Test different notification types
        setTimeout(() => sendAchievementNotification(userId, 'Test Achievement', 50), 1000);
        setTimeout(() => sendLevelUpNotification(userId, 5, 200), 3000);
        setTimeout(() => sendMilestoneNotification(userId, '10 Items Recycled', 'Special badge'), 5000);
        setTimeout(() => sendNewRewardNotification(userId, 'Test Reward', 500, 'food'), 7000);
        setTimeout(() => sendVoucherExpiringNotification(userId, 'Cafeteria Voucher', '2 days'), 9000);

        console.log('🧪 Test notifications scheduled');
        return { success: true };
    } catch (error) {
        console.error('Error testing notifications:', error);
        return { success: false, error: error.message };
    }
};
