// Enhanced Reward Service with Proper Voucher Creation
import { ref, get, update, serverTimestamp } from 'firebase/database';
import { database } from '../config/firebase';
import { voucherService } from './voucherService';

export const rewardService = {
    async redeemReward(userId, rewardId, userPoints) {
        try {
            console.log('🎁 Starting reward redemption:', { userId, rewardId, userPoints });

            // 1. Get reward details
            const rewardRef = ref(database, `rewards/${rewardId}`);
            const rewardSnapshot = await get(rewardRef);

            if (!rewardSnapshot.exists()) {
                return { success: false, error: 'Reward not found' };
            }

            const reward = rewardSnapshot.val();

            // 2. Check if user has enough points
            if (userPoints < reward.pointsCost) {
                return {
                    success: false,
                    error: `Insufficient points. You need ${reward.pointsCost} points but only have ${userPoints}.`
                };
            }

            // 3. Create voucher using the voucher service
            const voucherResult = await voucherService.createVoucher(userId, {
                title: reward.title,
                description: reward.description,
                pointsCost: reward.pointsCost,
                type: reward.type || 'general',
                instructions: reward.redemptionInstructions || `Show this voucher to redeem: ${reward.title}`
            });

            if (!voucherResult.success) {
                return { success: false, error: 'Failed to create voucher: ' + voucherResult.error };
            }

            // 4. Deduct points from user (atomic operation)
            const updates = {};
            updates[`users/${userId}/totalPoints`] = userPoints - reward.pointsCost;
            updates[`users/${userId}/totalRedemptions`] = (await this.getUserRedemptionCount(userId)) + 1;

            // Track redemption history
            updates[`redemptions/${userId}/${voucherResult.voucher.id}`] = {
                rewardId: rewardId,
                rewardTitle: reward.title,
                pointsCost: reward.pointsCost,
                redeemedAt: serverTimestamp(),
                voucherId: voucherResult.voucher.id,
                status: 'completed'
            };

            await update(ref(database), updates);

            console.log('✅ Reward redemption completed successfully');

            return {
                success: true,
                voucher: voucherResult.voucher,
                newPointsBalance: userPoints - reward.pointsCost
            };

        } catch (error) {
            console.error('❌ Error redeeming reward:', error);
            return {
                success: false,
                error: error.message || 'Failed to redeem reward',
                code: error.code
            };
        }
    },

    async getUserRedemptionCount(userId) {
        try {
            const redemptionsRef = ref(database, `redemptions/${userId}`);
            const snapshot = await get(redemptionsRef);

            if (!snapshot.exists()) return 0;

            return Object.keys(snapshot.val()).length;
        } catch (error) {
            return 0;
        }
    },

    async getAllRewards() {
        try {
            const rewardsRef = ref(database, 'rewards');
            const snapshot = await get(rewardsRef);

            if (!snapshot.exists()) {
                return { success: true, rewards: [] };
            }

            const rewards = Object.entries(snapshot.val()).map(([id, data]) => ({
                id,
                ...data
            }));

            return { success: true, rewards };

        } catch (error) {
            console.error('Error getting rewards:', error);
            return { success: false, error: error.message };
        }
    }
};
