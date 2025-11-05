// Enterprise-Grade Social Community Platform - SYNTAX CORRECTED
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, StyleSheet, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity,
    Animated, Dimensions, Alert, TextInput, FlatList, Modal, Share, Image
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// 🌟 MOCK DATA for Community Features
const MOCK_COMMUNITY_STATS = {
    activeUsers: 892,
    liveChallenges: 3,
    todayAchievements: 45,
    todayRecycled: 284
};

const MOCK_COMMUNITY_POSTS = [
    {
        id: '1',
        user: {
            name: 'Sarah Chen',
            avatar: '👩🏻‍💼',
            dormitory: 'East Campus',
            level: 5,
            reputationPoints: 750,
            isVerified: true
        },
        type: 'achievement',
        content: 'Just hit my 100-item milestone! 🎉 This recycling journey has been incredible - every bottle counts toward our campus sustainability goals!',
        timestamp: '2 hours ago',
        likes: 24,
        comments: 8,
        achievement: {
            name: 'Eco Champion',
            description: 'Recycled 100 items with dedication',
            points: 500,
            rarity: 'Epic'
        },
        environmental_impact: { co2_saved: 12.5, items: 100, water_saved: 230 },
        isLiked: false,
        image: null,
        recent_comments: [
            { author: 'Marcus J.', text: 'Incredible work! You inspire us all 🌱' },
            { author: 'Lisa K.', text: 'Way to go Sarah! Let\'s keep this momentum going!' }
        ]
    },
    {
        id: '2',
        user: {
            name: 'Marcus Johnson',
            avatar: '👨🏿‍🎓',
            dormitory: 'West Campus',
            level: 3,
            reputationPoints: 450,
            isVerified: false
        },
        type: 'challenge',
        content: 'Started a dorm challenge! East vs West Campus - who can recycle more this week? 💪',
        timestamp: '4 hours ago',
        likes: 18,
        comments: 12,
        challenge: {
            id: 'dorm_battle_1',
            name: 'Dorm Battle Royale',
            participants: 45,
            timeLeft: '3 days',
            description: 'Epic dormitory showdown!',
            reward: '🏆 Winning dorm gets sustainability fund'
        },
        isLiked: true,
        image: null,
        recent_comments: []
    },
    {
        id: '3',
        user: {
            name: 'Engineering Club',
            avatar: '⚙️',
            dormitory: 'Campus Organization',
            level: 8,
            reputationPoints: 1200,
            isVerified: true
        },
        type: 'event',
        content: 'Join us for tomorrow\'s recycling workshop! Learn proper sorting techniques and earn massive bonus points! 🔧♻️',
        timestamp: '6 hours ago',
        likes: 31,
        comments: 5,
        event: {
            name: 'Advanced Recycling Workshop',
            date: 'Nov 6',
            location: 'Engineering Building Room 205',
            bonus_points: 75
        },
        isLiked: false,
        image: null,
        recent_comments: [
            { author: 'Emma W.', text: 'Count me in! Love these workshops 🎓' }
        ]
    }
];

const MOCK_LEADERBOARDS = {
    friends: [
        { rank: 1, name: 'Alex Thompson', points: 2450, avatar: '👨🏼‍💻', isYou: false, dormitory: 'North Campus', change: '+15%', reputationLevel: 'Eco Champion' },
        { rank: 2, name: 'You', points: 1250, avatar: '🌱', isYou: true, dormitory: 'East Campus', change: '+12%', reputationLevel: 'Green Guardian' },
        { rank: 3, name: 'Maria Garcia', points: 1180, avatar: '👩🏽‍🔬', isYou: false, dormitory: 'South Campus', change: '+8%', reputationLevel: 'Green Guardian' },
        { rank: 4, name: 'David Kim', points: 950, avatar: '👨🏻‍🎨', isYou: false, dormitory: 'West Campus', change: '+5%', reputationLevel: 'Sustainability Scout' },
        { rank: 5, name: 'Emma Wilson', points: 820, avatar: '👩🏻‍💼', isYou: false, dormitory: 'East Campus', change: '+10%', reputationLevel: 'Sustainability Scout' },
    ],
    dormitory: [
        { rank: 1, name: 'North Campus', points: 15420, members: 234, avatar: '🏢', change: '+5%' },
        { rank: 2, name: 'East Campus', points: 14880, members: 198, avatar: '🏠', change: '+12%' },
        { rank: 3, name: 'South Campus', points: 13650, members: 203, avatar: '🏘️', change: '-2%' },
        { rank: 4, name: 'West Campus', points: 12200, members: 187, avatar: '🏡', change: '+8%' },
    ],
    campus: [
        { rank: 1, name: 'Sarah Chen', points: 3450, avatar: '👩🏻‍💼', isYou: false, dormitory: 'East Campus', change: '+25%' },
        { rank: 2, name: 'Alex Thompson', points: 2450, avatar: '👨🏼‍💻', isYou: false, dormitory: 'North Campus', change: '+15%' },
        { rank: 3, name: 'You', points: 1250, avatar: '🌱', isYou: true, dormitory: 'East Campus', change: '+12%' },
    ],
    clubs: [
        { rank: 1, name: 'Engineering Club', points: 8950, members: 45, avatar: '⚙️', change: '+18%' },
        { rank: 2, name: 'Environmental Society', points: 7820, members: 38, avatar: '🌿', change: '+25%' },
        { rank: 3, name: 'Computer Science Club', points: 6540, members: 52, avatar: '💻', change: '+7%' },
    ]
};

const MOCK_ACTIVE_CHALLENGES = [
    {
        id: '1',
        name: 'Campus Sustainability Week',
        description: 'Join the entire campus in recycling 10,000 items this week! Every scan counts toward our collective environmental impact.',
        progress: 0.73,
        current: 7300,
        target: 10000,
        timeLeft: '2 days',
        participants: 892,
        reward: '🍕 Campus-wide pizza party + 100 bonus points',
        type: 'campus',
        difficulty: 'Medium',
    },
    {
        id: '2',
        name: 'Dorm Battle Royale',
        description: 'Epic dormitory showdown! Which residence hall can recycle the most items?',
        progress: 0.45,
        current: 450,
        target: 1000,
        timeLeft: '5 days',
        participants: 156,
        reward: '🏆 Winning dorm gets $500 sustainability fund',
        type: 'dormitory',
        difficulty: 'Hard',
    },
    {
        id: '3',
        name: 'Green Warriors Circle',
        description: 'Small group challenge perfect for close friends - race to 100 items!',
        progress: 0.89,
        current: 89,
        target: 100,
        timeLeft: '1 day',
        participants: 12,
        reward: '⭐ Exclusive eco-warrior badges + VIP status',
        type: 'friends',
        difficulty: 'Easy',
    }
];

const REPUTATION_LEVELS = [
    { min: 0, max: 99, title: 'Eco Newcomer', color: '#6b7280' },
    { min: 100, max: 299, title: 'Green Guardian', color: '#059669' },
    { min: 300, max: 699, title: 'Sustainability Scout', color: '#3b82f6' },
    { min: 700, max: 1499, title: 'Environmental Expert', color: '#8b5cf6' },
    { min: 1500, max: 2999, title: 'Recycling Master', color: '#f59e0b' },
    { min: 3000, max: 9999, title: 'Eco Champion', color: '#ef4444' },
    { min: 10000, max: Infinity, title: 'Sustainability Legend', color: '#7c2d12' }
];

const getReputationLevel = (points) => {
    return REPUTATION_LEVELS.find(level =>
        points >= level.min && points <= level.max
    ) || REPUTATION_LEVELS[0];
};

export default function EnhancedCommunityScreen({ navigation }) {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('feed');
    const [selectedLeaderboard, setSelectedLeaderboard] = useState('friends');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [showCreateChallenge, setShowCreateChallenge] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [postImage, setPostImage] = useState(null);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [pendingFriendRequests, setPendingFriendRequests] = useState([]);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(40)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const floatingAnim = useRef(new Animated.Value(0)).current;
    const celebrationScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        startAnimations();
    }, []);

    const startAnimations = () => {
        Animated.stagger(200, [
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideUpAnim, {
                toValue: 0,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
            })
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatingAnim, { toValue: 10, duration: 3000, useNativeDriver: true }),
                Animated.timing(floatingAnim, { toValue: -10, duration: 3000, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate refresh delay
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleLike = useCallback((postId) => {
        setLikedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
                if (Haptics && Haptics.impactAsync) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            }
            return newSet;
        });
    }, []);

    const handleCreatePost = async () => {
        if (!newPostText.trim()) {
            Alert.alert('Empty Post', 'Please add some content to share with the community!');
            return;
        }

        Alert.alert('🎉 Post Created!', 'Your sustainability update has been shared with the community!');
        setNewPostText('');
        setPostImage(null);
        setShowCreatePost(false);
    };

    const selectPostImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setPostImage(result.assets[0]);
            }
        } catch (error) {
            console.log('Image picker error:', error);
        }
    };

    const shareToSocial = async (content) => {
        try {
            const shareContent = {
                message: `🌱 ${content}\n\nJoin me in making our campus sustainable! #AdbeamRecycling #EcoWarrior #CampusGreen`,
                title: 'My Recycling Achievement!'
            };
            await Share.share(shareContent);
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const joinChallenge = async (challengeId) => {
        try {
            if (Haptics && Haptics.notificationAsync) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('🎯 Challenge Joined!', 'Time to start recycling and climb the leaderboard!');
        } catch (error) {
            Alert.alert('Error', 'Failed to join challenge.');
        }
    };

    const endorseUser = async (targetUserId) => {
        try {
            if (Haptics && Haptics.impactAsync) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            Alert.alert('👏 Endorsement Sent!', 'You\'ve recognized their great recycling work!');
        } catch (error) {
            Alert.alert('Error', 'Failed to send endorsement.');
        }
    };

    // 🎭 ENHANCED POST RENDERING
    const renderEnhancedPost = ({ item }) => (
        <Animated.View style={[
            styles.enhancedPostCard,
            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
        ]}>
            <LinearGradient
                colors={['#ffffff', '#fefefe']}
                style={styles.postGradient}
            >
                {/* Enhanced Post Header */}
                <View style={styles.enhancedPostHeader}>
                    <View style={styles.authorSection}>
                        <View style={styles.avatarWithReputation}>
                            <Text style={styles.avatarEmoji}>{item.user.avatar}</Text>
                            <LinearGradient
                                colors={[getReputationLevel(item.user.reputationPoints || 0).color,
                                    getReputationLevel(item.user.reputationPoints || 0).color + 'dd']}
                                style={styles.reputationBadge}
                            >
                                <Text style={styles.levelText}>{item.user.level || 3}</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.authorInfo}>
                            <View style={styles.nameAndTitle}>
                                <Text style={styles.authorName}>{item.user.name}</Text>
                                <Text style={styles.reputationTitle}>
                                    {getReputationLevel(item.user.reputationPoints || 0).title}
                                </Text>
                            </View>
                            <View style={styles.postMeta}>
                                <Text style={styles.dormitoryTag}>{item.user.dormitory}</Text>
                                <Text style={styles.timestamp}> • {item.timestamp}</Text>
                                {item.user.isVerified && (
                                    <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginLeft: 4 }} />
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Post Type Badge */}
                    <View style={styles.postTypeSection}>
                        <View style={[styles.postTypeBadge, {
                            backgroundColor: item.type === 'achievement' ? '#fef3c7' :
                                item.type === 'challenge' ? '#dbeafe' : '#f0fdf4'
                        }]}>
                            <Ionicons
                                name={item.type === 'achievement' ? 'trophy' :
                                    item.type === 'challenge' ? 'people' : 'calendar'}
                                size={14}
                                color={item.type === 'achievement' ? '#f59e0b' :
                                    item.type === 'challenge' ? '#3b82f6' : '#059669'}
                            />
                        </View>

                        <TouchableOpacity style={styles.moreOptionsButton} activeOpacity={0.7}>
                            <Ionicons name="ellipsis-vertical" size={16} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Post Content */}
                <Text style={styles.postContent}>{item.content}</Text>

                {/* Post Image */}
                {item.image && (
                    <View style={styles.postImageContainer}>
                        <Image source={{ uri: item.image }} style={styles.postImage} />
                    </View>
                )}

                {/* Achievement Showcase */}
                {item.achievement && (
                    <Animated.View style={[
                        styles.achievementShowcase,
                        { transform: [{ scale: celebrationScale }] }
                    ]}>
                        <LinearGradient
                            colors={['#f59e0b', '#d97706']}
                            style={styles.achievementGradient}
                        >
                            <View style={styles.achievementHeader}>
                                <Ionicons name="trophy" size={20} color="white" />
                                <Text style={styles.achievementTitle}>Achievement Unlocked!</Text>
                            </View>
                            <Text style={styles.achievementName}>{item.achievement.name}</Text>
                            <Text style={styles.achievementDescription}>{item.achievement.description}</Text>

                            <View style={styles.achievementStats}>
                                <View style={styles.achievementStat}>
                                    <Ionicons name="star" size={12} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.achievementStatText}>+{item.achievement.points} pts</Text>
                                </View>
                                <View style={styles.achievementStat}>
                                    <Ionicons name="diamond" size={12} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.achievementStatText}>{item.achievement.rarity}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Challenge Invitation */}
                {item.challenge && (
                    <View style={styles.challengeInvitation}>
                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.challengeGradient}>
                            <View style={styles.challengeHeader}>
                                <Ionicons name="people" size={18} color="white" />
                                <Text style={styles.challengeTitle}>{item.challenge.name}</Text>
                                <Text style={styles.challengeTimeLeft}>{item.challenge.timeLeft}</Text>
                            </View>

                            <Text style={styles.challengeDescription}>{item.challenge.description}</Text>

                            <View style={styles.challengeStats}>
                                <View style={styles.challengeStatItem}>
                                    <Ionicons name="people" size={14} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.challengeStatText}>{item.challenge.participants} joined</Text>
                                </View>
                                <View style={styles.challengeStatItem}>
                                    <Ionicons name="trophy" size={14} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.challengeStatText}>Win: {item.challenge.reward}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.joinChallengeButton}
                                onPress={() => joinChallenge(item.challenge.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.joinChallengeText}>Join Challenge 🚀</Text>
                            </TouchableOpacity>
                        </LinearGradient>
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

                {/* Environmental Impact Display */}
                {item.environmental_impact && (
                    <View style={styles.impactDisplay}>
                        <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.impactGradient}>
                            <View style={styles.impactHeader}>
                                <Ionicons name="leaf" size={16} color="#059669" />
                                <Text style={styles.impactTitle}>Environmental Impact</Text>
                            </View>

                            <View style={styles.impactMetrics}>
                                <View style={styles.impactMetric}>
                                    <Ionicons name="leaf" size={12} color="#059669" />
                                    <Text style={styles.impactValue}>{item.environmental_impact.co2_saved}kg</Text>
                                    <Text style={styles.impactLabel}>CO₂ saved</Text>
                                </View>
                                <View style={styles.impactMetric}>
                                    <Ionicons name="recycle" size={12} color="#3b82f6" />
                                    <Text style={styles.impactValue}>{item.environmental_impact.items}</Text>
                                    <Text style={styles.impactLabel}>items</Text>
                                </View>
                                <View style={styles.impactMetric}>
                                    <Ionicons name="water" size={12} color="#06b6d4" />
                                    <Text style={styles.impactValue}>{item.environmental_impact.water_saved}L</Text>
                                    <Text style={styles.impactLabel}>water</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Enhanced Social Actions */}
                <View style={styles.enhancedSocialActions}>
                    <TouchableOpacity
                        style={[styles.socialActionButton, {
                            backgroundColor: likedPosts.has(item.id) ? '#fef3c7' : '#f9fafb',
                            borderColor: likedPosts.has(item.id) ? '#f59e0b' : '#e5e7eb'
                        }]}
                        onPress={() => handleLike(item.id)}
                        activeOpacity={0.8}
                    >
                        <Animated.View style={{ transform: [{ scale: likedPosts.has(item.id) ? 1.2 : 1 }] }}>
                            <Ionicons
                                name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
                                size={18}
                                color={likedPosts.has(item.id) ? "#f59e0b" : "#6b7280"}
                            />
                        </Animated.View>
                        <Text style={[styles.actionText, {
                            color: likedPosts.has(item.id) ? "#f59e0b" : "#6b7280"
                        }]}>
                            {item.likes + (likedPosts.has(item.id) ? 1 : 0)}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.socialActionButton} activeOpacity={0.8}>
                        <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
                        <Text style={styles.actionText}>{item.comments}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.socialActionButton}
                        onPress={() => shareToSocial(item.content)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="share-outline" size={18} color="#6b7280" />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.socialActionButton, styles.endorseButton]}
                        onPress={() => endorseUser(item.user.id || 'user1')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="thumbs-up-outline" size={18} color="#8b5cf6" />
                        <Text style={[styles.actionText, { color: '#8b5cf6' }]}>Endorse</Text>
                    </TouchableOpacity>
                </View>

                {/* Comments Preview */}
                {item.recent_comments && item.recent_comments.length > 0 && (
                    <View style={styles.commentsPreview}>
                        {item.recent_comments.slice(0, 2).map((comment, index) => (
                            <View key={index} style={styles.commentItem}>
                                <Text style={styles.commentAuthor}>{comment.author}:</Text>
                                <Text style={styles.commentText}>{comment.text}</Text>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.viewAllComments} activeOpacity={0.7}>
                            <Text style={styles.viewAllCommentsText}>View all {item.comments} comments</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    );

    // 🏆 Enhanced Leaderboard Item
    const renderEnhancedLeaderboardItem = ({ item, index }) => {
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
                                    selectedLeaderboard === 'dormitory' ? `${item.members} members` :
                                        selectedLeaderboard === 'clubs' ? `${item.members} members` :
                                            item.dormitory}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.pointsContainer}>
                        <Text style={[styles.playerPoints, isYou && styles.yourPoints]}>
                            {item.points.toLocaleString()}
                        </Text>
                        {item.change && (
                            <View style={styles.changeIndicator}>
                                <Ionicons
                                    name={item.change.startsWith('+') ? "trending-up" : "trending-down"}
                                    size={10}
                                    color={item.change.startsWith('+') ? "#10b981" : "#ef4444"}
                                />
                                <Text style={[styles.changeText, {
                                    color: item.change.startsWith('+') ? "#10b981" : "#ef4444"
                                }]}>
                                    {item.change}
                                </Text>
                            </View>
                        )}
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

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#ecfdf5', '#d1fae5', '#ffffff']} style={styles.gradient}>

                {/* Floating Community Indicators */}
                <Animated.View style={[
                    styles.floatingIndicator,
                    styles.floatingIndicator1,
                    { transform: [{ translateY: floatingAnim }] }
                ]} />
                <Animated.View style={[
                    styles.floatingIndicator,
                    styles.floatingIndicator2,
                    { transform: [{ translateY: floatingAnim.interpolate({
                                inputRange: [-10, 10],
                                outputRange: [10, -10]
                            }) }] }
                ]} />

                {/* Dynamic Header */}
                <Animated.View style={[
                    styles.dynamicHeader,
                    { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
                ]}>
                    <LinearGradient colors={['#059669', '#047857']} style={styles.headerGradient}>
                        <View style={styles.headerContent}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.headerTitle}>🌍 Community</Text>
                                <Text style={styles.headerSubtitle}>
                                    🔥 {MOCK_COMMUNITY_STATS.activeUsers} eco-warriors online
                                </Text>
                            </View>

                            <View style={styles.headerActions}>
                                <TouchableOpacity style={styles.notificationButton} activeOpacity={0.8}>
                                    <Ionicons name="people" size={20} color="white" />
                                    {pendingFriendRequests.length > 0 && (
                                        <View style={styles.notificationBadge}>
                                            <Text style={styles.notificationCount}>{pendingFriendRequests.length}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={() => setShowCreatePost(true)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add" size={20} color="white" />
                                    <Text style={styles.createButtonText}>Share</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.liveStats}>
                            <View style={styles.statItem}>
                                <Ionicons name="flash" size={12} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.statText}>{MOCK_COMMUNITY_STATS.liveChallenges} live</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="trophy" size={12} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.statText}>{MOCK_COMMUNITY_STATS.todayAchievements} today</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="leaf" size={12} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.statText}>{MOCK_COMMUNITY_STATS.todayRecycled} recycled</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Advanced Tab Navigation */}
                <Animated.View style={[
                    styles.advancedTabContainer,
                    { opacity: fadeAnim }
                ]}>
                    {[
                        { key: 'feed', label: 'Feed', icon: 'home', count: MOCK_COMMUNITY_POSTS.length },
                        { key: 'leaderboard', label: 'Rankings', icon: 'trophy', count: 5 },
                        { key: 'challenges', label: 'Challenges', icon: 'people', count: 3 },
                        { key: 'events', label: 'Events', icon: 'calendar', count: 2 }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.advancedTab,
                                activeTab === tab.key && styles.activeAdvancedTab
                            ]}
                            onPress={() => {
                                setActiveTab(tab.key);
                                if (Haptics && Haptics.selectionAsync) {
                                    Haptics.selectionAsync();
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={styles.tabContent}>
                                <Ionicons
                                    name={tab.icon}
                                    size={18}
                                    color={activeTab === tab.key ? '#059669' : '#6b7280'}
                                />
                                <Text style={[
                                    styles.advancedTabText,
                                    { color: activeTab === tab.key ? '#059669' : '#6b7280' }
                                ]}>
                                    {tab.label}
                                </Text>

                                {tab.count > 0 && (
                                    <View style={[
                                        styles.tabCounter,
                                        { backgroundColor: activeTab === tab.key ? '#059669' : '#9ca3af' }
                                    ]}>
                                        <Text style={styles.tabCountText}>{tab.count}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Content Areas */}
                {activeTab === 'feed' && (
                    <FlatList
                        data={MOCK_COMMUNITY_POSTS}
                        renderItem={renderEnhancedPost}
                        keyExtractor={(item) => item.id}
                        style={styles.feedContainer}
                        contentContainerStyle={styles.feedContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={['#059669']}
                                tintColor="#059669"
                            />
                        }
                    />
                )}

                {activeTab === 'leaderboard' && (
                    <View style={styles.leaderboardContainer}>
                        <View style={styles.leaderboardSelector}>
                            {[
                                { key: 'friends', label: 'Friends', icon: 'people' },
                                { key: 'dormitory', label: 'Dorms', icon: 'home' },
                                { key: 'campus', label: 'Campus', icon: 'school' },
                                { key: 'clubs', label: 'Clubs', icon: 'trophy' }
                            ].map((type) => (
                                <TouchableOpacity
                                    key={type.key}
                                    style={[
                                        styles.leaderboardType,
                                        selectedLeaderboard === type.key && styles.activeLeaderboardType
                                    ]}
                                    onPress={() => {
                                        setSelectedLeaderboard(type.key);
                                        if (Haptics && Haptics.selectionAsync) {
                                            Haptics.selectionAsync();
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={type.icon}
                                        size={16}
                                        color={selectedLeaderboard === type.key ? 'white' : '#6b7280'}
                                    />
                                    <Text style={[
                                        styles.leaderboardTypeLabel,
                                        { color: selectedLeaderboard === type.key ? 'white' : '#374151' }
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <FlatList
                            data={MOCK_LEADERBOARDS[selectedLeaderboard] || []}
                            renderItem={renderEnhancedLeaderboardItem}
                            keyExtractor={(item, index) => `${selectedLeaderboard}-${index}`}
                            style={styles.leaderboardList}
                            contentContainerStyle={styles.leaderboardContent}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}

                {activeTab === 'challenges' && (
                    <ScrollView style={styles.challengesContainer} contentContainerStyle={styles.challengesContent}>
                        <TouchableOpacity
                            style={styles.createChallengeButton}
                            onPress={() => setShowCreateChallenge(true)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.createChallengeGradient}>
                                <Ionicons name="add-circle" size={20} color="white" />
                                <Text style={styles.createChallengeText}>Create Challenge</Text>
                                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
                            </LinearGradient>
                        </TouchableOpacity>

                        {MOCK_ACTIVE_CHALLENGES.map((challenge) => (
                            <ChallengeCard key={challenge.id} challenge={challenge} onJoin={joinChallenge} />
                        ))}
                    </ScrollView>
                )}

                {activeTab === 'events' && (
                    <ScrollView style={styles.eventsContainer} contentContainerStyle={styles.eventsContent}>
                        <Text style={styles.comingSoonText}>🎉 Campus Events Coming Soon!</Text>
                    </ScrollView>
                )}

                {/* Create Post Modal */}
                <Modal
                    visible={showCreatePost}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setShowCreatePost(false)}
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

                                <View style={styles.quickPostActions}>
                                    <TouchableOpacity
                                        style={styles.quickPostButton}
                                        onPress={selectPostImage}
                                        activeOpacity={0.8}
                                    >
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

// 🃏 Challenge Card Component
const ChallengeCard = ({ challenge, onJoin }) => {
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return '#10b981';
            case 'Medium': return '#f59e0b';
            case 'Hard': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <View style={styles.challengeCard}>
            <LinearGradient
                colors={challenge.type === 'campus' ? ['#3b82f6', '#2563eb'] :
                    challenge.type === 'dormitory' ? ['#8b5cf6', '#7c3aed'] :
                        ['#10b981', '#059669']}
                style={styles.challengeCardGradient}
            >
                <View style={styles.challengeCardHeader}>
                    <View style={styles.challengeTitleSection}>
                        <Text style={styles.challengeName}>{challenge.name}</Text>
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
                            <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
                        </View>
                    </View>

                    <View style={styles.challengeTimer}>
                        <Ionicons name="time" size={14} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.timeLeftText}>{challenge.timeLeft}</Text>
                    </View>
                </View>

                <Text style={styles.challengeDescription}>{challenge.description}</Text>

                <View style={styles.challengeProgressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValues}>
                            {challenge.current.toLocaleString()} / {challenge.target.toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.progressTrack}>
                        <Animated.View
                            style={[styles.progressFill, { width: `${challenge.progress * 100}%` }]}
                        />
                    </View>

                    <Text style={styles.progressPercentage}>
                        {Math.round(challenge.progress * 100)}% complete
                    </Text>
                </View>

                <View style={styles.challengeFooter}>
                    <View style={styles.participantsSection}>
                        <Ionicons name="people" size={14} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.participantsText}>
                            {challenge.participants} participants
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.joinChallengeBtn}
                        onPress={() => onJoin(challenge.id)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.joinChallengeBtnText}>Join 🚀</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.rewardBanner}>
                    <Text style={styles.rewardText}>🏆 {challenge.reward}</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },

    // Floating elements
    floatingIndicator: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
    },
    floatingIndicator1: {
        width: 100,
        height: 100,
        backgroundColor: '#059669',
        top: '20%',
        right: -30,
    },
    floatingIndicator2: {
        width: 80,
        height: 80,
        backgroundColor: '#3b82f6',
        bottom: '30%',
        left: -20,
    },

    // Header
    dynamicHeader: {
        margin: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerGradient: { padding: 20 },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: { flex: 1 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    notificationButton: {
        position: 'relative',
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#ef4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationCount: { color: 'white', fontSize: 10, fontWeight: '700' },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    createButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
    liveStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },

    // Tabs
    advancedTabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    advancedTab: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    activeAdvancedTab: { backgroundColor: '#ecfdf5' },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        position: 'relative',
    },
    advancedTabText: { fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' },
    tabCounter: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabCountText: { color: 'white', fontSize: 9, fontWeight: '700' },

    // Feed
    feedContainer: { flex: 1 },
    feedContent: { paddingBottom: 100, paddingTop: 8 },

    // Posts
    enhancedPostCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    postGradient: { padding: 18 },
    enhancedPostHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    authorSection: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    avatarWithReputation: { position: 'relative', marginRight: 12, alignItems: 'center' },
    avatarEmoji: { fontSize: 36 },
    reputationBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    levelText: { fontSize: 9, fontWeight: '800', color: 'white' },
    authorInfo: { flex: 1 },
    nameAndTitle: { marginBottom: 2 },
    authorName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    reputationTitle: { fontSize: 11, color: '#8b5cf6', fontWeight: '600', marginTop: 1 },
    postMeta: { flexDirection: 'row', alignItems: 'center' },
    dormitoryTag: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    timestamp: { fontSize: 12, color: '#9ca3af' },
    postTypeSection: { alignItems: 'center' },
    postTypeBadge: { padding: 8, borderRadius: 12, marginBottom: 4 },
    moreOptionsButton: { padding: 6, borderRadius: 8 },
    postContent: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 14,
        fontWeight: '500',
    },
    postImageContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
    postImage: { width: '100%', height: 200, resizeMode: 'cover' },

    // Achievement showcase
    achievementShowcase: { borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
    achievementGradient: { padding: 16, alignItems: 'center' },
    achievementHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    achievementTitle: { color: 'white', fontSize: 14, fontWeight: '700' },
    achievementName: { color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
    achievementDescription: { color: 'rgba(255,255,255,0.9)', fontSize: 13, textAlign: 'center', marginBottom: 12, lineHeight: 18 },
    achievementStats: { flexDirection: 'row', gap: 16 },
    achievementStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    achievementStatText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },

    // Challenge invitation
    challengeInvitation: { borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
    challengeGradient: { padding: 16 },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    challengeTitle: { color: 'white', fontSize: 16, fontWeight: '700', flex: 1, marginLeft: 8 },
    challengeTimeLeft: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
    challengeDescription: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 12, lineHeight: 18 },
    challengeStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    challengeStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    challengeStatText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
    joinChallengeButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    joinChallengeText: { color: 'white', fontSize: 13, fontWeight: '700' },

    // Event info
    eventInfo: { borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
    eventInfoGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
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

    // Environmental impact
    impactDisplay: { borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
    impactGradient: { padding: 12 },
    impactHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    impactTitle: { fontSize: 13, color: '#059669', fontWeight: '700' },
    impactMetrics: { flexDirection: 'row', justifyContent: 'space-around' },
    impactMetric: { alignItems: 'center', gap: 2 },
    impactValue: { fontSize: 12, fontWeight: '700', color: '#374151' },
    impactLabel: { fontSize: 10, color: '#6b7280', fontWeight: '500' },

    // Social actions
    enhancedSocialActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    socialActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    endorseButton: { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' },
    actionText: { fontSize: 12, fontWeight: '600' },

    // Comments
    commentsPreview: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    commentItem: { flexDirection: 'row', marginBottom: 6, gap: 6 },
    commentAuthor: { fontSize: 12, fontWeight: '600', color: '#374151' },
    commentText: { fontSize: 12, color: '#6b7280', flex: 1 },
    viewAllComments: { marginTop: 6 },
    viewAllCommentsText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },

    // Leaderboard
    leaderboardContainer: { flex: 1 },
    leaderboardSelector: {
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
    leaderboardType: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    activeLeaderboardType: { backgroundColor: '#059669' },
    leaderboardTypeLabel: { fontSize: 11, fontWeight: '600' },
    leaderboardList: { flex: 1 },
    leaderboardContent: { padding: 16, paddingBottom: 100 },
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
    leaderboardItemGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    rankContainer: { position: 'relative', alignItems: 'center' },
    rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    rankText: { fontSize: 14, fontWeight: '800' },
    trophyContainer: { position: 'absolute', top: -8, right: -8 },
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
    youIndicator: { position: 'absolute', top: 8, right: 8, borderRadius: 8, overflow: 'hidden' },
    youIndicatorGradient: { paddingHorizontal: 8, paddingVertical: 4 },
    youIndicatorText: { color: 'white', fontSize: 9, fontWeight: '800' },

    // Challenges
    challengesContainer: { flex: 1 },
    challengesContent: { padding: 16, paddingBottom: 100 },
    createChallengeButton: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
    createChallengeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    createChallengeText: { color: 'white', fontSize: 16, fontWeight: '700' },

    challengeCard: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    challengeCardGradient: { padding: 20 },
    challengeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    challengeTitleSection: { flex: 1, marginRight: 12 },
    challengeName: { fontSize: 18, fontWeight: '800', color: 'white', marginBottom: 6 },
    difficultyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    difficultyText: { color: 'white', fontSize: 10, fontWeight: '700' },
    challengeTimer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    timeLeftText: { color: 'white', fontSize: 12, fontWeight: '600' },
    challengeProgressSection: { marginBottom: 16 },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
    progressValues: { color: 'white', fontSize: 14, fontWeight: '700' },
    progressTrack: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: { height: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 4 },
    progressPercentage: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    participantsSection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    participantsText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
    joinChallengeBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    joinChallengeBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
    rewardBanner: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
    rewardText: { color: 'white', fontSize: 13, fontWeight: '600', textAlign: 'center' },

    // Events
    eventsContainer: { flex: 1 },
    eventsContent: { padding: 16, paddingBottom: 100, alignItems: 'center', justifyContent: 'center' },
    comingSoonText: { fontSize: 18, color: '#6b7280', fontWeight: '600', textAlign: 'center' },

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
    characterCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginBottom: 20 },
    quickPostActions: { flexDirection: 'row', gap: 12 },
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
