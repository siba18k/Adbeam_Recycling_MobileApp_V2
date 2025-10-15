import { 
  ref, 
  set, 
  get, 
  update,
  serverTimestamp 
} from "firebase/database";
import { database } from '../config/firebase';


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