"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import FirebaseService from "../services/FirebaseService"

export default function LeaderboardScreen() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userRank, setUserRank] = useState(null)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    const result = await FirebaseService.getLeaderboard(100)
    if (result.success) {
      setLeaderboard(result.data)

      // Find user's rank
      const rank = result.data.findIndex((item) => item.id === user?.id)
      if (rank !== -1) {
        setUserRank(rank + 1)
      }
    }
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadLeaderboard()
    setRefreshing(false)
  }

  const getMedalColor = (rank) => {
    if (rank === 1) return "#FFD700" // Gold
    if (rank === 2) return "#C0C0C0" // Silver
    if (rank === 3) return "#CD7F32" // Bronze
    return "#10b981"
  }

  const getMedalIcon = (rank) => {
    if (rank <= 3) return "trophy"
    return "medal-outline"
  }

  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1
    const isCurrentUser = item.id === user?.id

    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          {rank <= 3 ? (
            <Ionicons name={getMedalIcon(rank)} size={32} color={getMedalColor(rank)} />
          ) : (
            <Text style={styles.rankNumber}>{rank}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserText]} numberOfLines={1}>
            {item.name}
            {isCurrentUser && " (You)"}
          </Text>
          {item.university && <Text style={styles.university}>{item.university}</Text>}
        </View>

        <View style={styles.pointsContainer}>
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={[styles.points, isCurrentUser && styles.currentUserText]}>{item.points}</Text>
        </View>
      </View>
    )
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient colors={["#10b981", "#059669"]} style={styles.topSection}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Top recyclers this month</Text>

        {userRank && (
          <View style={styles.userRankCard}>
            <View style={styles.userRankContent}>
              <Text style={styles.userRankLabel}>Your Rank</Text>
              <Text style={styles.userRankValue}>#{userRank}</Text>
            </View>
            <View style={styles.userRankContent}>
              <Text style={styles.userRankLabel}>Your Points</Text>
              <Text style={styles.userRankValue}>{user?.totalPointsEarned || 0}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {leaderboard.length > 0 && (
        <View style={styles.topThree}>
          {leaderboard.slice(0, 3).map((item, index) => (
            <View key={item.id} style={[styles.podiumItem, index === 0 && styles.firstPlace]}>
              <View style={[styles.podiumRank, { backgroundColor: getMedalColor(index + 1) }]}>
                <Ionicons name="trophy" size={24} color="#fff" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.podiumPoints}>{item.points} pts</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.listTitle}>All Rankings</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No leaderboard data yet</Text>
          <Text style={styles.emptySubtext}>Start recycling to see rankings</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    marginBottom: 16,
  },
  topSection: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 20,
  },
  userRankCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-around",
  },
  userRankContent: {
    alignItems: "center",
  },
  userRankLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 4,
  },
  userRankValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  topThree: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#fff",
  },
  podiumItem: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  firstPlace: {
    marginTop: -20,
  },
  podiumRank: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  podiumPoints: {
    fontSize: 12,
    color: "#666",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  currentUserItem: {
    backgroundColor: "#f0fdf4",
  },
  rankContainer: {
    width: 50,
    alignItems: "center",
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  currentUserText: {
    color: "#10b981",
  },
  university: {
    fontSize: 12,
    color: "#999",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  points: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 4,
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
