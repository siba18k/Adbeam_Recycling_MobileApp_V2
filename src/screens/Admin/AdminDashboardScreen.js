"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import FirebaseService from "../../services/FirebaseService"

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalRewards: 0,
    totalRedemptions: 0,
  })
  const [users, setUsers] = useState([])
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddReward, setShowAddReward] = useState(false)
  const [newReward, setNewReward] = useState({
    name: "",
    description: "",
    pointsCost: "",
    category: "",
    availableInventory: "",
  })

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      const [usersResult, rewardsResult] = await Promise.all([
        FirebaseService.getAllUsers(),
        FirebaseService.getRewards(),
      ])

      if (usersResult.success) {
        setUsers(usersResult.data)
        setStats((prev) => ({ ...prev, totalUsers: usersResult.data.length }))
      }

      if (rewardsResult.success) {
        setRewards(rewardsResult.data)
        setStats((prev) => ({ ...prev, totalRewards: rewardsResult.data.length }))
      }
    } catch (error) {
      console.error("Error loading admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReward = async () => {
    if (!newReward.name || !newReward.pointsCost) {
      Alert.alert("Error", "Please fill in required fields")
      return
    }

    const rewardData = {
      name: newReward.name,
      description: newReward.description,
      pointsCost: Number.parseInt(newReward.pointsCost),
      category: newReward.category || "General",
      availableInventory: newReward.availableInventory ? Number.parseInt(newReward.availableInventory) : null,
      isActive: true,
    }

    const result = await FirebaseService.createReward(rewardData)

    if (result.success) {
      Alert.alert("Success", "Reward added successfully")
      setShowAddReward(false)
      setNewReward({ name: "", description: "", pointsCost: "", category: "", availableInventory: "" })
      loadAdminData()
    } else {
      Alert.alert("Error", result.error || "Failed to add reward")
    }
  }

  const handleToggleReward = async (rewardId, currentStatus) => {
    const result = await FirebaseService.updateReward(rewardId, { isActive: !currentStatus })

    if (result.success) {
      Alert.alert("Success", `Reward ${!currentStatus ? "activated" : "deactivated"}`)
      loadAdminData()
    } else {
      Alert.alert("Error", "Failed to update reward")
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color="#10b981" />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="leaf" size={32} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.totalActivities}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="gift" size={32} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.totalRewards}</Text>
            <Text style={styles.statLabel}>Rewards</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color="#8b5cf6" />
            <Text style={styles.statValue}>{stats.totalRedemptions}</Text>
            <Text style={styles.statLabel}>Redemptions</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Manage Rewards</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddReward(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {rewards.map((reward) => (
            <View key={reward.id} style={styles.rewardItem}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardPoints}>{reward.pointsCost} points</Text>
                {reward.availableInventory !== null && (
                  <Text style={styles.rewardInventory}>{reward.availableInventory} in stock</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.toggleButton, !reward.isActive && styles.toggleButtonInactive]}
                onPress={() => handleToggleReward(reward.id, reward.isActive)}
              >
                <Text style={styles.toggleButtonText}>{reward.isActive ? "Active" : "Inactive"}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Users</Text>
          {users.slice(0, 10).map((user) => (
            <View key={user.id} style={styles.userItem}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={24} color="#10b981" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName || user.email}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <Text style={styles.userPoints}>{user.pointsBalance || 0} pts</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showAddReward} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Reward</Text>
              <TouchableOpacity onPress={() => setShowAddReward(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Reward Name *"
                value={newReward.name}
                onChangeText={(text) => setNewReward({ ...newReward, name: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={newReward.description}
                onChangeText={(text) => setNewReward({ ...newReward, description: text })}
                multiline
                numberOfLines={4}
              />

              <TextInput
                style={styles.input}
                placeholder="Points Cost *"
                value={newReward.pointsCost}
                onChangeText={(text) => setNewReward({ ...newReward, pointsCost: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Category"
                value={newReward.category}
                onChangeText={(text) => setNewReward({ ...newReward, category: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Available Inventory (optional)"
                value={newReward.availableInventory}
                onChangeText={(text) => setNewReward({ ...newReward, availableInventory: text })}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddReward}>
                <Text style={styles.submitButtonText}>Add Reward</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
  },
  rewardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  rewardPoints: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  rewardInventory: {
    fontSize: 12,
    color: "#999",
  },
  toggleButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonInactive: {
    backgroundColor: "#ef4444",
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  userPoints: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
})
