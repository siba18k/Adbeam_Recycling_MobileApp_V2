import {
    ref,
    set,
    get,
    update,
    push,
    query,
    orderByChild,
    limitToLast,
    serverTimestamp
} from "firebase/database";
import { database } from '../config/firebase';

// Material types and their point values
export const MATERIAL_TYPES = {
    PLASTIC: { name: 'Plastic Bottle', points: 5, color: '#3b82f6', icon: 'bottle-water' },
    GLASS: { name: 'Glass Bottle', points: 10, color: '#10b981', icon: 'glass-wine' },
    ALUMINUM: { name: 'Aluminum Can', points: 7, color: '#64748b', icon: 'can' },
    PAPER: { name: 'Paper/Cardboard', points: 3, color: '#f59e0b', icon: 'newspaper' }
};

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
