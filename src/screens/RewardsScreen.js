"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import FirebaseService from "../services/FirebaseService"

export default function RewardsScreen({ navigation }) {
  const { user } = useAuth()
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { id: "all", name: "All", icon: "grid-outline" },
    { id: "food", name: "Food", icon: "fast-food-outline" },
    { id: "merchandise", name: "Merch", icon: "shirt-outline" },
    { id: "academic", name: "Academic", icon: "book-outline" },
    { id: "digital", name: "Digital", icon: "phone-portrait-outline" },
  ]

  useEffect(() => {
    loadRewards()
  }, [])

  const loadRewards = async () => {
    const result = await FirebaseService.getRewards()
    if (result.success) {
      setRewards(result.data)
    }
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRewards()
    setRefreshing(false)
  }

  const filteredRewards =
    selectedCategory === "all"
      ? rewards
      : rewards.filter((r) => r.category?.toLowerCase().includes(selectedCategory.toLowerCase()))

  const canAfford = (pointsCost) => {
    return (user?.pointsBalance || 0) >= pointsCost
  }

  const renderReward = ({ item }) => (
    <TouchableOpacity style={styles.rewardCard} onPress={() => navigation.navigate("RewardDetail", { reward: item })}>
      <View style={styles.rewardImage}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="gift" size={48} color="#10b981" />
          </View>
        )}
      </View>

      <View style={styles.rewardContent}>
        <Text style={styles.rewardName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.rewardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.rewardFooter}>
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.pointsCost}>{item.pointsCost} pts</Text>
          </View>

          {item.availableInventory !== null && item.availableInventory !== undefined && (
            <Text style={styles.inventory}>{item.availableInventory} left</Text>
          )}
        </View>

        {!canAfford(item.pointsCost) && (
          <View style={styles.insufficientBadge}>
            <Text style={styles.insufficientText}>Need {item.pointsCost - (user?.pointsBalance || 0)} more</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <View style={styles.pointsDisplay}>
          <Ionicons name="star" size={20} color="#f59e0b" />
          <Text style={styles.pointsText}>{user?.pointsBalance || 0}</Text>
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={selectedCategory === item.id ? "#fff" : "#666"}
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : filteredRewards.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="gift-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No rewards available</Text>
          <Text style={styles.emptySubtext}>Check back later for new rewards</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRewards}
          renderItem={renderReward}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#10b981"]} />}
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  pointsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400e",
    marginLeft: 6,
  },
  categoriesContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#10b981",
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  categoryTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 12,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
  },
  rewardContent: {
    padding: 12,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  rewardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsCost: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 4,
  },
  inventory: {
    fontSize: 12,
    color: "#999",
  },
  insufficientBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  insufficientText: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "500",
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
  },
})
