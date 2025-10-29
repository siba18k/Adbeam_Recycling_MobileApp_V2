import React, { useState } from 'react';
import { sendVoucherRedeemedNotification } from '../services/notificationService';
import {
    View,
    StyleSheet,
    Alert,
    SafeAreaView,
    TouchableOpacity,
    Vibration
} from 'react-native';
import {
    Text,
    Card,
    ActivityIndicator
} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { redeemVoucherByStaff } from '../services/database';
import { sendNotification } from '../services/notificationService';
import { colors, gradients } from '../theme/colors';

export default function StaffScannerScreen({ navigation }) {
    const { user } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);

    const handleVoucherScan = async ({ data }) => {
        if (scanned || isProcessing) return;

        setScanned(true);
        setIsProcessing(true);
        Vibration.vibrate(100);

        try {
            console.log('🔄 Processing voucher code:', data);
            const result = await redeemVoucherByStaff(
                data,
                user.uid,
                userProfile?.displayName || 'Staff Member'
            );

            if (result.success) {
                // Send notification to user using the proper function
                try {
                    await sendVoucherRedeemedNotification(
                        result.userId,
                        result.reward,
                        userProfile?.displayName || 'Staff Member',
                        result.pointsCost
                    );
                    console.log('✅ User notification sent');
                } catch (notificationError) {
                    console.log('⚠️ Notification failed (non-critical):', notificationError);
                }

                setLastScanResult({
                    success: true,
                    reward: result.reward,
                    studentName: result.studentName || 'Student',
                    studentEmail: result.studentEmail,
                    code: data,
                    pointsCost: result.pointsCost
                });

                setScanCount(prev => prev + 1);
                Vibration.vibrate([0, 200, 100, 200]); // Success vibration

                Alert.alert(
                    '✅ Voucher Redeemed Successfully!',
                    `Student: ${result.studentName || 'Student'}\nReward: ${result.reward}\nPoints Used: ${result.pointsCost}\nCode: ${data}\n\n✅ Student has been notified`,
                    [
                        {
                            text: 'Scan Another',
                            onPress: () => resetScanner()
                        },
                        { text: 'Back to Dashboard', onPress: () => navigation.goBack() }
                    ]
                );
            } else {
                setLastScanResult({
                    success: false,
                    error: result.error,
                    code: data
                });

                Vibration.vibrate([0, 500]); // Error vibration

                Alert.alert(
                    '❌ Redemption Failed',
                    result.error,
                    [
                        { text: 'Scan Another', onPress: () => resetScanner() }
                    ]
                );
            }
        } catch (error) {
            console.error('Voucher scan error:', error);
            setLastScanResult({
                success: false,
                error: 'Failed to process voucher',
                code: data
            });

            Alert.alert(
                'Error',
                'Failed to process voucher. Please try again.',
                [
                    { text: 'Try Again', onPress: () => resetScanner() }
                ]
            );
        } finally {
            setIsProcessing(false);
        }
    };

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.main} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={gradients.backgroundPrimary} style={styles.gradient}>
                    <View style={styles.permissionContent}>
                        <View style={styles.permissionIcon}>
                            <Ionicons name="qr-code-outline" size={80} color="white" />
                        </View>
                        <Text style={styles.permissionTitle}>Staff Voucher Scanner</Text>
                        <Text style={styles.permissionSubtitle}>
                            Camera access needed to scan student voucher QR codes
                        </Text>
                        <TouchableOpacity
                            style={styles.permissionButton}
                            onPress={requestPermission}
                        >
                            <LinearGradient
                                colors={gradients.success}
                                style={styles.permissionButtonGradient}
                            >
                                <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleVoucherScan}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                enableTorch={flashOn}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.overlay}
                >
                    {/* Top Section - Instructions */}
                    <View style={styles.topSection}>
                        <LinearGradient
                            colors={[colors.accent.main, colors.accent.light]}
                            style={styles.instructionCard}
                        >
                            <View style={styles.instructionContent}>
                                <Ionicons name="scan-outline" size={24} color="white" />
                                <Text style={styles.instructionTitle}>Staff Voucher Scanner</Text>
                                <Text style={styles.instructionText}>
                                    Point camera at student's voucher QR code
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Center Section - Scanning Frame */}
                    <View style={styles.centerSection}>
                        <View style={styles.scanFrame}>
                            {/* Corner indicators */}
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />

                            {/* Processing indicator */}
                            {isProcessing ? (
                                <View style={styles.processingContainer}>
                                    <ActivityIndicator size="large" color={colors.accent.main} />
                                    <Text style={styles.processingText}>Processing voucher...</Text>
                                </View>
                            ) : (
                                <View style={styles.scanPrompt}>
                                    <Ionicons name="qr-code" size={60} color={colors.accent.main} />
                                    <Text style={styles.scanPromptText}>Ready to scan</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Bottom Section - Controls */}
                    <View style={styles.bottomSection}>
                        <View style={styles.controlsRow}>
                            <TouchableOpacity
                                style={styles.flashButton}
                                onPress={() => setFlashOn(!flashOn)}
                            >
                                <LinearGradient
                                    colors={flashOn ? gradients.accent : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                                    style={styles.flashButtonGradient}
                                >
                                    <Ionicons
                                        name={flashOn ? 'flash' : 'flash-off'}
                                        size={24}
                                        color="white"
                                    />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <LinearGradient
                                    colors={gradients.secondary}
                                    style={styles.backButtonGradient}
                                >
                                    <Ionicons name="arrow-back" size={20} color="white" />
                                    <Text style={styles.backButtonText}>Back to Admin</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Last Scan Result */}
                        {lastScanResult && (
                            <Card style={styles.resultCard}>
                                <LinearGradient
                                    colors={lastScanResult.success ? gradients.success : ['#ef4444', '#dc2626']}
                                    style={styles.resultGradient}
                                >
                                    <View style={styles.resultContent}>
                                        <Ionicons
                                            name={lastScanResult.success ? 'checkmark-circle' : 'close-circle'}
                                            size={20}
                                            color="white"
                                        />
                                        <Text style={styles.resultText}>
                                            {lastScanResult.success
                                                ? `✅ ${lastScanResult.reward} redeemed!`
                                                : `❌ ${lastScanResult.error}`
                                            }
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </Card>
                        )}
                    </View>
                </LinearGradient>
            </CameraView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionIcon: {
        marginBottom: 24,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 12,
        textAlign: 'center',
    },
    permissionSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    permissionButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    permissionButtonGradient: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    topSection: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    instructionCard: {
        borderRadius: 16,
        padding: 16,
    },
    instructionContent: {
        alignItems: 'center',
    },
    instructionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginTop: 12,
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    centerSection: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: colors.accent.main,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    processingContainer: {
        alignItems: 'center',
    },
    processingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    scanPrompt: {
        alignItems: 'center',
    },
    scanPromptText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 12,
    },
    bottomSection: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    flashButton: {
        borderRadius: 25,
    },
    flashButtonGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    backButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    resultCard: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    resultGradient: {
        padding: 12,
    },
    resultContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resultText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
});
