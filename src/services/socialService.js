// Social & Community Service Functions
import { collection, doc, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export const socialService = {
    // 👥 FRIENDS SYSTEM
    async sendFriendRequest(currentUserId, targetUserId) {
        try {
            const requestRef = doc(db, 'friendRequests', `${currentUserId}_${targetUserId}`);
            await setDoc(requestRef, {
                from: currentUserId,
                to: targetUserId,
                status: 'pending',
                timestamp: new Date(),
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async acceptFriendRequest(currentUserId, requesterUserId) {
        try {
            // Add to both users' friends lists
            await Promise.all([
                updateDoc(doc(db, 'users', currentUserId), {
                    friends: arrayUnion(requesterUserId)
                }),
                updateDoc(doc(db, 'users', requesterUserId), {
                    friends: arrayUnion(currentUserId)
                })
            ]);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // 🏆 CHALLENGES SYSTEM
    async createChallenge(creatorId, challengeData) {
        try {
            const challengeRef = doc(collection(db, 'challenges'));
            await setDoc(challengeRef, {
                ...challengeData,
                creator: creatorId,
                participants: [creatorId],
                createdAt: new Date(),
                status: 'active',
            });
            return { success: true, challengeId: challengeRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async joinChallenge(userId, challengeId) {
        try {
            await updateDoc(doc(db, 'challenges', challengeId), {
                participants: arrayUnion(userId)
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // 📱 SOCIAL POSTS
    async createPost(userId, postData) {
        try {
            const postRef = doc(collection(db, 'communityPosts'));
            await setDoc(postRef, {
                ...postData,
                author: userId,
                createdAt: new Date(),
                likes: 0,
                comments: 0,
                shares: 0,
            });
            return { success: true, postId: postRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async likePost(userId, postId) {
        try {
            await updateDoc(doc(db, 'communityPosts', postId), {
                likes: arrayUnion(userId)
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // 🎯 LEADERBOARDS
    async getDormitoryLeaderboard() {
        try {
            const q = query(
                collection(db, 'dormitoryStats'),
                orderBy('totalPoints', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);
            return {
                success: true,
                data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getFriendsLeaderboard(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            const friends = userDoc.data()?.friends || [];

            const q = query(
                collection(db, 'users'),
                where('uid', 'in', [...friends, userId]),
                orderBy('totalPoints', 'desc')
            );
            const snapshot = await getDocs(q);
            return {
                success: true,
                data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
};
