// Enhanced Voucher Service with Proper Firebase Paths
import { ref, set, get, update, push, child, serverTimestamp } from 'firebase/database';
import { database } from '../config/firebase';
import {Alert} from "react-native";

export const voucherService = {
    async redeemVoucher(userId, voucherId) {
        try {
            console.log('🎯 Starting voucher redemption:', { userId, voucherId });

            // 1. Get voucher details
            const voucherRef = ref(database, `userVouchers/${userId}/${voucherId}`);
            const voucherSnapshot = await get(voucherRef);

            if (!voucherSnapshot.exists()) {
                return { success: false, error: 'Voucher not found' };
            }

            const voucher = voucherSnapshot.val();

            if (voucher.status === 'redeemed') {
                return { success: false, error: 'Voucher already redeemed' };
            }

            // 2. Create redemption record FIRST
            const redemptionId = push(child(ref(database), `voucherRedemptions/${userId}`)).key;
            const redemptionData = {
                voucherId: voucherId,
                voucherTitle: voucher.title,
                redeemedAt: serverTimestamp(),
                status: 'completed',
                redemptionMethod: 'mobile_app',
                location: 'campus'
            };

            // 3. Update multiple paths simultaneously (atomic operation)
            const updates = {};

            // Update voucher status
            updates[`userVouchers/${userId}/${voucherId}/status`] = 'redeemed';
            updates[`userVouchers/${userId}/${voucherId}/redeemedAt`] = serverTimestamp();

            // Add to redemption tracking
            updates[`voucherRedemptions/${userId}/${redemptionId}`] = redemptionData;

            // Move to redeemed vouchers
            updates[`redeemedVouchers/${voucherId}`] = {
                userId: userId,
                redeemedAt: serverTimestamp(),
                originalVoucher: voucher
            };

            // Remove from active vouchers (if exists)
            updates[`activeVouchers/${voucherId}`] = null;

            // 4. Execute atomic update
            await update(ref(database), updates);

            console.log('✅ Voucher redemption successful');

            return {
                success: true,
                redemptionId,
                voucher: {
                    ...voucher,
                    status: 'redeemed',
                    redeemedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('❌ Voucher redemption error:', error);
            return {
                success: false,
                error: error.message || 'Failed to redeem voucher',
                code: error.code
            };
        }
    },

    async createVoucher(userId, rewardData) {
        try {
            const voucherId = push(child(ref(database), `userVouchers/${userId}`)).key;

            const voucherData = {
                id: voucherId,
                title: rewardData.title,
                description: rewardData.description,
                pointsCost: rewardData.pointsCost,
                type: rewardData.type || 'general',
                status: 'active',
                createdAt: serverTimestamp(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                qrCode: `ADBEAM_${voucherId}_${Date.now()}`,
                redemptionInstructions: rewardData.instructions || 'Show this voucher to redeem your reward'
            };

            const updates = {};
            updates[`userVouchers/${userId}/${voucherId}`] = voucherData;
            updates[`activeVouchers/${voucherId}`] = {
                userId: userId,
                createdAt: serverTimestamp(),
                status: 'active'
            };

            await update(ref(database), updates);

            return { success: true, voucher: voucherData };

        } catch (error) {
            console.error('Error creating voucher:', error);
            return { success: false, error: error.message };
        }
    },

    async getUserVouchers(userId) {
        try {
            const vouchersRef = ref(database, `userVouchers/${userId}`);
            const snapshot = await get(vouchersRef);

            if (!snapshot.exists()) {
                return { success: true, vouchers: [] };
            }

            const vouchers = Object.entries(snapshot.val()).map(([id, data]) => ({
                id,
                ...data
            }));

            return { success: true, vouchers };

        } catch (error) {
            console.error('Error getting user vouchers:', error);
            return { success: false, error: error.message };
        }
    },

    async getVoucherById(userId, voucherId) {
        try {
            const voucherRef = ref(database, `userVouchers/${userId}/${voucherId}`);
            const snapshot = await get(voucherRef);

            if (!snapshot.exists()) {
                return { success: false, error: 'Voucher not found' };
            }

            return { success: true, voucher: { id: voucherId, ...snapshot.val() } };

        } catch (error) {
            console.error('Error getting voucher:', error);
            return { success: false, error: error.message };
        }
    }
};

// Fix the voucher redemption call in your component
const handleRedeemVoucher = async (voucherId) => {
    try {
        console.log('🎫 Redeeming voucher:', voucherId);

        // Make sure user is authenticated
        if (!user?.uid) {
            Alert.alert('Authentication Error', 'Please sign in to redeem vouchers.');
            return;
        }

        // Call voucher service directly (not reward service)
        const result = await voucherService.redeemVoucher(user.uid, voucherId);

        if (result.success) {
            Alert.alert(
                '🎉 Voucher Redeemed!',
                'Your voucher has been successfully redeemed. Show the QR code to claim your reward!',
                [{ text: 'Great!', style: 'default' }]
            );

            // Refresh vouchers list
            loadUserVouchers();
        } else {
            Alert.alert(
                '❌ Redemption Failed',
                result.error || 'Could not redeem voucher. Please try again.',
                [{ text: 'OK', style: 'default' }]
            );
        }

    } catch (error) {
        console.error('Voucher redemption error:', error);
        Alert.alert('Error', 'Something went wrong. Please check your connection and try again.');
    }
};
