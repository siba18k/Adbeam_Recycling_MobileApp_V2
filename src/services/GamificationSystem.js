// Advanced Gamification System with Engagement Psychology
import {
    doc,
    updateDoc,
    arrayUnion,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    increment, getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🎯 ACHIEVEMENT DEFINITIONS with Rarity & Psychology
export const ACHIEVEMENT_TIERS = {
    COMMON: { color: '#059669', multiplier: 1, rarity: 'Common' },
    UNCOMMON: { color: '#3b82f6', multiplier: 1.5, rarity: 'Uncommon' },
    RARE: { color: '#8b5cf6', multiplier: 2, rarity: 'Rare' },
    EPIC: { color: '#f59e0b', multiplier: 3, rarity: 'Epic' },
    LEGENDARY: { color: '#ef4444', multiplier: 5, rarity: 'Legendary' }
};

export const ACHIEVEMENTS = [
    // COMMON TIER - First Steps
    { id: 'first_scan', name: 'First Steps', description: 'Welcome to eco-life! Scanned your first recyclable item.', tier: 'COMMON', requirement: { type: 'scans', count: 1 }, points: 25, icon: 'leaf-outline' },
    { id: 'early_bird', name: 'Early Bird', description: 'Recycled before 9 AM - setting the day right!', tier: 'COMMON', requirement: { type: 'morning_scans', count: 1 }, points: 30, icon: 'sunny' },
    { id: 'campus_explorer', name: 'Campus Explorer', description: 'Recycled items at 3 different campus locations.', tier: 'COMMON', requirement: { type: 'unique_locations', count: 3 }, points: 40, icon: 'map' },

    // UNCOMMON TIER - Building Momentum
    { id: 'streak_starter', name: 'Streak Starter', description: 'Maintained a 3-day recycling streak - consistency counts!', tier: 'UNCOMMON', requirement: { type: 'streak_days', count: 3 }, points: 75, icon: 'flash' },
    { id: 'variety_seeker', name: 'Variety Seeker', description: 'Recycled all 3 material types: plastic, glass, and aluminum.', tier: 'UNCOMMON', requirement: { type: 'material_variety', count: 3 }, points: 100, icon: 'library' },
    { id: 'social_connector', name: 'Social Connector', description: 'Connected with 5 friends on the platform.', tier: 'UNCOMMON', requirement: { type: 'friends', count: 5 }, points: 85, icon: 'people' },

    // RARE TIER - Dedication
    { id: 'eco_apprentice', name: 'Eco Apprentice', description: 'Recycled 50 items - showing real environmental commitment!', tier: 'RARE', requirement: { type: 'scans', count: 50 }, points: 200, icon: 'planet' },
    { id: 'weekly_warrior', name: 'Weekly Warrior', description: 'Completed a perfect week - recycling every single day!', tier: 'RARE', requirement: { type: 'streak_days', count: 7 }, points: 250, icon: 'shield-checkmark' },
    { id: 'community_leader', name: 'Community Leader', description: 'Inspired 10 friends to start recycling through your posts.', tier: 'RARE', requirement: { type: 'referrals', count: 10 }, points: 300, icon: 'megaphone' },

    // EPIC TIER - Masters
    { id: 'recycling_master', name: 'Recycling Master', description: 'Legendary dedication! 100 items recycled with precision.', tier: 'EPIC', requirement: { type: 'scans', count: 100 }, points: 500, icon: 'trophy' },
    { id: 'streak_legend', name: 'Streak Legend', description: 'Unbreakable! 30-day recycling streak achieved.', tier: 'EPIC', requirement: { type: 'streak_days', count: 30 }, points: 750, icon: 'infinite' },
    { id: 'campus_champion', name: 'Campus Champion', description: 'Reached #1 on campus leaderboard - you inspire everyone!', tier: 'EPIC', requirement: { type: 'leaderboard_rank', rank: 1 }, points: 1000, icon: 'star' },

    // LEGENDARY TIER - Hall of Fame
    { id: 'eco_titan', name: 'Eco Titan', description: 'Mythical status! 500 items recycled - environmental superhero!', tier: 'LEGENDARY', requirement: { type: 'scans', count: 500 }, points: 2500, icon: 'diamond' },
    { id: 'sustainability_sage', name: 'Sustainability Sage', description: 'Wisdom through action - 1 year of daily recycling!', tier: 'LEGENDARY', requirement: { type: 'streak_days', count: 365 }, points: 5000, icon: 'library' },
    { id: 'campus_legend', name: 'Campus Legend', description: 'Hall of Fame inductee - top recycler across all semesters!', tier: 'LEGENDARY', requirement: { type: 'all_time_rank', rank: 1 }, points: 10000, icon: 'medal' }
];

// 🔥 ADVANCED STREAK SYSTEM with Loss Aversion Psychology
export class AdvancedStreakSystem {
    constructor(userId) {
        this.userId = userId;
        this.streakMultipliers = {
            0: 1.0,    // Days 1-2: Base points
            3: 1.2,    // Days 3-6: 20% bonus
            7: 1.5,    // Days 7-13: 50% bonus
            14: 2.0,   // Days 14-29: 100% bonus
            30: 3.0,   // Days 30+: 300% bonus (legendary)
        };
    }

    async checkStreak(lastScanDate, currentScanDate) {
        const yesterday = new Date(currentScanDate);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastScan = new Date(lastScanDate);
        const isYesterday = this.isSameDay(lastScan, yesterday);
        const isToday = this.isSameDay(lastScan, currentScanDate);

        if (isToday) {
            return { continued: true, broken: false, warning: false };
        } else if (isYesterday) {
            return { continued: true, broken: false, warning: false };
        } else {
            // Streak broken - trigger loss aversion psychology
            return { continued: false, broken: true, warning: false };
        }
    }

    async getStreakMultiplier(currentStreak) {
        const breakpoints = Object.keys(this.streakMultipliers)
            .map(k => parseInt(k))
            .sort((a, b) => b - a);

        for (const breakpoint of breakpoints) {
            if (currentStreak >= breakpoint) {
                return this.streakMultipliers[breakpoint];
            }
        }
        return 1.0;
    }

    // 🚨 Streak Insurance - Prevents accidental streak loss
    async offerStreakInsurance(userId, streakDays) {
        if (streakDays >= 7) {
            const insuranceCost = Math.min(50, streakDays * 2);
            return {
                available: true,
                cost: insuranceCost,
                protection: '24 hours',
                message: `Protect your ${streakDays}-day streak for ${insuranceCost} credits?`
            };
        }
        return { available: false };
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
}

// 🎯 CHALLENGE SYSTEM with Team Competitions
export class ChallengeSystem {
    static CHALLENGE_TYPES = {
        INDIVIDUAL: 'individual',
        FRIENDS: 'friends',
        DORMITORY: 'dormitory',
        CLUB: 'club',
        CAMPUS: 'campus'
    };

    static async createChallenge(creatorId, challengeData) {
        try {
            const challengeRef = doc(collection(db, 'challenges'));
            const challenge = {
                id: challengeRef.id,
                creator: creatorId,
                ...challengeData,
                participants: [creatorId],
                progress: {},
                status: 'active',
                createdAt: new Date(),
                startDate: challengeData.startDate || new Date(),
                endDate: challengeData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
            };

            await setDoc(challengeRef, challenge);

            // 📱 Send push notifications to relevant users
            await this.notifyPotentialParticipants(challenge);

            return { success: true, challengeId: challengeRef.id, challenge };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async joinChallenge(userId, challengeId) {
        try {
            const challengeRef = doc(db, 'challenges', challengeId);
            await updateDoc(challengeRef, {
                participants: arrayUnion(userId),
                [`progress.${userId}`]: { scans: 0, points: 0, joinedAt: new Date() }
            });

            // 🎉 Celebration notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🚀 Challenge Joined!',
                    body: 'You\'re now competing - time to start recycling!',
                    sound: true,
                },
                trigger: { seconds: 1 },
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async updateChallengeProgress(userId, challengeId, scanData) {
        try {
            const challengeRef = doc(db, 'challenges', challengeId);
            const challengeDoc = await getDoc(challengeRef);

            if (!challengeDoc.exists()) return { success: false, error: 'Challenge not found' };

            const challenge = challengeDoc.data();
            const currentProgress = challenge.progress[userId] || { scans: 0, points: 0 };

            const updatedProgress = {
                scans: currentProgress.scans + 1,
                points: currentProgress.points + scanData.points,
                lastScan: new Date(),
                environmentalImpact: {
                    co2Saved: (currentProgress.environmentalImpact?.co2Saved || 0) + scanData.environmentalImpact.co2,
                    itemsRecycled: (currentProgress.environmentalImpact?.itemsRecycled || 0) + 1
                }
            };

            await updateDoc(challengeRef, {
                [`progress.${userId}`]: updatedProgress
            });

            // 🏆 Check for challenge completion
            await this.checkChallengeCompletion(challengeId, challenge, updatedProgress);

            return { success: true, progress: updatedProgress };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async checkChallengeCompletion(challengeId, challenge, userProgress) {
        if (challenge.type === 'individual' && userProgress.scans >= challenge.target) {
            // 🎊 Individual challenge completed
            await this.awardChallengeCompletion(challenge.participants[0], challengeId, challenge.rewards);
        } else if (challenge.type === 'team') {
            // Check team progress
            const totalTeamProgress = Object.values(challenge.progress || {})
                .reduce((sum, progress) => sum + progress.scans, 0);

            if (totalTeamProgress >= challenge.target) {
                // 🏆 Team challenge completed
                for (const participantId of challenge.participants) {
                    await this.awardChallengeCompletion(participantId, challengeId, challenge.rewards);
                }
            }
        }
    }

    static async awardChallengeCompletion(userId, challengeId, rewards) {
        try {
            // Award points and achievements
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                totalPoints: arrayUnion(...rewards.points),
                completedChallenges: arrayUnion(challengeId),
                achievements: arrayUnion(...(rewards.achievements || []))
            });

            // 🎉 Epic celebration notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🏆 CHALLENGE COMPLETED!',
                    body: `Amazing work! You've earned ${rewards.points} points and unlocked special rewards!`,
                    sound: true,
                    vibrate: [0, 250, 250, 250],
                },
                trigger: { seconds: 2 },
            });

        } catch (error) {
            console.error('Error awarding challenge completion:', error);
        }
    }
}

// 🏆 DYNAMIC ACHIEVEMENT PROCESSOR
export class AchievementProcessor {
    static async checkAchievements(userId, userStats, scanData) {
        const unlockedAchievements = [];

        for (const achievement of ACHIEVEMENTS) {
            const isAlreadyUnlocked = userStats.achievements?.includes(achievement.id);
            if (isAlreadyUnlocked) continue;

            const isUnlocked = await this.evaluateAchievement(achievement, userStats, scanData);

            if (isUnlocked) {
                await this.unlockAchievement(userId, achievement);
                unlockedAchievements.push(achievement);
            }
        }

        return unlockedAchievements;
    }

    static async evaluateAchievement(achievement, userStats, scanData) {
        const req = achievement.requirement;

        switch (req.type) {
            case 'scans':
                return userStats.totalScans >= req.count;
            case 'streak_days':
                return userStats.currentStreak >= req.count;
            case 'material_variety':
                const materials = new Set(userStats.scannedMaterials || []);
                return materials.size >= req.count;
            case 'friends':
                return (userStats.friends || []).length >= req.count;
            case 'morning_scans':
                const scanHour = new Date(scanData.timestamp).getHours();
                return scanHour < 9 && (userStats.morningScanCount || 0) >= req.count;
            case 'unique_locations':
                const locations = new Set(userStats.scanLocations || []);
                return locations.size >= req.count;
            case 'leaderboard_rank':
                return userStats.campusRank <= req.rank;
            default:
                return false;
        }
    }

    static async unlockAchievement(userId, achievement) {
        try {
            const userRef = doc(db, 'users', userId);
            const tierInfo = ACHIEVEMENT_TIERS[achievement.tier];
            const bonusPoints = Math.round(achievement.points * tierInfo.multiplier);

            await updateDoc(userRef, {
                achievements: arrayUnion(achievement.id),
                totalPoints: increment(bonusPoints),
                [`achievementProgress.${achievement.id}`]: {
                    unlockedAt: new Date(),
                    tier: achievement.tier,
                    pointsEarned: bonusPoints
                }
            });

            // 🎊 CELEBRATION SYSTEM - Variable rewards for engagement
            await this.triggerAchievementCelebration(achievement, tierInfo);

            // 📱 Social sharing prompt
            await this.promptSocialSharing(userId, achievement, bonusPoints);

        } catch (error) {
            console.error('Error unlocking achievement:', error);
        }
    }

    static async triggerAchievementCelebration(achievement, tierInfo) {
        // 🎆 Rarity-based celebration intensity
        const celebrations = {
            COMMON: { vibrate: [0, 100], sound: 'default' },
            UNCOMMON: { vibrate: [0, 200, 100, 200], sound: 'achievement_uncommon.mp3' },
            RARE: { vibrate: [0, 300, 150, 300, 150, 300], sound: 'achievement_rare.mp3' },
            EPIC: { vibrate: [0, 500, 200, 500, 200, 500], sound: 'achievement_epic.mp3' },
            LEGENDARY: { vibrate: [0, 1000, 300, 1000, 300, 1000], sound: 'achievement_legendary.mp3' }
        };

        const celebration = celebrations[achievement.tier];

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `🏆 ${tierInfo.rarity.toUpperCase()} ACHIEVEMENT UNLOCKED!`,
                body: `${achievement.name} - ${achievement.description}`,
                sound: celebration.sound,
                vibrate: celebration.vibrate,
                badge: 1,
            },
            trigger: { seconds: 1 },
        });
    }

    static async promptSocialSharing(userId, achievement, points) {
        // Store sharing opportunity for later prompt
        await AsyncStorage.setItem('pendingShare', JSON.stringify({
            type: 'achievement',
            achievement: achievement.name,
            points,
            timestamp: Date.now()
        }));
    }
}

// 📊 REPUTATION SYSTEM with Peer Recognition
export class ReputationSystem {
    static REPUTATION_LEVELS = [
        { min: 0, max: 99, title: 'Eco Newcomer', color: '#6b7280' },
        { min: 100, max: 299, title: 'Green Guardian', color: '#059669' },
        { min: 300, max: 699, title: 'Sustainability Scout', color: '#3b82f6' },
        { min: 700, max: 1499, title: 'Environmental Expert', color: '#8b5cf6' },
        { min: 1500, max: 2999, title: 'Recycling Master', color: '#f59e0b' },
        { min: 3000, max: 9999, title: 'Eco Champion', color: '#ef4444' },
        { min: 10000, max: Infinity, title: 'Sustainability Legend', color: '#7c2d12' }
    ];

    static async addEndorsement(endorserId, targetUserId, endorsementType) {
        try {
            const endorsementRef = doc(collection(db, 'endorsements'));
            await setDoc(endorsementRef, {
                endorser: endorserId,
                target: targetUserId,
                type: endorsementType, // 'helpful_recycler', 'inspiring_leader', 'knowledge_sharer'
                timestamp: new Date(),
                points: this.getEndorsementPoints(endorsementType)
            });

            // Add reputation points
            const targetRef = doc(db, 'users', targetUserId);
            await updateDoc(targetRef, {
                reputationPoints: increment(this.getEndorsementPoints(endorsementType)),
                endorsements: arrayUnion(endorsementRef.id)
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static getEndorsementPoints(type) {
        const points = {
            'helpful_recycler': 25,
            'inspiring_leader': 50,
            'knowledge_sharer': 35,
            'eco_mentor': 75
        };
        return points[type] || 25;
    }

    static getReputationLevel(points) {
        return this.REPUTATION_LEVELS.find(level =>
            points >= level.min && points <= level.max
        ) || this.REPUTATION_LEVELS[0];
    }
}

// 🎪 SEASONAL EVENTS with Limited-Time Psychology
export class SeasonalEventSystem {
    static SEASONAL_EVENTS = {
        earth_week: {
            name: 'Earth Week Challenge',
            description: 'Campus-wide sustainability celebration!',
            duration: 7, // days
            bonusMultiplier: 2.0,
            specialRewards: ['earth_week_champion', 'sustainability_hero'],
            monthsActive: [3, 4] // March-April
        },
        finals_recycling: {
            name: 'Finals Stress Relief Recycling',
            description: 'Turn finals stress into recycling success!',
            duration: 14, // days
            bonusMultiplier: 1.5,
            specialRewards: ['stress_reliever', 'finals_survivor'],
            monthsActive: [4, 5, 11, 12] // April-May, Nov-Dec
        },
        new_year_resolution: {
            name: 'New Year, New Green You',
            description: 'Start the year with sustainable habits!',
            duration: 30, // days
            bonusMultiplier: 1.3,
            specialRewards: ['resolution_keeper', 'new_year_champion'],
            monthsActive: [1] // January
        }
    };

    static async checkActiveEvents() {
        const currentMonth = new Date().getMonth() + 1;
        const activeEvents = [];

        for (const [eventId, event] of Object.entries(this.SEASONAL_EVENTS)) {
            if (event.monthsActive.includes(currentMonth)) {
                const isActive = await this.isEventCurrentlyActive(eventId);
                if (isActive) {
                    activeEvents.push({ id: eventId, ...event });
                }
            }
        }

        return activeEvents;
    }

    static async isEventCurrentlyActive(eventId) {
        try {
            const eventRef = doc(db, 'seasonal_events', eventId);
            const eventDoc = await getDoc(eventRef);

            if (!eventDoc.exists()) return false;

            const eventData = eventDoc.data();
            const now = new Date();

            return eventData.startDate <= now && eventData.endDate >= now;
        } catch (error) {
            return false;
        }
    }
}

// 🤝 MENTORSHIP SYSTEM
export class MentorshipSystem {
    static async suggestMentor(newUserId) {
        try {
            const q = query(
                collection(db, 'users'),
                where('totalScans', '>=', 100),
                where('mentorAvailable', '==', true),
                orderBy('menteeHelped', 'desc')
            );

            const snapshot = await getDocs(q);
            const potentialMentors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Select mentor with good reputation and availability
            const mentor = potentialMentors.find(m =>
                (m.reputationPoints || 0) >= 500 &&
                (m.currentMentees || []).length < 3
            );

            return mentor ? { success: true, mentor } : { success: false };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async createMentorshipPair(mentorId, menteeId) {
        try {
            await Promise.all([
                updateDoc(doc(db, 'users', mentorId), {
                    currentMentees: arrayUnion(menteeId),
                    reputationPoints: increment(100) // Mentor bonus
                }),
                updateDoc(doc(db, 'users', menteeId), {
                    mentor: mentorId,
                    mentorshipStarted: new Date()
                })
            ]);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
