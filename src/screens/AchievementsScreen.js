import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    FlatList,
    Modal,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// COMPREHENSIVE: 40 Achievements across 8 categories
const ACHIEVEMENTS_DATA = [
    // Scanning Achievements
    { id: '1', category: 'scanning', name: 'First Steps', description: 'Scanned your first item', icon: 'leaf-outline', unlocked: true, date: '2025-10-15', points: 10, rarity: 'common' },
    { id: '2', category: 'scanning', name: 'Getting Started', description: 'Scan 5 items', icon: 'leaf', unlocked: true, date: '2025-10-16', points: 25, rarity: 'common' },
    { id: '3', category: 'scanning', name: 'Eco Apprentice', description: 'Scan 25 items', icon: 'planet', unlocked: true, date: '2025-10-18', points: 50, rarity: 'common' },
    { id: '4', category: 'scanning', name: 'Recycling Pro', description: 'Scan 50 items', icon: 'shield-checkmark', unlocked: true, date: '2025-10-20', points: 100, rarity: 'uncommon' },
    { id: '5', category: 'scanning', name: 'Eco Warrior', description: 'Scan 100 items', icon: 'shield', unlocked: false, progress: 0.89, points: 200, rarity: 'uncommon' },
    { id: '6', category: 'scanning', name: 'Green Guardian', description: 'Scan 250 items', icon: 'shield-checkmark-outline', unlocked: false, progress: 0.36, points: 350, rarity: 'rare' },
    { id: '7', category: 'scanning', name: 'Recycling Master', description: 'Scan 500 items', icon: 'trophy', unlocked: false, progress: 0.18, points: 500, rarity: 'epic' },
    { id: '8', category: 'scanning', name: 'Eco Legend', description: 'Scan 1000 items', icon: 'star', unlocked: false, progress: 0.09, points: 1000, rarity: 'legendary' },

    // Level Achievements
    { id: '9', category: 'levels', name: 'Level Up!', description: 'Reach Level 2', icon: 'trending-up', unlocked: true, date: '2025-10-16', points: 20, rarity: 'common' },
    { id: '10', category: 'levels', name: 'Rising Star', description: 'Reach Level 5', icon: 'star-outline', unlocked: true, date: '2025-10-20', points: 75, rarity: 'uncommon' },
    { id: '11', category: 'levels', name: 'High Achiever', description: 'Reach Level 10', icon: 'ribbon', unlocked: false, progress: 0.5, points: 150, rarity: 'rare' },
    { id: '12', category: 'levels', name: 'Elite Status', description: 'Reach Level 20', icon: 'medal', unlocked: false, progress: 0.25, points: 300, rarity: 'epic' },
    { id: '13', category: 'levels', name: 'Legendary', description: 'Reach Level 50', icon: 'crown', unlocked: false, progress: 0.1, points: 750, rarity: 'legendary' },

    // Streak Achievements
    { id: '14', category: 'streaks', name: 'Consistent', description: '3-day recycling streak', icon: 'flash', unlocked: true, date: '2025-10-17', points: 30, rarity: 'common' },
    { id: '15', category: 'streaks', name: 'Dedicated', description: '7-day recycling streak', icon: 'flash-outline', unlocked: true, date: '2025-10-22', points: 75, rarity: 'uncommon' },
    { id: '16', category: 'streaks', name: 'Committed', description: '14-day recycling streak', icon: 'thunderstorm', unlocked: false, progress: 0.36, points: 150, rarity: 'rare' },
    { id: '17', category: 'streaks', name: 'Unstoppable', description: '30-day recycling streak', icon: 'thunderstorm-outline', unlocked: false, progress: 0.17, points: 300, rarity: 'epic' },
    { id: '18', category: 'streaks', name: 'Eco Addict', description: '100-day recycling streak', icon: 'flame', unlocked: false, progress: 0.05, points: 1000, rarity: 'legendary' },

    // Social Achievements
    { id: '19', category: 'social', name: 'Team Player', description: 'Join a recycling challenge', icon: 'people', unlocked: false, progress: 0, points: 50, rarity: 'uncommon' },
    { id: '20', category: 'social', name: 'Influencer', description: 'Refer 3 friends', icon: 'share', unlocked: false, progress: 0.33, points: 100, rarity: 'rare' },
    { id: '21', category: 'social', name: 'Community Leader', description: 'Help 10 new users', icon: 'hand-left', unlocked: false, progress: 0, points: 200, rarity: 'epic' },
    { id: '22', category: 'social', name: 'Campus Ambassador', description: 'Refer 25 friends', icon: 'megaphone', unlocked: false, progress: 0.04, points: 500, rarity: 'legendary' },

    // Material-Specific Achievements
    { id: '23', category: 'materials', name: 'Plastic Crusher', description: 'Recycle 50 plastic items', icon: 'bottle', unlocked: false, progress: 0.68, points: 100, rarity: 'uncommon' },
    { id: '24', category: 'materials', name: 'Paper Trail', description: 'Recycle 30 paper items', icon: 'document', unlocked: false, progress: 0.93, points: 75, rarity: 'uncommon' },
    { id: '25', category: 'materials', name: 'Glass Collector', description: 'Recycle 25 glass items', icon: 'wine', unlocked: false, progress: 0.72, points: 125, rarity: 'rare' },
    { id: '26', category: 'materials', name: 'Metal Detective', description: 'Recycle 15 metal items', icon: 'build', unlocked: false, progress: 0.6, points: 100, rarity: 'rare' },
    { id: '27', category: 'materials', name: 'Material Master', description: 'Recycle all 4 material types in one day', icon: 'layers', unlocked: false, progress: 0, points: 200, rarity: 'epic' },

    // Ranking Achievements
    { id: '28', category: 'ranking', name: 'Top 100', description: 'Reach top 100 on leaderboard', icon: 'podium', unlocked: true, date: '2025-10-25', points: 75, rarity: 'uncommon' },
    { id: '29', category: 'ranking', name: 'Top 50', description: 'Reach top 50 on leaderboard', icon: 'trophy-outline', unlocked: true, date: '2025-10-28', points: 125, rarity: 'rare' },
    { id: '30', category: 'ranking', name: 'Top 25', description: 'Reach top 25 on leaderboard', icon: 'medal-outline', unlocked: false, progress: 0.32, points: 200, rarity: 'rare' },
    { id: '31', category: 'ranking', name: 'Top 10', description: 'Reach top 10 on leaderboard', icon: 'medal', unlocked: false, progress: 0.8, points: 300, rarity: 'epic' },
    { id: '32', category: 'ranking', name: 'Champion', description: 'Reach #1 on leaderboard', icon: 'crown-outline', unlocked: false, progress: 0, points: 1000, rarity: 'legendary' },

    // Special Achievements
    { id: '33', category: 'special', name: 'Earth Day Hero', description: 'Scan 22 items on Earth Day', icon: 'earth', unlocked: false, progress: 0, points: 222, rarity: 'rare' },
    { id: '34', category: 'special', name: 'Night Owl', description: 'Scan items after 10 PM', icon: 'moon', unlocked: false, progress: 0, points: 50, rarity: 'uncommon' },
    { id: '35', category: 'special', name: 'Early Bird', description: 'Scan items before 7 AM', icon: 'sunny-outline', unlocked: false, progress: 0, points: 50, rarity: 'uncommon' },
    { id: '36', category: 'special', name: 'Weekend Warrior', description: 'Scan items on both weekend days', icon: 'calendar', unlocked: true, date: '2025-10-26', points: 75, rarity: 'uncommon' },
    { id: '37', category: 'special', name: 'Perfect Week', description: 'Hit daily goal every day for a week', icon: 'checkmark-circle', unlocked: false, progress: 0.57, points: 200, rarity: 'epic' },
    { id: '38', category: 'special', name: 'Explorer', description: 'Scan items at 5 different locations', icon: 'map', unlocked: false, progress: 0.4, points: 100, rarity: 'rare' },
    { id: '39', category: 'special', name: 'Speed Demon', description: 'Scan 10 items in 5 minutes', icon: 'flash', unlocked: false, progress: 0, points: 150, rarity: 'epic' },
    { id: '40', category: 'special', name: 'Eco Evangelist', description: 'Complete all achievements', icon: 'infinite', unlocked: false, progress: 0.25, points: 2000, rarity: 'legendary' },
];

export default function AchievementsScreen({ navigation }) {
    const [achievements, setAchievements] = useState(ACHIEVEMENTS_DATA);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Trophy effects
    const shineAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;

    // Floating celebration particles
    const confetti1 = useRef(new Animated.Value(0)).current;
    const confetti2 = useRef(new Animated.Value(0)).current;
    const confetti3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Grand entrance animation
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 6,
                    tension: 45,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Trophy shine effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(shineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(shineAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Pulse animation for unlocked achievements
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Sparkle animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(sparkleAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(sparkleAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Floating confetti
        [confetti1, confetti2, confetti3].forEach((confetti, index) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(confetti, {
                        toValue: -200,
                        duration: 8000 + (index * 1000),
                        useNativeDriver: true,
                    }),
                    Animated.timing(confetti, {
                        toValue: 0,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    const categories = ['all', 'scanning', 'levels', 'streaks', 'social', 'materials', 'ranking', 'special'];

    const filteredAchievements = selectedCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case 'common': return '#6b7280';
            case 'uncommon': return '#059669';
            case 'rare': return '#3b82f6';
            case 'epic': return '#8b5cf6';
            case 'legendary': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getRarityGradient = (rarity) => {
        switch (rarity) {
            case 'common': return ['#9ca3af', '#6b7280'];
            case 'uncommon': return ['#10b981', '#059669'];
            case 'rare': return ['#60a5fa', '#3b82f6'];
            case 'epic': return ['#a78bfa', '#8b5cf6'];
            case 'legendary': return ['#fbbf24', '#f59e0b'];
            default: return ['#9ca3af', '#6b7280'];
        }
    };

    const openAchievementModal = (achievement) => {
        setSelectedAchievement(achievement);
        setShowModal(true);
    };

    const renderCategoryTab = (category) => {
        const isActive = selectedCategory === category;
        const categoryIcons = {
            all: 'apps',
            scanning: 'scan',
            levels: 'trending-up',
            streaks: 'flash',
            social: 'people',
            materials: 'layers',
            ranking: 'trophy',
            special: 'star'
        };

        return (
            <TouchableOpacity
                key={category}
                style={[styles.categoryTab, isActive && styles.activeCategoryTab]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
            >
                {isActive ? (
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.activeCategoryGradient}>
                        <Ionicons name={categoryIcons[category]} size={16} color="white" />
                        <Text style={styles.activeCategoryText}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                    </LinearGradient>
                ) : (
                    <View style={styles.inactiveCategoryContent}>
                        <Ionicons name={categoryIcons[category]} size={16} color="#6b7280" />
                        <Text style={styles.inactiveCategoryText}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderAchievement = ({ item, index }) => (
        <Animated.View
            style={[
                styles.achievementCard,
                {
                    opacity: fadeAnim,
                    transform: [
                        {
                            translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                            }),
                        },
                        { scale: item.unlocked ? pulseAnim : 1 },
                    ],
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openAchievementModal(item)}
            >
                <LinearGradient
                    colors={item.unlocked ? getRarityGradient(item.rarity) : ['#f3f4f6', '#e5e7eb']}
                    style={styles.achievementGradient}
                >
                    {/* Rarity indicator */}
                    <View style={[styles.rarityIndicator, { backgroundColor: getRarityColor(item.rarity) }]} />

                    {/* Achievement icon */}
                    <View style={styles.achievementIconContainer}>
                        <Animated.View style={[
                            styles.achievementIcon,
                            item.unlocked && { transform: [{ scale: sparkleAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.1],
                                    })}] }
                        ]}>
                            <Ionicons
                                name={item.icon}
                                size={32}
                                color={item.unlocked ? 'white' : '#9ca3af'}
                            />
                            {item.unlocked && (
                                <Animated.View style={[styles.achievementShine, { opacity: shineAnim }]} />
                            )}
                        </Animated.View>

                        {item.unlocked && (
                            <Animated.View style={[styles.checkmark, { opacity: sparkleAnim }]}>
                                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                            </Animated.View>
                        )}
                    </View>

                    {/* Achievement info */}
                    <View style={styles.achievementInfo}>
                        <Text style={[
                            styles.achievementName,
                            { color: item.unlocked ? 'white' : '#4b5563' }
                        ]}>
                            {item.name}
                        </Text>
                        <Text style={[
                            styles.achievementDescription,
                            { color: item.unlocked ? 'rgba(255,255,255,0.9)' : '#6b7280' }
                        ]}>
                            {item.description}
                        </Text>

                        {/* Points badge */}
                        <View style={[styles.pointsBadge, { backgroundColor: item.unlocked ? 'rgba(255,255,255,0.2)' : '#f3f4f6' }]}>
                            <Ionicons name="star" size={12} color={item.unlocked ? 'white' : '#9ca3af'} />
                            <Text style={[styles.pointsText, { color: item.unlocked ? 'white' : '#6b7280' }]}>
                                +{item.points} pts
                            </Text>
                        </View>

                        {/* Progress bar for locked achievements */}
                        {!item.unlocked && item.progress !== undefined && (
                            <View style={styles.achievementProgress}>
                                <View style={styles.achievementProgressTrack}>
                                    <View
                                        style={[
                                            styles.achievementProgressBar,
                                            {
                                                width: `${item.progress * 100}%`,
                                                backgroundColor: getRarityColor(item.rarity),
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.achievementProgressText}>
                                    {Math.round(item.progress * 100)}% complete
                                </Text>
                            </View>
                        )}

                        {/* Unlock date for completed achievements */}
                        {item.unlocked && item.date && (
                            <Text style={styles.unlockDate}>
                                Unlocked {new Date(item.date).toLocaleDateString()}
                            </Text>
                        )}
                    </View>

                    {/* Rarity label */}
                    <View style={[styles.rarityLabel, { backgroundColor: getRarityColor(item.rarity) }]}>
                        <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fef3c7', '#fbbf24', '#ffffff']} style={styles.gradient}>
                {/* Floating confetti */}
                <Animated.View style={[styles.confetti, styles.confetti1, { transform: [{ translateY: confetti1 }] }]} />
                <Animated.View style={[styles.confetti, styles.confetti2, { transform: [{ translateY: confetti2 }] }]} />
                <Animated.View style={[styles.confetti, styles.confetti3, { transform: [{ translateY: confetti3 }] }]} />

                {/* Header */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>🏆 Achievements</Text>
                            <Text style={styles.headerStats}>
                                {unlockedCount}/{achievements.length} unlocked • {totalPoints} points earned
                            </Text>
                        </View>

                        <Animated.View style={[styles.headerTrophy, { transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons name="trophy" size={28} color="white" />
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>

                {/* Category Tabs */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryTabs}
                        contentContainerStyle={styles.categoryTabsContent}
                    >
                        {categories.map(renderCategoryTab)}
                    </ScrollView>
                </Animated.View>

                {/* Achievements List */}
                <FlatList
                    data={filteredAchievements}
                    renderItem={renderAchievement}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.achievementRow}
                    contentContainerStyle={styles.achievementsList}
                    showsVerticalScrollIndicator={false}
                />

                {/* Achievement Detail Modal */}
                <Modal
                    visible={showModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
                            {selectedAchievement && (
                                <LinearGradient
                                    colors={selectedAchievement.unlocked ? getRarityGradient(selectedAchievement.rarity) : ['#f9fafb', '#e5e7eb']}
                                    style={styles.modalGradient}
                                >
                                    <TouchableOpacity
                                        style={styles.modalClose}
                                        onPress={() => setShowModal(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close" size={24} color={selectedAchievement.unlocked ? 'white' : '#6b7280'} />
                                    </TouchableOpacity>

                                    <View style={styles.modalAchievementIcon}>
                                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                            <Ionicons
                                                name={selectedAchievement.icon}
                                                size={64}
                                                color={selectedAchievement.unlocked ? 'white' : '#9ca3af'}
                                            />
                                        </Animated.View>
                                    </View>

                                    <Text style={[styles.modalAchievementName, {
                                        color: selectedAchievement.unlocked ? 'white' : '#1f2937'
                                    }]}>
                                        {selectedAchievement.name}
                                    </Text>

                                    <Text style={[styles.modalAchievementDesc, {
                                        color: selectedAchievement.unlocked ? 'rgba(255,255,255,0.9)' : '#6b7280'
                                    }]}>
                                        {selectedAchievement.description}
                                    </Text>

                                    <View style={[styles.modalPointsBadge, {
                                        backgroundColor: selectedAchievement.unlocked ? 'rgba(255,255,255,0.2)' : '#f3f4f6'
                                    }]}>
                                        <Ionicons name="star" size={16} color={selectedAchievement.unlocked ? 'white' : '#6b7280'} />
                                        <Text style={[styles.modalPointsText, {
                                            color: selectedAchievement.unlocked ? 'white' : '#6b7280'
                                        }]}>
                                            +{selectedAchievement.points} Points
                                        </Text>
                                    </View>

                                    <View style={[styles.modalRarityBadge, { backgroundColor: getRarityColor(selectedAchievement.rarity) }]}>
                                        <Text style={styles.modalRarityText}>{selectedAchievement.rarity.toUpperCase()}</Text>
                                    </View>

                                    {selectedAchievement.unlocked && selectedAchievement.date && (
                                        <Text style={styles.modalUnlockDate}>
                                            🗓️ Unlocked on {new Date(selectedAchievement.date).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                        </Text>
                                    )}

                                    {!selectedAchievement.unlocked && selectedAchievement.progress !== undefined && (
                                        <View style={styles.modalProgress}>
                                            <Text style={styles.modalProgressLabel}>Progress</Text>
                                            <View style={styles.modalProgressTrack}>
                                                <View
                                                    style={[
                                                        styles.modalProgressBar,
                                                        {
                                                            width: `${selectedAchievement.progress * 100}%`,
                                                            backgroundColor: getRarityColor(selectedAchievement.rarity),
                                                        },
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.modalProgressText}>
                                                {Math.round(selectedAchievement.progress * 100)}% Complete
                                            </Text>
                                        </View>
                                    )}
                                </LinearGradient>
                            )}
                        </Animated.View>
                    </View>
                </Modal>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },

    // Floating confetti
    confetti: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        opacity: 0.6,
    },
    confetti1: {
        backgroundColor: '#f59e0b',
        top: '100%',
        left: '20%',
    },
    confetti2: {
        backgroundColor: '#059669',
        top: '100%',
        right: '30%',
    },
    confetti3: {
        backgroundColor: '#8b5cf6',
        top: '100%',
        left: '70%',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 24,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
        marginBottom: 4,
    },
    headerStats: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    headerTrophy: {
        padding: 8,
    },

    // Category tabs
    categoryTabs: {
        maxHeight: 50,
        marginBottom: 16,
    },
    categoryTabsContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryTab: {
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 8,
    },
    activeCategoryTab: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    activeCategoryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    activeCategoryText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    inactiveCategoryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#ffffff',
        gap: 6,
    },
    inactiveCategoryText: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '600',
    },

    // Achievements list
    achievementsList: {
        padding: 16,
        paddingBottom: 100,
    },
    achievementRow: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    achievementCard: {
        width: (width - 48) / 2,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    achievementGradient: {
        padding: 16,
        alignItems: 'center',
        position: 'relative',
        minHeight: 160,
    },
    rarityIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    achievementIconContainer: {
        marginBottom: 12,
        position: 'relative',
    },
    achievementIcon: {
        position: 'relative',
    },
    achievementShine: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        zIndex: -1,
    },
    checkmark: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    achievementInfo: {
        alignItems: 'center',
        flex: 1,
    },
    achievementName: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
    },
    achievementDescription: {
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 16,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        marginBottom: 8,
    },
    pointsText: {
        fontSize: 11,
        fontWeight: '700',
    },
    achievementProgress: {
        width: '100%',
        marginTop: 8,
    },
    achievementProgressTrack: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    achievementProgressBar: {
        height: 4,
        borderRadius: 2,
    },
    achievementProgressText: {
        fontSize: 9,
        color: '#6b7280',
        textAlign: 'center',
        fontWeight: '600',
    },
    unlockDate: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        fontWeight: '500',
        marginTop: 4,
    },
    rarityLabel: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    rarityText: {
        fontSize: 8,
        color: 'white',
        fontWeight: '800',
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalGradient: {
        padding: 24,
        alignItems: 'center',
        position: 'relative',
    },
    modalClose: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    modalAchievementIcon: {
        marginBottom: 16,
        marginTop: 16,
    },
    modalAchievementName: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalAchievementDesc: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },
    modalPointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        marginBottom: 12,
    },
    modalPointsText: {
        fontSize: 14,
        fontWeight: '700',
    },
    modalRarityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    modalRarityText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '800',
    },
    modalUnlockDate: {
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    modalProgress: {
        width: '100%',
        alignItems: 'center',
        marginTop: 12,
    },
    modalProgressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    modalProgressTrack: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    modalProgressBar: {
        height: 8,
        borderRadius: 4,
    },
    modalProgressText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '600',
    },
});
