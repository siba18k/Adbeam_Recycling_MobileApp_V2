import {
    ref,
    set,
    get,
    update,
    push,
    query,
    orderByChild,
    limitToLast,
    onValue,
    serverTimestamp
} from "firebase/database";
import { database } from '../config/firebase';

// Material types and their point values
export const MATERIAL_TYPES = {
    GLASS: { name: 'Glass Bottle', points: 10, prefix: '30' },
    ALUMINUM: { name: 'Aluminum Can', points: 7, prefix: '50' },
    PLASTIC: { name: 'Plastic Bottle', points: 5, prefix: '60' }
};

// User Database Operations
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

export const updateUserProfile = async (userId, updates) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return { success: false, error: error.message };
    }
};

// Scan Operations
export const validateBarcode = async (barcode) => {
    try {
        const scanRef = ref(database, `scans/${barcode}`);
        const snapshot = await get(scanRef);
        return { exists: snapshot.exists(), data: snapshot.val() };
    } catch (error) {
        console.error("Error validating barcode:", error);
        return { exists: false, error: error.message };
    }
};

export const recordScan = async (userId, scanData) => {
    try {
        const { barcode, materialType, points, location } = scanData;

        // Check if barcode already scanned
        const validation = await validateBarcode(barcode);
        if (validation.exists) {
            return {
                success: false,
                error: "This item has already been recycled!",
                duplicate: true
            };
        }

        // Record the scan
        const scanRef = ref(database, `scans/${barcode}`);
        await set(scanRef, {
            userId,
            materialType,
            points,
            location,
            timestamp: serverTimestamp(),
            validated: true
        });

        // Update user's scan history
        const userScansRef = ref(database, `userScans/${userId}`);
        const newScanRef = push(userScansRef);
        await set(newScanRef, {
            barcode,
            materialType,
            points,
            location,
            timestamp: serverTimestamp()
        });

        // Update user points and stats
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        const newPoints = (userData.points || 0) + points;
        const newLevel = calculateLevel(newPoints);
        const newStreak = calculateStreak(userData.lastScanDate);

        await update(userRef, {
            points: newPoints,
            level: newLevel,
            totalScans: (userData.totalScans || 0) + 1,
            streak: newStreak,
            lastScanDate: new Date().toISOString(),
            updatedAt: serverTimestamp()
        });

        // Check for achievements
        await checkAndAwardAchievements(userId, {
            totalScans: (userData.totalScans || 0) + 1,
            points: newPoints,
            streak: newStreak
        });

        return {
            success: true,
            points,
            newTotalPoints: newPoints,
            newLevel,
            streak: newStreak
        };
    } catch (error) {
        console.error("Error recording scan:", error);
        return { success: false, error: error.message };
    }
};

// Material Recognition
export const recognizeMaterial = (barcode) => {
    const prefix = barcode.substring(0, 2);

    if (prefix === '30') {
        return MATERIAL_TYPES.GLASS;
    } else if (prefix === '50') {
        return MATERIAL_TYPES.ALUMINUM;
    } else if (prefix === '60') {
        return MATERIAL_TYPES.PLASTIC;
    }

    // Default to plastic if unrecognized
    return MATERIAL_TYPES.PLASTIC;
};

// Level Calculation
const calculateLevel = (points) => {
    return Math.floor(points / 100) + 1;
};

// Streak Calculation
const calculateStreak = (lastScanDate) => {
    if (!lastScanDate) return 1;

    const last = new Date(lastScanDate);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If scanned within 24 hours, increment streak
    if (diffDays <= 1) {
        return 1; // Will be incremented in the calling function
    }

    // Reset streak if more than 24 hours
    return 1;
};

// Leaderboard Operations
export const getLeaderboard = async (limit = 50) => {
    try {
        const usersRef = ref(database, 'users');
        const leaderboardQuery = query(
            usersRef,
            orderByChild('points'),
            limitToLast(limit)
        );

        const snapshot = await get(leaderboardQuery);
        if (snapshot.exists()) {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                users.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });

            // Sort by points descending
            users.sort((a, b) => b.points - a.points);

            return { success: true, data: users };
        }
        return { success: true, data: [] };
    } catch (error) {
        console.error("Error getting leaderboard:", error);
        return { success: false, error: error.message };
    }
};

// Get rewards from Realtime Database
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

        // If no rewards exist, return empty array
        return { success: true, data: [] };
    } catch (error) {
        console.error('Error getting rewards:', error);
        return { success: false, error: error.message };
    }
};

export const redeemReward = async (userId, rewardId, pointsCost) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        if (userData.points < pointsCost) {
            return {
                success: false,
                error: "Insufficient points"
            };
        }

        // Deduct points
        await update(userRef, {
            points: userData.points - pointsCost,
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

        return {
            success: true,
            newPoints: userData.points - pointsCost
        };
    } catch (error) {
        console.error("Error redeeming reward:", error);
        return { success: false, error: error.message };
    }
};

// Achievements System
const ACHIEVEMENTS = {
    FIRST_SCAN: { id: 'first_scan', name: 'First Step', requirement: 1, type: 'scans' },
    TEN_SCANS: { id: 'ten_scans', name: 'Getting Started', requirement: 10, type: 'scans' },
    FIFTY_SCANS: { id: 'fifty_scans', name: 'Eco Warrior', requirement: 50, type: 'scans' },
    HUNDRED_SCANS: { id: 'hundred_scans', name: 'Century Club', requirement: 100, type: 'scans' },
    FIVE_DAY_STREAK: { id: 'five_day_streak', name: 'Consistent', requirement: 5, type: 'streak' },
    THIRTY_DAY_STREAK: { id: 'thirty_day_streak', name: 'Dedicated', requirement: 30, type: 'streak' },
    HUNDRED_POINTS: { id: 'hundred_points', name: 'Point Collector', requirement: 100, type: 'points' },
    THOUSAND_POINTS: { id: 'thousand_points', name: 'Point Master', requirement: 1000, type: 'points' }
};

export const checkAndAwardAchievements = async (userId, stats) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        const currentAchievements = userData.achievements || [];

        const newAchievements = [];

        Object.values(ACHIEVEMENTS).forEach(achievement => {
            // Skip if already earned
            if (currentAchievements.includes(achievement.id)) return;

            let earned = false;

            switch (achievement.type) {
                case 'scans':
                    earned = stats.totalScans >= achievement.requirement;
                    break;
                case 'streak':
                    earned = stats.streak >= achievement.requirement;
                    break;
                case 'points':
                    earned = stats.points >= achievement.requirement;
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
        }

        return newAchievements;
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

// ... (keep all existing code, just update this function)

export const createUserProfile = async (userId, userData) => {
    try {
        const userRef = ref(database, `users/${userId}`);

        // Check if user already exists
        const existingUser = await get(userRef);
        if (existingUser.exists()) {
            console.log('User profile already exists');
            return { success: true, data: existingUser.val() };
        }

        // Create new user profile
        const newUserData = {
            ...userData,
            points: 0,
            level: 1,
            totalScans: 0,
            streak: 0,
            lastScanDate: null,
            achievements: [],
            role: 'user', // Default role
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
