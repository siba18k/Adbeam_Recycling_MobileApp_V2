import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { OfflineStorageService } from "./OfflineStorageService"

class FirebaseService {
  // Users
  async createUser(userId, userData) {
    try {
      await setDoc(doc(db, "users", userId), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      console.error("Error creating user:", error)
      return { success: false, error: error.message }
    }
  }

  async getUser(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        return { success: true, data: { id: userDoc.id, ...userDoc.data() } }
      }
      return { success: false, error: "User not found" }
    } catch (error) {
      console.error("Error getting user:", error)
      // Try offline storage
      const offlineData = await OfflineStorageService.getUser(userId)
      if (offlineData) {
        return { success: true, data: offlineData, offline: true }
      }
      return { success: false, error: error.message }
    }
  }

  async updateUser(userId, updates) {
    try {
      await updateDoc(doc(db, "users", userId), {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      console.error("Error updating user:", error)
      return { success: false, error: error.message }
    }
  }

  // Recycling Activities
  async createRecyclingActivity(userId, activityData) {
    try {
      const activityRef = await addDoc(collection(db, "recyclingActivities"), {
        userId,
        ...activityData,
        createdAt: serverTimestamp(),
        status: "verified",
      })

      // Update user points
      await updateDoc(doc(db, "users", userId), {
        pointsBalance: increment(activityData.pointsAwarded),
        totalPointsEarned: increment(activityData.pointsAwarded),
        updatedAt: serverTimestamp(),
      })

      return { success: true, id: activityRef.id }
    } catch (error) {
      console.error("Error creating activity:", error)
      // Store offline
      await OfflineStorageService.addPendingActivity(userId, activityData)
      return { success: true, offline: true }
    }
  }

  async getUserActivities(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, "recyclingActivities"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      const activities = []
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() })
      })

      // Cache offline
      await OfflineStorageService.cacheActivities(userId, activities)

      return { success: true, data: activities }
    } catch (error) {
      console.error("Error getting activities:", error)
      // Try offline storage
      const offlineData = await OfflineStorageService.getActivities(userId)
      if (offlineData) {
        return { success: true, data: offlineData, offline: true }
      }
      return { success: false, error: error.message }
    }
  }

  // Rewards
  async getRewards() {
    try {
      const q = query(collection(db, "rewards"), where("isActive", "==", true), orderBy("pointsCost", "asc"))

      const querySnapshot = await getDocs(q)
      const rewards = []
      querySnapshot.forEach((doc) => {
        rewards.push({ id: doc.id, ...doc.data() })
      })

      // Cache offline
      await OfflineStorageService.cacheRewards(rewards)

      return { success: true, data: rewards }
    } catch (error) {
      console.error("Error getting rewards:", error)
      // Try offline storage
      const offlineData = await OfflineStorageService.getRewards()
      if (offlineData) {
        return { success: true, data: offlineData, offline: true }
      }
      return { success: false, error: error.message }
    }
  }

  async redeemReward(userId, rewardId, pointsCost) {
    try {
      // Create redemption record
      const redemptionRef = await addDoc(collection(db, "redemptions"), {
        userId,
        rewardId,
        pointsSpent: pointsCost,
        status: "pending",
        redeemedAt: serverTimestamp(),
      })

      // Update user points
      await updateDoc(doc(db, "users", userId), {
        pointsBalance: increment(-pointsCost),
        updatedAt: serverTimestamp(),
      })

      // Update reward inventory if applicable
      const rewardDoc = await getDoc(doc(db, "rewards", rewardId))
      if (rewardDoc.exists() && rewardDoc.data().availableInventory !== null) {
        await updateDoc(doc(db, "rewards", rewardId), {
          availableInventory: increment(-1),
        })
      }

      return { success: true, redemptionId: redemptionRef.id }
    } catch (error) {
      console.error("Error redeeming reward:", error)
      return { success: false, error: error.message }
    }
  }

  async getUserRedemptions(userId) {
    try {
      const q = query(
        collection(db, "redemptions"),
        where("userId", "==", userId),
        orderBy("redeemedAt", "desc"),
        limit(50),
      )

      const querySnapshot = await getDocs(q)
      const redemptions = []
      querySnapshot.forEach((doc) => {
        redemptions.push({ id: doc.id, ...doc.data() })
      })

      return { success: true, data: redemptions }
    } catch (error) {
      console.error("Error getting redemptions:", error)
      return { success: false, error: error.message }
    }
  }

  // Leaderboard
  async getLeaderboard(limitCount = 50) {
    try {
      const q = query(collection(db, "users"), orderBy("totalPointsEarned", "desc"), limit(limitCount))

      const querySnapshot = await getDocs(q)
      const leaderboard = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        leaderboard.push({
          id: doc.id,
          name: data.displayName || data.firstName + " " + data.lastName,
          points: data.totalPointsEarned || 0,
          university: data.university,
        })
      })

      // Cache offline
      await OfflineStorageService.cacheLeaderboard(leaderboard)

      return { success: true, data: leaderboard }
    } catch (error) {
      console.error("Error getting leaderboard:", error)
      // Try offline storage
      const offlineData = await OfflineStorageService.getLeaderboard()
      if (offlineData) {
        return { success: true, data: offlineData, offline: true }
      }
      return { success: false, error: error.message }
    }
  }

  // Material Types
  async getMaterialTypes() {
    try {
      const q = query(collection(db, "materialTypes"), where("isActive", "==", true))

      const querySnapshot = await getDocs(q)
      const materials = []
      querySnapshot.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() })
      })

      // Cache offline
      await OfflineStorageService.cacheMaterialTypes(materials)

      return { success: true, data: materials }
    } catch (error) {
      console.error("Error getting material types:", error)
      // Try offline storage
      const offlineData = await OfflineStorageService.getMaterialTypes()
      if (offlineData) {
        return { success: true, data: offlineData, offline: true }
      }
      return { success: false, error: error.message }
    }
  }

  // Admin functions
  async getAllUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, "users"))
      const users = []
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() })
      })
      return { success: true, data: users }
    } catch (error) {
      console.error("Error getting all users:", error)
      return { success: false, error: error.message }
    }
  }

  async updateReward(rewardId, updates) {
    try {
      await updateDoc(doc(db, "rewards", rewardId), {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      console.error("Error updating reward:", error)
      return { success: false, error: error.message }
    }
  }

  async createReward(rewardData) {
    try {
      const rewardRef = await addDoc(collection(db, "rewards"), {
        ...rewardData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: rewardRef.id }
    } catch (error) {
      console.error("Error creating reward:", error)
      return { success: false, error: error.message }
    }
  }

  // Sync offline data
  async syncOfflineData(userId) {
    try {
      const pendingActivities = await OfflineStorageService.getPendingActivities(userId)

      for (const activity of pendingActivities) {
        await this.createRecyclingActivity(userId, activity)
      }

      await OfflineStorageService.clearPendingActivities(userId)

      return { success: true, synced: pendingActivities.length }
    } catch (error) {
      console.error("Error syncing offline data:", error)
      return { success: false, error: error.message }
    }
  }
}

export default new FirebaseService()
