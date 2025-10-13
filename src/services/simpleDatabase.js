import { 
  ref, 
  set, 
  get, 
  update,
  serverTimestamp 
} from "firebase/database";
import { database } from '../config/firebase';

// Simple user operations for immediate functionality
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