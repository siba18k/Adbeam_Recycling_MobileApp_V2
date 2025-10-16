import React, { useState } from 'react';
import { View, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { redeemVoucher } from '../services/database';
import { sendNotification } from '../services/notificationService';
import { colors, gradients } from '../theme/colors';

export default function VoucherScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    const getMaterialIcon = (materialType) => {
        const type = materialType.toLowerCase();
        if (type.includes('plastic')) return 'water-outline';
        if (type.includes('glass')) return 'wine-outline';
        if (type.includes('aluminum') || type.includes('can')) return 'nutrition-outline';
        if (type.includes('paper')) return 'newspaper-outline';
        return 'leaf-outline';
    };

    const handleVoucherScan = async ({ data }) => {
        if (scanned) return;

        setScanned(true);

        try {
            const result = await redeemVoucher(data, 'campus-staff');

            if (result.success) {
                // Send notification to user
                await sendNotification(result.userId, {
                    title: 'Voucher Redeemed! 🎉',
                    body: `Your "${result.reward}" voucher has been successfully redeemed.`
                });

                Alert.alert(
                    'Voucher Redeemed Successfully! ✅',
                    `Reward: ${result.reward}\n\nThe user has been notified of the redemption.`,
                    [
                        { text: 'Scan Another', onPress: () => setScanned(false) },
                        { text: 'Done', onPress: () => {} }
                    ]
                );
            } else {
                Alert.alert(
                    'Redemption Failed ❌',
                    result.error,
                    [
                        { text: 'Scan Another', onPress: () => setScanned(false) }
                    ]
                );
            }
        } catch (error) {
            console.error('Voucher scan error:', error);
            Alert.alert(
                'Error',
                'Failed to process voucher',
                [
                    { text: 'Try Again', onPress: () => setScanned(false) }
                ]
            );
        }
    };

    if (!permission?.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={gradients.backgroundPrimary} style={styles.gradient}>
                    <View style={styles.permissionContent}>
                        <Ionicons name="qr-code" size={80} color="white" />
                        <Text style={styles.title}>Staff Voucher Scanner</Text>
                        <Text style={styles.subtitle}>
                            Camera access needed to scan student vouchers
                        </Text>
                        <Button mode="contained" onPress={requestPermission}>
                            Grant Camera Permission
                        </Button>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={handleVoucherScan}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            >
                <View style={styles.overlay}>
                    <Text style={styles.scanInstruction}>
                        Scan Student Voucher QR Code
                    </Text>
                </View>
            </CameraView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    permissionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginTop: 20,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 30,
    },
    camera: { flex: 1 },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanInstruction: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        backgroundColor: 'rgba(5, 150, 105, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
});
