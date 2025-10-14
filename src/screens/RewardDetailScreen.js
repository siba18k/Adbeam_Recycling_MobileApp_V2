"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import FirebaseService from "../services/FirebaseService"

export default function RewardDetailScreen({ route, navigation }) {
  const { reward } = route.params
  const { user, updateUserData } = useAuth()
  const [redeeming, setRedeeming] = useState(false)

  const canAfford = (user?.pointsBalance || 0) >= reward.pointsCost

  const handleRedeem = async () => {
    if (!canAfford) {
      Alert.alert("Insufficient Points", `You need ${reward.pointsCost - (user?.pointsBalance || 0)} more points.`)
      return
    }

    if (reward.availableInventory !== null && reward.availableInventory <= 0) {
      Alert.alert("Out of Stock", "This reward is currently out of stock.")
      return
    }

    Alert.alert("Confirm Redemption", `Redeem ${reward.name} for ${reward.pointsCost} points?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Redeem",
        onPress: async () => {
          setRedeeming(true)
          const result = await FirebaseService.redeemReward(user.id, reward.id, reward.pointsCost)
          setRedeeming(false)

          if (result.success) {
            // Update local user points
            await updateUserData({
              pointsBalance: (user.pointsBalance || 0) - reward.pointsCost,
            })

            Alert.alert("Success!", "Reward redeemed successfully! Check your email for redemption details.", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ])
          } else {
            Alert.alert("Error", result.error || "Failed to redeem reward. Please try again.")
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          {reward.imageUrl ? (
            <Image source={{ uri: reward.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="gift" size={80} color="#10b981" />
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>{reward.name}</Text>
              {reward.category && <Text style={styles.category}>{reward.category}</Text>}
            </View>
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.pointsCost}>{reward.pointsCost}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{reward.description || "No description available."}</Text>
          </View>

          {reward.availableInventory !== null && reward.availableInventory !== undefined && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.inventoryContainer}>
                <Ionicons
                  name={reward.availableInventory > 0 ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={reward.availableInventory > 0 ? "#10b981" : "#ef4444"}
                />
                <Text style={styles.inventoryText}>
                  {reward.availableInventory > 0 ? `${reward.availableInventory} items available` : "Out of stock"}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Points</Text>
            <View style={styles.pointsInfo}>
              <Text style={styles.currentPoints}>Current: {user?.pointsBalance || 0} points</Text>
              {!canAfford && (
                <Text style={styles.needMore}>Need {reward.pointsCost - (user?.pointsBalance || 0)} more points</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Redeem</Text>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.instructionText}>Tap the redeem button below</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.instructionText}>Check your email for redemption code</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.instructionText}>Present code at participating locations</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.redeemButton, (!canAfford || redeeming) && styles.redeemButtonDisabled]}
          onPress={handleRedeem}
          disabled={!canAfford || redeeming}
        >
          {redeeming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="gift" size={24} color="#fff" />
              <Text style={styles.redeemButtonText}>Redeem for {reward.pointsCost} points</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageContainer: {
    width: "100%",
    height: 300,
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
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "500",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsCost: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#92400e",
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  inventoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inventoryText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  pointsInfo: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
  },
  currentPoints: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  needMore: {
    fontSize: 14,
    color: "#ef4444",
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  redeemButton: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  redeemButtonDisabled: {
    backgroundColor: "#ccc",
  },
  redeemButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
})
