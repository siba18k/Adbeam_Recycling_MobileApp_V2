import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    SafeAreaView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    TextInput,
    FlatList,
    Modal,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// 🌟 MOCK DATA for Community Features
const COMMUNITY_POSTS = [
    {
        id: '1',
        user: { name: 'Sarah Chen', avatar: '👩🏻‍💼', dormitory: 'East Campus', level: 5 },
        type: 'achievement',
        content: 'Just hit my 100-item milestone! 🎉 Who\'s joining me for the sustainability challenge?',
        timestamp: '2 hours ago',
        likes: 24,
        comments: 8,
        environmental_impact: { co2_saved: 12.5, items: 100 },
        achievement: 'Eco Champion',
        isLiked: false,
    },
    {
        id: '2',
        user: { name: 'Marcus Johnson', avatar: '👨🏿‍🎓', dormitory: 'West Campus', level: 3 },
        type: 'challenge',
        content: 'Started a dorm challenge! East vs West Campus - who can recycle more this week?',
        timestamp: '4 hours ago',
        likes: 18,
        comments: 12,
        challenge: { name: 'Campus Battle', participants: 45, timeLeft: '3 days' },
        isLiked: true,
    },
    {
        id: '3',
        user: { name: 'Engineering Club', avatar: '⚙️', dormitory: 'Campus Club', level: 8 },
        type: 'event',
        content: 'Recycling workshop tomorrow! Learn about proper sorting and earn bonus points 🔧',
        timestamp: '6 hours ago',
        likes: 31,
        comments: 5,
        event: { name: 'Recycling Workshop', date: 'Nov 6', location: 'Engineering Building', bonus_points: 50 },
        isLiked: false,
    }
];

const LEADERBOARDS = {
    friends: [
        { rank: 1, name: 'Alex Thompson', points: 2450, avatar: '👨🏼‍💻', isYou: false, dormitory: 'North Campus' },
        { rank: 2, name: 'You', points: 1250, avatar: '🌱', isYou: true, dormitory: 'East Campus' },
        { rank: 3, name: 'Maria Garcia', points: 1180, avatar: '👩🏽‍🔬', isYou: false, dormitory: 'South Campus' },
        { rank: 4, name: 'David Kim', points: 950, avatar: '👨🏻‍🎨', isYou: false, dormitory: 'West Campus' },
        { rank: 5, name: 'Emma Wilson', points: 820, avatar: '👩🏻‍💼', isYou: false, dormitory: 'East Campus' },
    ],
    dormitories: [
        { rank: 1, name: 'North Campus', points: 15420, members: 234, avatar: '🏢', change: '+5%' },
        { rank: 2, name: 'East Campus', points: 14880, members: 198, avatar: '🏠', change: '+12%' },
        { rank: 3, name: 'South Campus', points: 13650, members: 203, avatar: '🏘️', change: '-2%' },
        { rank: 4, name: 'West Campus', points: 12200, members: 187, avatar: '🏡', change: '+8%' },
    ],
    clubs: [
        { rank: 1, name: 'Engineering Club', points: 8950, members: 45, avatar: '⚙️', change: '+18%' },
        { rank: 2, name: 'Environmental Society', points: 7820, members: 38, avatar: '🌿', change: '+25%' },
        { rank: 3, name: 'Computer Science', points: 6540, members: 52, avatar: '💻', change: '+7%' },
    ]
};

const ACTIVE_CHALLENGES = [
    {
        id: '1',
        name: 'Campus Sustainability Week',
        description: 'Join the entire campus in recycling 10,000 items this week!',
        progress: 0.73,
        current: 7300,
        target: 10000,
        timeLeft: '2 days',
        participants: 892,
        reward: '🎁 Campus-wide pizza party + 100 bonus points',
        type: 'campus',
        difficulty: 'Medium',
    },
    {
        id: '2',
        name: 'Dorm Battle Royale',
        description: 'Which dormitory can recycle the most? East vs West vs North vs South!',
        progress: 0.45,
        current: 45,
        target: 100,
        timeLeft: '5 days',
        participants: 156,
        reward: '🏆 Winning dorm gets sustainability grant',
        type: 'dormitory',
        difficulty: 'Hard',
    },
    {
        id: '3',
        name: 'Green Warriors Club',
        description: 'Small group challenge - perfect for close friends!',
        progress: 0.89,
        current: 89,
        target: 100,
        timeLeft: '1 day',
        participants: 12,
        reward: '⭐ Exclusive eco-warrior badges',
        type: 'friends',
        difficulty: 'Easy',
    }
];

export default function CommunityScreen({ navigation }) {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('feed'); // feed, leaderboard, challenges
    const [selectedLeaderboard, setSelectedLeaderboard] = useState('friends');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [likedPosts, setLikedPosts] = useState(new Set());

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(40)).current;
    const tabSlideAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        startAnimations();
    }, []);

    useEffect(() => {
        // Tab switching animation
        Animated.spring(tabSlideAnim, {
            toValue: activeTab === 'feed' ? 0 : activeTab === 'leaderboard' ? 1 : 2,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
        }).start();
    }, [activeTab]);

    const startAnimations = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideUpAnim, {
                toValue: 0,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    };

    const handleLike = (postId) => {
        setLikedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    const handleCreatePost = () => {
        if (newPostText.trim()) {
            Alert.alert('Post Created!', 'Your sustainability update has been shared with the community.');
            setNewPostText('');
            setShowCreatePost(false);
        }
    };

    const renderCommunityPost = ({ item }) => (
        <Animated.View style={[
            styles.postCard,
            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
        ]}>
            <LinearGradient
                colors={['#ffffff', '#fefefe']}
                style={styles.postGradient}
            >
                {/* Post Header */}
                <View style={styles.postHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarEmoji}>{item.user.avatar}</Text>
                            <View style={[styles.levelBadgeSmall, {
                                backgroundColor: item.user.level >= 5 ? '#f59e0b' : '#3b82f6'
                            }]}>
                                <Text style={styles.levelBadgeText}>{item.user.level}</Text>
                            </View>
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{item.user.name}</Text>
                            <View style={styles.userMeta}>
                                <Text style={styles.userDormitory}>{item.user.dormitory}</Text>
                                <Text style={styles.postTimestamp}> • {item.timestamp}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.postTypeIndicator}>
                        <Ionicons
                            name={
                                item.type === 'achievement' ? 'trophy' :
                                    item.type === 'challenge' ? 'people' : 'calendar'
                            }
                            size={16}
                            color="#f59e0b"
                        />
                    </View>
                </View>

                {/* Post Content */}
                <Text style={styles.postContent}>{item.content}</Text>

                {/* Achievement Badge */}
                {item.achievement && (
                    <View style={styles.achievementBadge}>
                        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.achievementBadgeGradient}>
                            <Ionicons name="trophy" size={16} color="white" />
                            <Text style={styles.achievementBadgeText}>{item.achievement} Unlocked!</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* Challenge Info */}
                {item.challenge && (
                    <View style={styles.challengeInfo}>
                        <View style={styles.challengeStats}>
                            <View style={styles.challengeStat}>
                                <Ionicons name="people" size={14} color="#3b82f6" />
                                <Text style={styles.challengeStatText}>{item.challenge.participants} joined</Text>
                            </View>
                            <View style={styles.challengeStat}>
                                <Ionicons name="time" size={14} color="#f59e0b" />
                                <Text style={styles.challengeStatText}>{item.challenge.timeLeft} left</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.joinChallengeButton} activeOpacity={0.8}>
                            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.joinChallengeGradient}>
                                <Text style={styles.joinChallengeText}>Join Challenge</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Event Info */}
                {item.event && (
                    <View style={styles.eventInfo}>
                        <LinearGradient colors={['#10b981', '#059669']} style={styles.eventInfoGradient}>
                            <View style={styles.eventDetails}>
                                <Text style={styles.eventName}>{item.event.name}</Text>
                                <Text style={styles.eventMeta}>
                                    📅 {item.event.date} • 📍 {item.event.location}
                                </Text>
                                <Text style={styles.eventBonus}>+{item.event.bonus_points} bonus points</Text>
                            </View>
                            <TouchableOpacity style={styles.rsvpButton} activeOpacity={0.8}>
                                <Text style={styles.rsvpText}>RSVP</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}

                {/* Environmental Impact */}
                {item.environmental_impact && (
                    <View style={styles.impactBanner}>
                        <View style={styles.impactStats}>
                            <View style={styles.impactStat}>
                                <Ionicons name="leaf" size={14} color="#059669" />
                                <Text style={styles.impactStatText}>{item.environmental_impact.co2_saved}kg CO₂</Text>
                            </View>
                            <View style={styles.impactStat}>
                                <Ionicons name="recycle" size={14} color="#3b82f6" />
                                <Text style={styles.impactStatText}>{item.environmental_impact.items} items</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Post Actions */}
                <View style={styles.postActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: likedPosts.has(item.id) ? '#fef3c7' : '#f9fafb' }]}
                        onPress={() => handleLike(item.id)}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
                            size={18}
                            color={likedPosts.has(item.id) ? "#f59e0b" : "#6b7280"}
                        />
                        <Text style={[styles.actionText, {
                            color: likedPosts.has(item.id) ? "#f59e0b" : "#6b7280"
                        }]}>
                            {item.likes + (likedPosts.has(item.id) ? 1 : 0)}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                        <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
                        <Text style={styles.actionText}>{item.comments}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                        <Ionicons name="share-outline" size={18} color="#6b7280" />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                        <Ionicons name="bookmark-outline" size={18} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Animated.View>
    );

    const renderLeaderboardItem = ({ item, index }) => {
        const isTopThree = item.rank <= 3;
        const isYou = item.isYou;

        return (
            <Animated.View style={[
                styles.leaderboardItem,
                isYou && styles.yourRankItem,
                {
                    opacity: fadeAnim,
                    transform: [{
                        translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                        })
                    }]
                }
            ]}>
                <LinearGradient
                    colors={isYou ? ['#fef3c7', '#fde68a'] : ['#ffffff', '#fefefe']}
                    style={styles.leaderboardItemGradient}
                >
                    <View style={styles.rankContainer}>
                        <View style={[
                            styles.rankBadge,
                            { backgroundColor: isTopThree ? '#f59e0b' : '#e5e7eb' }
                        ]}>
                            <Text style={[
                                styles.rankText,
                                { color: isTopThree ? 'white' : '#6b7280' }
                            ]}>
                                {item.rank}
                            </Text>
                        </View>

                        {isTopThree && (
                            <View style={styles.trophyContainer}>
                                <Ionicons
                                    name="trophy"
                                    size={12}
                                    color={item.rank === 1 ? '#fbbf24' : item.rank === 2 ? '#9ca3af' : '#cd7c2f'}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.playerInfo}>
                        <Text style={styles.playerAvatar}>{item.avatar}</Text>
                        <View style={styles.playerDetails}>
                            <Text style={[styles.playerName, isYou && styles.yourName]}>
                                {item.name}
                            </Text>
                            <Text style={styles.playerDormitory}>
                                {selectedLeaderboard === 'friends' ? item.dormitory :
                                    selectedLeaderboard === 'dormitories' ? `${item.members} members` :
                                        `${item.members} members`}
                            </Text>
                        </View>
                    </View>

                    {isYou && (
                        <View style={styles.youIndicator}>
                            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.youIndicatorGradient}>
                                <Text style={styles.youIndicatorText}>YOU</Text>
                            </LinearGradient>
                        </View>
                    )}
                </LinearGradient>
            </Animated.View>
        );
    };

    const renderChallenge = ({ item }) => (
        <Animated.View style={[
            styles.challengeCard,
            { opacity: fadeAnim, transform: [{ scale: pulseAnim }] }
        ]}>
            <LinearGradient
                colors={
                    item.type === 'campus' ? ['#3b82f6', '#2563eb'] :
                        item.type === 'dormitory' ? ['#8b5cf6', '#7c3aed'] :
                            ['#10b981', '#059669']
                }
                style={styles.challengeGradient}
            >
                <View style={styles.challengeHeader}>
                    <View style={styles.challengeTitleSection}>
                        <Text style={styles.challengeName}>{item.name}</Text>
                        <View style={styles.difficultyBadge}>
                            <Text style={styles.difficultyText}>{item.difficulty}</Text>
                        </View>
                    </View>
                    <Text style={styles.challengeTimeLeft}>{item.timeLeft}</Text>
                </View>

                <Text style={styles.challengeDescription}>{item.description}</Text>

                {/* Progress Bar */}
                <View style={styles.challengeProgress}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressText}>
                            {item.current.toLocaleString()} / {item.target.toLocaleString()}
                        </Text>
                        <Text style={styles.progressPercentage}>
                            {Math.round(item.progress * 100)}%
                        </Text>
                    </View>

                    <View style={styles.progressTrack}>
                        <Animated.View style={[
                            styles.progressBar,
                            {
                                width: `${item.progress * 100}%`,
                                backgroundColor: 'rgba(255,255,255,0.9)',
                            }
                        ]} />
                    </View>
                </View>

                {/* Challenge Stats */}
                <View style={styles.challengeStats}>
                    <View style={styles.challengeStat}>
                        <Ionicons name="people" size={14} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.challengeStatText}>{item.participants} participants</Text>
                    </View>
                </View>

                {/* Reward */}
                <View style={styles.challengeReward}>
                    <Text style={styles.rewardText}>{item.reward}</Text>
                </View>

                {/* Join Button */}
                <TouchableOpacity
                    style={styles.joinButton}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Joined!', `You've joined the ${item.name} challenge!`)}
                >
                    <Text style={styles.joinButtonText}>Join Challenge 🚀</Text>
                </TouchableOpacity>
            </LinearGradient>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#ecfdf5', '#d1fae5', '#ffffff']} style={styles.gradient}>

                {/* Header */}
                <Animated.View style={[
                    styles.header,
                    { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
                ]}>
                    <LinearGradient colors={['#059669', '#047857']} style={styles.headerGradient}>
                        <View style={styles.headerTop}>
                            <Text style={styles.headerTitle}>🌍 Community</Text>
                            <TouchableOpacity
                                style={styles.createPostButton}
                                onPress={() => setShowCreatePost(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={styles.createPostText}>Share</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            Join {COMMUNITY_POSTS.length + 45} active eco-warriors on campus!
                        </Text>
                    </LinearGradient>
                </Animated.View>

                {/* Tab Navigation */}
                <Animated.View style={[
                    styles.tabContainer,
                    { opacity: fadeAnim }
                ]}>
                    {[
                        { key: 'feed', label: 'Community Feed', icon: 'home' },
                        { key: 'leaderboard', label: 'Leaderboards', icon: 'trophy' },
                        { key: 'challenges', label: 'Challenges', icon: 'people' }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tab,
                                activeTab === tab.key && styles.activeTab
                            ]}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={18}
                                color={activeTab === tab.key ? '#059669' : '#6b7280'}
                            />
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === tab.key ? '#059669' : '#6b7280' }
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Content Area */}
                {activeTab === 'feed' && (
                    <FlatList
                        data={COMMUNITY_POSTS}
                        renderItem={renderCommunityPost}
                        keyExtractor={(item) => item.id}
                        style={styles.contentArea}
                        contentContainerStyle={styles.feedContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={() => {
                                    setIsRefreshing(true);
                                    setTimeout(() => setIsRefreshing(false), 1000);
                                }}
                                colors={['#059669']}
                                tintColor="#059669"
                            />
                        }
                    />
                )}

                {activeTab === 'leaderboard' && (
                    <View style={styles.contentArea}>
                        {/* Leaderboard Tabs */}
                        <View style={styles.leaderboardTabs}>
                            {[
                                { key: 'friends', label: 'Friends', icon: 'people' },
                                { key: 'dormitories', label: 'Dorms', icon: 'home' },
                                { key: 'clubs', label: 'Clubs', icon: 'school' }
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[
                                        styles.leaderboardTab,
                                        selectedLeaderboard === tab.key && styles.activeLeaderboardTab
                                    ]}
                                    onPress={() => setSelectedLeaderboard(tab.key)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={tab.icon}
                                        size={16}
                                        color={selectedLeaderboard === tab.key ? 'white' : '#6b7280'}
                                    />
                                    <Text style={[
                                        styles.leaderboardTabText,
                                        { color: selectedLeaderboard === tab.key ? 'white' : '#6b7280' }
                                    ]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <FlatList
                            data={LEADERBOARDS[selectedLeaderboard]}
                            renderItem={renderLeaderboardItem}
                            keyExtractor={(item, index) => `${selectedLeaderboard}-${index}`}
                            style={styles.leaderboardList}
                            contentContainerStyle={styles.leaderboardContent}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}

                {activeTab === 'challenges' && (
                    <FlatList
                        data={ACTIVE_CHALLENGES}
                        renderItem={renderChallenge}
                        keyExtractor={(item) => item.id}
                        style={styles.contentArea}
                        contentContainerStyle={styles.challengesContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Create Post Modal */}
                <Modal
                    visible={showCreatePost}
                    animationType="slide"
                    presentationStyle="pageSheet"
                >
                    <SafeAreaView style={styles.modalContainer}>
                        <LinearGradient colors={['#ecfdf5', '#ffffff']} style={styles.modalGradient}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    onPress={() => setShowCreatePost(false)}
                                    style={styles.modalCloseButton}
                                >
                                    <Ionicons name="close" size={24} color="#6b7280" />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Share Your Progress</Text>
                                <TouchableOpacity
                                    onPress={handleCreatePost}
                                    style={styles.modalPostButton}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalPostText}>Post</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalContent}>
                                <TextInput
                                    style={styles.postInput}
                                    placeholder="Share your recycling achievement, start a challenge, or inspire others..."
                                    placeholderTextColor="#9ca3af"
                                    value={newPostText}
                                    onChangeText={setNewPostText}
                                    multiline
                                    maxLength={280}
                                    textAlignVertical="top"
                                />

                                <Text style={styles.characterCount}>
                                    {newPostText.length}/280 characters
                                </Text>

                                {/* Quick Action Buttons */}
                                <View style={styles.quickPostActions}>
                                    <TouchableOpacity style={styles.quickPostButton} activeOpacity={0.8}>
                                        <Ionicons name="camera" size={18} color="#3b82f6" />
                                        <Text style={styles.quickPostButtonText}>Photo</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.quickPostButton} activeOpacity={0.8}>
                                        <Ionicons name="trophy" size={18} color="#f59e0b" />
                                        <Text style={styles.quickPostButtonText}>Achievement</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.quickPostButton} activeOpacity={0.8}>
                                        <Ionicons name="people" size={18} color="#8b5cf6" />
                                        <Text style={styles.quickPostButtonText}>Challenge</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </LinearGradient>
                    </SafeAreaView>
                </Modal>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },

    header: {
        borderRadius: 20,
        margin: 16,
        marginBottom: 8,
        overflow: 'hidden',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    headerGradient: { padding: 20 },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    createPostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    createPostText: { color: 'white', fontSize: 14, fontWeight: '600' },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    activeTab: {
        backgroundColor: '#ecfdf5',
    },
    tabText: { fontSize: 12, fontWeight: '600' },

    contentArea: { flex: 1 },

    // Community Feed
    feedContent: {
        padding: 16,
        paddingBottom: 100,
    },
    postCard: {
        marginBottom: 16,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    postGradient: { padding: 16 },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarContainer: { position: 'relative', marginRight: 12 },
    avatarEmoji: { fontSize: 32 },
    levelBadgeSmall: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelBadgeText: { fontSize: 9, fontWeight: '800', color: 'white' },
    userDetails: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    userMeta: { flexDirection: 'row', alignItems: 'center' },
    userDormitory: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    postTimestamp: { fontSize: 12, color: '#9ca3af' },
    postTypeIndicator: {
        backgroundColor: '#fef3c7',
        padding: 8,
        borderRadius: 12,
    },

    postContent: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
        fontWeight: '500',
    },

    achievementBadge: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    achievementBadgeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
    },
    achievementBadgeText: { color: 'white', fontSize: 13, fontWeight: '700' },

    challengeInfo: {
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    challengeStats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
    challengeStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    challengeStatText: { fontSize: 12, color: '#374151', fontWeight: '600' },
    joinChallengeButton: { borderRadius: 8, overflow: 'hidden' },
    joinChallengeGradient: { paddingVertical: 8, alignItems: 'center' },
    joinChallengeText: { color: 'white', fontSize: 13, fontWeight: '700' },

    eventInfo: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    eventInfoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    eventDetails: { flex: 1 },
    eventName: { color: 'white', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    eventMeta: { color: 'rgba(255,255,255,0.9)', fontSize: 11, marginBottom: 2 },
    eventBonus: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
    rsvpButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    rsvpText: { color: 'white', fontSize: 12, fontWeight: '700' },

    impactBanner: {
        backgroundColor: '#f0fdf4',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#059669',
    },
    impactStats: { flexDirection: 'row', gap: 16 },
    impactStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    impactStatText: { fontSize: 12, color: '#059669', fontWeight: '600' },

    postActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
    },
    actionText: { fontSize: 12, fontWeight: '600' },

    // Leaderboard
    leaderboardTabs: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    leaderboardTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    activeLeaderboardTab: {
        backgroundColor: '#059669',
    },
    leaderboardTabText: { fontSize: 11, fontWeight: '600' },

    leaderboardList: { flex: 1 },
    leaderboardContent: {
        padding: 16,
        paddingBottom: 100,
    },
    leaderboardItem: {
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    yourRankItem: {
        shadowColor: '#f59e0b',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    leaderboardItemGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    rankContainer: { position: 'relative', alignItems: 'center' },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: { fontSize: 14, fontWeight: '800' },
    trophyContainer: {
        position: 'absolute',
        top: -8,
        right: -8,
    },
    playerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    playerAvatar: { fontSize: 24 },
    playerDetails: { flex: 1 },
    playerName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
    yourName: { color: '#f59e0b' },
    playerDormitory: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    pointsContainer: { alignItems: 'flex-end' },
    playerPoints: { fontSize: 16, fontWeight: '800', color: '#374151' },
    yourPoints: { color: '#f59e0b' },
    changeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    changeText: { fontSize: 10, fontWeight: '600' },
    youIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    youIndicatorGradient: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    youIndicatorText: { color: 'white', fontSize: 9, fontWeight: '800' },

    // Challenges
    challengesContent: {
        padding: 16,
        paddingBottom: 100,
    },
    challengeCard: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    challengeGradient: { padding: 20 },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    challengeTitleSection: { flex: 1, marginRight: 12 },
    challengeName: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
        marginBottom: 4,
    },
    difficultyBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    difficultyText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    challengeTimeLeft: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    challengeDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 18,
        marginBottom: 16,
    },
    challengeProgress: { marginBottom: 12 },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressText: { color: 'white', fontSize: 14, fontWeight: '700' },
    progressPercentage: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
    progressTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: { height: 6, borderRadius: 3 },
    challengeReward: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    rewardText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    joinButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    joinButtonText: { color: 'white', fontSize: 14, fontWeight: '700' },

    // Modal
    modalContainer: { flex: 1 },
    modalGradient: { flex: 1 },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalCloseButton: { padding: 4 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
    modalPostButton: {
        backgroundColor: '#059669',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    modalPostText: { color: 'white', fontSize: 14, fontWeight: '700' },
    modalContent: { flex: 1, padding: 20 },
    postInput: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 22,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    characterCount: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'right',
        marginBottom: 20,
    },
    quickPostActions: {
        flexDirection: 'row',
        gap: 12,
    },
    quickPostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickPostButtonText: { fontSize: 12, color: '#374151', fontWeight: '600' },
});
