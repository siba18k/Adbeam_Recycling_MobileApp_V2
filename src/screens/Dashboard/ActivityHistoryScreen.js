"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/AuthContext"
import FirebaseService from "../../services/FirebaseService"

export default function ActivityHistoryScreen({ navigation }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    if (!user) return

    const result = await FirebaseService.getUserActivities(user.id, 100)
    if (result.success) {
      setActivities(result.data)
    }
    setLoading(false)
  }

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const renderActivity = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Ionicons name="checkmark-circle" size={32} color="#10b981" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>Recycled {item.materialType || "item"}</Text>
        <Text style={styles.activityBarcode}>Barcode: {item.barcode}</Text>
        <Text style={styles.activityTime}>{getTimeAgo(item.createdAt)}</Text>
        {item.co2Saved > 0 && <Text style={styles.activityCo2}>{item.co2Saved} kg CO₂ saved</Text>}
      </View>
      <View style={styles.activityPoints}>
        <Text style={styles.pointsValue}>+{item.pointsAwarded}</Text>
        <Text style={styles.pointsLabel}>points</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Activity History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No activities yet</Text>
          <Text style={styles.emptySubtext}>Start scanning to see your recycling history</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 20,
  },
  activityItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  activityBarcode: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  activityCo2: {
    fontSize: 12,
    color: "#10b981",
  },
  activityPoints: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
  },
  pointsLabel: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
})
