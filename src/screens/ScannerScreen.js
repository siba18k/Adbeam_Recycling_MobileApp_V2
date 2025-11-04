import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Animated,
    Vibration,
    Alert,
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    Modal,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { addToQueue } from '../services/offlineQueue';
import { recordScanWithNotifications, MATERIAL_TYPES, getBarcodeHistory } from '../services/database';
import { validateScanLocation } from '../services/locationService';
import NetInfo from '@react-native-community/netinfo';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [showMaterialSelector, setShowMaterialSelector] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState(null);
    const [scanCount, setScanCount] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const { user, refreshUserProfile, userProfile } = useAuth();

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scanAnimation = useRef(new Animated.Value(0)).current;
    const materialModalAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        startAnimations();
        return () => {
            scanAnimation.stopAnimation();
            pulseAnim.stopAnimation();
        };
    }, []);

    useEffect(() => {
        if (!scanned && !isProcessing && !showMaterialSelector) {
            startScanAnimation();
        }
    }, [scanned, isProcessing, showMaterialSelector]);

    // Reset scanner when returning from Dashboard
    useFocusEffect(
        useCallback(() => {
            if (scanned && !showMaterialSelector && !isProcessing) {
                console.log('🔄 Resetting stuck scanner on focus');
                setScanned(false);
                setScannedBarcode(null);
                setTimeout(() => {
                    startScanAnimation();
                }, 300);
            }
            return () => {};
        }, [scanned, showMaterialSelector, isProcessing])
    );

    const startAnimations = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
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
    };

    const startScanAnimation = () => {
        scanAnimation.setValue(0);
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnimation, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnimation, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const playHapticFeedback = async (type = 'light') => {
        try {
            if (Platform.OS === 'ios') {
                switch (type) {
                    case 'success':
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        break;
                    case 'error':
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        break;
                    case 'light':
                    default:
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        break;
                }
            } else {
                switch (type) {
                    case 'success':
                        Vibration.vibrate([0, 100, 50, 100]);
                        break;
                    case 'error':
                        Vibration.vibrate([0, 300]);
                        break;
                    case 'light':
                    default:
                        Vibration.vibrate(50);
                        break;
                }
            }
        } catch (error) {
            console.log('Haptic feedback error:', error);
        }
    };

    // 🚨 FIXED: Check for duplicates IMMEDIATELY when barcode is scanned
    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || isProcessing || showMaterialSelector) return;

        console.log('📷 Barcode scanned:', { type, data });

        // Stop scan animation and set processing state
        scanAnimation.stopAnimation();
        setScanned(true);
        setIsProcessing(true);
        await playHapticFeedback('light');

        try {
            const cleanBarcode = data.trim();

            // 🚨 IMMEDIATE DUPLICATE CHECK - BEFORE material selection
            console.log('🔍 IMMEDIATE CHECK: Verifying barcode has not been scanned before...');
            const barcodeRef = ref(database, `scannedBarcodes/${cleanBarcode}`);
            const barcodeSnapshot = await get(barcodeRef);

            if (barcodeSnapshot.exists()) {
                const existingBarcodeData = barcodeSnapshot.val();
                console.log('❌ DUPLICATE DETECTED IMMEDIATELY:', existingBarcodeData);

                // Record duplicate attempt
                try {
                    const barcodeRef = ref(database, `scannedBarcodes/${cleanBarcode}`);
                    await update(barcodeRef, {
                        scanCount: (existingBarcodeData.scanCount || 1) + 1,
                        lastAttemptedBy: user.uid,
                        lastAttemptedAt: new Date().toISOString(),
                        duplicateAttempts: (existingBarcodeData.duplicateAttempts || 0) + 1
                    });
                } catch (updateError) {
                    console.log('Failed to record duplicate attempt:', updateError);
                }

                // 🚨 SHOW DUPLICATE ERROR IMMEDIATELY
                await playHapticFeedback('error');

                const scannedDate = existingBarcodeData.timestamp ?
                    new Date(existingBarcodeData.timestamp).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Unknown date';

                const isScannedByCurrentUser = existingBarcodeData.firstScannedBy === user.uid;

                Alert.alert(
                    '🚫 Item Already Recycled',
                    `This physical item has already been recycled and is permanently in our system.\n\n` +
                    `📋 Barcode: ${cleanBarcode}\n` +
                    `📦 Original Material: ${existingBarcodeData.materialType || 'Unknown'}\n` +
                    `📅 First Recycled: ${scannedDate}\n` +
                    `👤 Recycled By: ${isScannedByCurrentUser ? 'You previously' : 'Another user'}\n` +
                    `🔢 Total Attempts: ${(existingBarcodeData.scanCount || 1) + 1}\n\n` +
                    `🛡️ Each physical item can only be recycled ONCE EVER, regardless of material type selection.\n\n` +
                    `🌱 Please find a different recyclable item to continue earning points!`,
                    [
                        {
                            text: 'Scan Different Item',
                            onPress: prepareForNextScan,
                            style: 'default'
                        },
                        {
                            text: 'Back to Dashboard',
                            onPress: () => navigation.navigate('Dashboard'),
                            style: 'cancel'
                        }
                    ]
                );

                setIsProcessing(false);
                return; // Exit early - don't show material selector
            }

            // ✅ BARCODE IS NEW - Allow material selection
            console.log('✅ BARCODE IS NEW - Proceeding to material selection');

            setScannedBarcode({
                barcode: cleanBarcode,
                barcodeType: type,
                timestamp: new Date().toISOString(),
                verified: true
            });

            setIsProcessing(false);
            setShowMaterialSelector(true);

            Animated.spring(materialModalAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }).start();

        } catch (error) {
            console.error('❌ Error during immediate barcode check:', error);
            await playHapticFeedback('error');

            Alert.alert(
                '❌ Scan Verification Failed',
                `Unable to verify if this item has been scanned before.\n\nError: ${error.message}\n\nPlease check your internet connection and try again.`,
                [
                    {
                        text: 'Try Again',
                        onPress: prepareForNextScan,
                        style: 'default'
                    },
                    {
                        text: 'Back to Dashboard',
                        onPress: () => navigation.navigate('Dashboard'),
                        style: 'cancel'
                    }
                ]
            );

            setIsProcessing(false);
        }
    };

    // 🚨 SIMPLIFIED: Material processing (duplicate check already done)
    const processScanWithMaterial = async (materialType) => {
        if (!scannedBarcode || !materialType || isProcessing) return;

        setIsProcessing(true);

        Animated.timing(materialModalAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowMaterialSelector(false);
        });

        try {
            const material = MATERIAL_TYPES[materialType];

            const scanData = {
                barcode: scannedBarcode.barcode,
                barcodeType: scannedBarcode.barcodeType,
                materialType: materialType,
                itemName: `${material.name} Item`,
                brand: 'User Classified',
                points: material.points,
                category: materialType,
                location: null,
                timestamp: scannedBarcode.timestamp,
                scanMode: 'user_classified',
                userSelected: true
            };

            try {
                const locationValidation = await validateScanLocation();
                if (locationValidation.valid) {
                    scanData.location = locationValidation.location;
                }
            } catch (locationError) {
                console.log('Location validation skipped:', locationError.message);
            }

            const netInfo = await NetInfo.fetch();

            if (!netInfo.isConnected) {
                await addToQueue(scanData);

                Alert.alert(
                    '📡 Scan Queued!',
                    `You're offline! Your ${material.name.toLowerCase()} scan (+${material.points} points) is saved and will be processed when you reconnect.\n\n✅ Session scans: ${scanCount + 1}`,
                    [
                        {
                            text: 'Scan Another',
                            onPress: prepareForNextScan,
                            style: 'default'
                        },
                        {
                            text: 'View Dashboard',
                            onPress: () => navigation.navigate('Dashboard'),
                            style: 'cancel'
                        }
                    ]
                );

                setScanCount(prev => prev + 1);
                return;
            }

            // 🚨 FINAL SAFETY CHECK: Double-check barcode before processing
            console.log('🔍 FINAL SAFETY CHECK: Re-verifying barcode before points...');
            const barcodeRef = ref(database, `scannedBarcodes/${scannedBarcode.barcode}`);
            const finalCheck = await get(barcodeRef);

            if (finalCheck.exists()) {
                console.log('❌ RACE CONDITION: Barcode was scanned by someone else during material selection');

                await playHapticFeedback('error');

                Alert.alert(
                    '⚠️ Item Just Got Recycled',
                    `While you were selecting the material type, this item was just recycled by another user!\n\n` +
                    `📋 Barcode: ${scannedBarcode.barcode}\n\n` +
                    `🏃‍♂️ This can happen in busy areas with multiple users.\n\n` +
                    `🌱 Please scan a different item to earn your points!`,
                    [
                        {
                            text: 'Scan Different Item',
                            onPress: prepareForNextScan,
                            style: 'default'
                        },
                        {
                            text: 'Back to Dashboard',
                            onPress: () => navigation.navigate('Dashboard'),
                            style: 'cancel'
                        }
                    ]
                );

                return;
            }

            // ✅ SAFE TO PROCESS - Barcode is still unique
            const result = await recordScanWithNotifications(user.uid, scanData);

            if (result.success) {
                setScanCount(prev => prev + 1);
                await refreshUserProfile();
                await playHapticFeedback('success');

                const alertTitle = '🎉 Recycling Success!';
                const achievementBonus = result.newAchievements && result.newAchievements.length > 0 ?
                    `\n\n🏆 Achievement Unlocked: "${result.newAchievements[0].name}"!\n🌟 Bonus: +${result.newAchievements[0].points} points` : '';

                const alertMessage =
                    `Great job recycling! Here's your impact:\n\n` +
                    `📦 Material: ${material.name}\n` +
                    `⭐ Points Earned: +${result.points}\n` +
                    `💰 Total Points: ${result.newTotalPoints}\n` +
                    `📈 Current Level: ${result.newLevel}${result.leveledUp ? ' (LEVEL UP! 🚀)' : ''}\n` +
                    `♻️ Items Recycled: ${result.newTotalScans}` +
                    (result.currentStreak > 1 ? `\n🔥 Daily Streak: ${result.currentStreak} days` : '') +
                    achievementBonus +
                    `\n\n🔒 This item is now permanently locked in our system!`;

                Alert.alert(
                    alertTitle,
                    alertMessage,
                    [
                        {
                            text: 'Scan Another Item',
                            onPress: prepareForNextScan,
                            style: 'default'
                        },
                        {
                            text: 'Done - View Dashboard',
                            onPress: () => navigation.navigate('Dashboard'),
                            style: 'cancel'
                        }
                    ]
                );

            } else if (result.duplicate) {
                await playHapticFeedback('error');

                const duplicateInfo = result.duplicateInfo;
                const scannedDate = duplicateInfo?.firstScannedAt ?
                    new Date(duplicateInfo.firstScannedAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Unknown date';

                const isScannedByCurrentUser = duplicateInfo?.firstScannedBy === user.uid;

                Alert.alert(
                    '🚫 Item Already Recycled',
                    `This physical item has already been recycled and is permanently in our system.\n\n` +
                    `📋 Barcode: ${scannedBarcode.barcode}\n` +
                    `📦 Original Material: ${duplicateInfo?.materialType || 'Unknown'}\n` +
                    `📅 First Recycled: ${scannedDate}\n` +
                    `👤 Recycled By: ${isScannedByCurrentUser ? 'You previously' : 'Another user'}\n` +
                    `🔢 Total Attempts: ${duplicateInfo?.scanCount || 1}\n\n` +
                    `🛡️ Each physical item can only be recycled ONCE EVER, regardless of material type.\n\n` +
                    `🌱 Please find a different recyclable item to continue earning points!`,
                    [
                        {
                            text: 'Scan Different Item',
                            onPress: prepareForNextScan,
                            style: 'default'
                        },
                        {
                            text: 'Back to Dashboard',
                            onPress: () => navigation.navigate('Dashboard'),
                            style: 'cancel'
                        }
                    ]
                );

            } else {
                throw new Error(result.error || 'Failed to process scan');
            }

        } catch (error) {
            console.error('❌ Scan processing error:', error);
            await playHapticFeedback('error');

            Alert.alert(
                '❌ Scan Error',
                `Failed to process your ${MATERIAL_TYPES[materialType]?.name || 'item'} scan.\n\nError: ${error.message}\n\nPlease try scanning again or contact support if the problem persists.`,
                [
                    {
                        text: 'Try Again',
                        onPress: prepareForNextScan,
                        style: 'default'
                    },
                    {
                        text: 'Back to Dashboard',
                        onPress: () => navigation.navigate('Dashboard'),
                        style: 'cancel'
                    }
                ]
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const prepareForNextScan = () => {
        console.log('🔄 Preparing scanner for next scan...');

        setScanned(false);
        setIsProcessing(false);
        setShowMaterialSelector(false);
        setScannedBarcode(null);

        materialModalAnim.setValue(0);

        setTimeout(() => {
            startScanAnimation();
        }, 300);
    };

    const cancelScan = () => {
        Animated.timing(materialModalAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            prepareForNextScan();
        });
    };

    const scanLineTranslateY = scanAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 120],
    });

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.loadingGradient}>
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text style={styles.loadingText}>Initializing AdBeam Scanner...</Text>
                </LinearGradient>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.permissionGradient}>
                    <Animated.View style={[styles.permissionContent, { opacity: fadeAnim }]}>
                        <View style={styles.permissionIconContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                style={styles.permissionIconCircle}
                            >
                                <Ionicons name="camera-outline" size={60} color="white" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                        <Text style={styles.permissionText}>
                            AdBeam needs camera access to scan recyclable items and help you earn points for protecting the environment.
                        </Text>
                        <TouchableOpacity
                            style={styles.permissionButton}
                            onPress={requestPermission}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#fff', '#f0fdf4']}
                                style={styles.permissionButtonGradient}
                            >
                                <Text style={styles.permissionButtonText}>Enable Camera</Text>
                                <Ionicons name="camera" size={20} color="#22c55e" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.cameraContainer}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: [
                        'ean13', 'ean8', 'upc_a', 'upc_e',
                        'code39', 'code128', 'qr', 'pdf417',
                        'codabar', 'itf14', 'aztec', 'datamatrix'
                    ],
                }}
                enableTorch={flashOn}
            >
                <View style={styles.cameraOverlay}>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.gradientOverlay}
                    >
                        <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
                            <SafeAreaView>
                                <View style={styles.statusBar}>
                                    <View style={styles.scannerInfo}>
                                        <Ionicons name="scan-outline" size={20} color="white" />
                                        <Text style={styles.scannerTitle}>AdBeam Scanner</Text>
                                    </View>

                                    <View style={styles.userStatus}>
                                        <Ionicons name="star" size={16} color="#fbbf24" />
                                        <Text style={styles.userPoints}>{userProfile?.points || 0}</Text>
                                        <Text style={styles.levelBadge}>{userProfile?.level || 1}</Text>
                                            </View>
                                            </View>
                                            </SafeAreaView>
                                            </Animated.View>

                                            <View style={styles.centerSection}>
                                            <Animated.View style={[styles.scanningArea, { opacity: fadeAnim }]}>
                                                <Text style={styles.instructionText}>
                                                    {isProcessing
                                                        ? '🔍 Checking item history...'
                                                        : '📱 Point camera at any barcode or QR code'
                                                    }
                                                </Text>

                                                <Animated.View
                                                    style={[
                                                        styles.scanFrame,
                                                        { transform: [{ scale: pulseAnim }] }
                                                    ]}
                                                >
                                                    <View style={[styles.corner, styles.topLeft]} />
                                                    <View style={[styles.corner, styles.topRight]} />
                                                    <View style={[styles.corner, styles.bottomLeft]} />
                                                    <View style={[styles.corner, styles.bottomRight]} />

                                                    {!scanned && !isProcessing && (
                                                        <Animated.View
                                                            style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
                                                        >
                                                            <LinearGradient
                                                                colors={['transparent', '#22c55e', '#22c55eff', '#22c55e', 'transparent']}
                                                                start={{ x: 0, y: 0 }}
                                                                end={{ x: 1, y: 0 }}
                                                                style={styles.scanLineGradient}
                                                            />
                                                        </Animated.View>
                                                    )}

                                                    {isProcessing && (
                                                        <View style={styles.processingContainer}>
                                                            <ActivityIndicator size="large" color="#22c55e" />
                                                            <Text style={styles.processingText}>
                                                                {scannedBarcode ? 'Processing...' : 'Verifying...'}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {!scanned && !isProcessing && (
                                                        <View style={styles.targetDot} />
                                                    )}
                                                </Animated.View>

                                                <Text style={styles.helpText}>
                                                    🔍 Each item is checked for duplicates before material selection
                                                </Text>

                                                {scanCount > 0 && (
                                                    <Animated.View style={[styles.scanCounter, { opacity: fadeAnim }]}>
                                                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                                                        <Text style={styles.scanCountText}>
                                                            {scanCount} item{scanCount !== 1 ? 's' : ''} scanned this session
                                                        </Text>
                                                    </Animated.View>
                                                )}
                                            </Animated.View>
                                    </View>

                                    <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
                                        <SafeAreaView>
                                            <View style={styles.controlsContainer}>
                                                <TouchableOpacity
                                                    style={styles.flashButton}
                                                    onPress={() => {
                                                        setFlashOn(!flashOn);
                                                        playHapticFeedback('light');
                                                    }}
                                                    activeOpacity={0.8}
                                                >
                                                    <LinearGradient
                                                        colors={flashOn ? ['#fbbf24', '#f59e0b'] : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                                                        style={styles.controlButtonGradient}
                                                    >
                                                        <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={24} color="white" />
                                                    </LinearGradient>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.soundButton}
                                                    onPress={() => {
                                                        setSoundEnabled(!soundEnabled);
                                                        playHapticFeedback('light');
                                                    }}
                                                    activeOpacity={0.8}
                                                >
                                                    <LinearGradient
                                                        colors={soundEnabled ? ['#22c55e', '#16a34a'] : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                                                        style={styles.controlButtonGradient}
                                                    >
                                                        <Ionicons
                                                            name={soundEnabled ? 'volume-high' : 'volume-mute'}
                                                            size={20}
                                                            color="white"
                                                        />
                                                    </LinearGradient>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.backButton}
                                                    onPress={() => navigation.navigate('Dashboard')}
                                                    activeOpacity={0.8}
                                                >
                                                    <LinearGradient
                                                        colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                                                        style={styles.backButtonGradient}
                                                    >
                                                        <Ionicons name="home" size={20} color="white" />
                                                        <Text style={styles.backButtonText}>Dashboard</Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>
                                        </SafeAreaView>
                                    </Animated.View>
                    </LinearGradient>
                </View>
            </CameraView>

            <Modal
                visible={showMaterialSelector}
                transparent={true}
                animationType="none"
                onRequestClose={cancelScan}
            >
                <View style={styles.materialModalOverlay}>
                    <Animated.View
                        style={[
                            styles.materialModal,
                            {
                                transform: [{
                                    translateY: materialModalAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [height, 0],
                                    })
                                }]
                            }
                        ]}
                    >
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <View style={styles.successCheckIcon}>
                                <Ionicons name="shield-checkmark" size={52} color="#22c55e" />
                            </View>

                            <Text style={styles.modalTitle}>Item Verified ✅</Text>
                            <Text style={styles.modalSubtitle}>
                                This item is new to our system! What material type is it?
                            </Text>

                            {scannedBarcode && (
                                <View style={styles.barcodeInfo}>
                                    <Text style={styles.barcodeLabel}>Verified Barcode:</Text>
                                    <Text style={styles.barcodeValue}>
                                        {scannedBarcode.barcode}
                                    </Text>
                                    <View style={styles.verificationBadge}>
                                        <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                                        <Text style={styles.verificationText}>Never scanned before</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.materialOptionsWrapper}>
                            <Text style={styles.selectMaterialTitle}>Select Material Type:</Text>

                            <ScrollView
                                style={styles.materialScrollContainer}
                                contentContainerStyle={styles.materialScrollContent}
                                showsVerticalScrollIndicator={true}
                                indicatorStyle="default"
                                bounces={true}
                            >
                                {Object.entries(MATERIAL_TYPES).map(([key, material], index) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.materialOptionButton,
                                            {
                                                marginBottom: index === Object.keys(MATERIAL_TYPES).length - 1 ? 0 : 16
                                            }
                                        ]}
                                        onPress={() => processScanWithMaterial(key)}
                                        activeOpacity={0.85}
                                        disabled={isProcessing}
                                    >
                                        <LinearGradient
                                            colors={[material.color, material.color + 'e6']}
                                            style={styles.materialOptionGradient}
                                        >
                                            <View style={styles.materialOptionIcon}>
                                                <Ionicons
                                                    name={material.icon}
                                                    size={30}
                                                    color="white"
                                                />
                                            </View>

                                            <View style={styles.materialOptionInfo}>
                                                <Text style={styles.materialOptionTitle}>
                                                    {material.name}
                                                </Text>
                                                <Text style={styles.materialOptionDesc}>
                                                    {material.description}
                                                </Text>
                                                <View style={styles.pointsBadge}>
                                                    <Ionicons name="star" size={14} color="#fbbf24" />
                                                    <Text style={styles.pointsBadgeText}>
                                                        +{material.points} points
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.selectArrow}>
                                                {isProcessing ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
                                                )}
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelScanButton}
                                onPress={cancelScan}
                                activeOpacity={0.8}
                                disabled={isProcessing}
                            >
                                <View style={styles.cancelScanContent}>
                                    <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
                                    <Text style={styles.cancelScanText}>Cancel & Scan Different Item</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
);
}

const styles = StyleSheet.create({
    cameraContainer: {
        flex: 1,
            backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    },
    gradientOverlay: {
        flex: 1,
    },

    loadingContainer: {
        flex: 1,
    },
    loadingGradient: {
        flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
            color: '#22c55e',
            fontWeight: '600',
            marginTop: 16,
            textAlign: 'center',
    },

    permissionContainer: {
        flex: 1,
    },
    permissionGradient: {
        flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
    },
    permissionContent: {
        alignItems: 'center',
            paddingHorizontal: 40,
            maxWidth: width * 0.85,
    },
    permissionIconContainer: {
        marginBottom: 32,
    },
    permissionIconCircle: {
        width: 120,
            height: 120,
            borderRadius: 60,
            justifyContent: 'center',
            alignItems: 'center',
    },
    permissionTitle: {
        fontSize: 26,
            fontWeight: '700',
            color: 'white',
            marginBottom: 16,
            textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
            textAlign: 'center',
            marginBottom: 40,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 24,
    },
    permissionButton: {
        borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
    },
    permissionButtonGradient: {
        flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 32,
            paddingVertical: 18,
            gap: 10,
    },
    permissionButtonText: {
        color: '#22c55e',
            fontSize: 18,
            fontWeight: '700',
    },

    topSection: {
        paddingTop: 16,
            paddingHorizontal: 20,
            paddingBottom: 16,
            zIndex: 10,
    },
    statusBar: {
        flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 16,
    },
    scannerInfo: {
        flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
    },
    scannerTitle: {
        color: 'white',
            fontSize: 16,
            fontWeight: '600',
    },
    userStatus: {
        flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
    },
    userPoints: {
        color: 'white',
            fontSize: 16,
            fontWeight: '700',
    },
    levelBadge: {
        color: 'white',
            fontSize: 13,
            fontWeight: '600',
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
    },

    centerSection: {
        flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
    },
    scanningArea: {
        alignItems: 'center',
            width: '100%',
    },
    instructionText: {
        color: 'white',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 40,
            backgroundColor: 'rgba(34, 197, 94, 0.95)',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
    },

    scanFrame: {
        width: 280,
            height: 280,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            marginBottom: 32,
    },
    corner: {
        position: 'absolute',
            width: 40,
            height: 40,
            borderWidth: 4,
            borderColor: '#22c55e',
    },
    topLeft: {
        top: 0,
            left: 0,
            borderRightWidth: 0,
            borderBottomWidth: 0,
            borderTopLeftRadius: 12,
    },
    topRight: {
        top: 0,
            right: 0,
            borderLeftWidth: 0,
            borderBottomWidth: 0,
            borderTopRightRadius: 12,
    },
    bottomLeft: {
        bottom: 0,
            left: 0,
            borderRightWidth: 0,
            borderTopWidth: 0,
            borderBottomLeftRadius: 12,
    },
    bottomRight: {
        bottom: 0,
            right: 0,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            borderBottomRightRadius: 12,
    },
    scanLine: {
        width: '85%',
            height: 3,
    },
    scanLineGradient: {
        flex: 1,
            borderRadius: 2,
    },
    processingContainer: {
        justifyContent: 'center',
            alignItems: 'center',
    },
    processingText: {
        color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginTop: 16,
    },
    targetDot: {
        width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#22c55e',
            shadowColor: '#22c55e',
            shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 8,
    },
    helpText: {
        color: 'rgba(255,255,255,0.9)',
            fontSize: 14,
            textAlign: 'center',
            fontWeight: '500',
            backgroundColor: 'rgba(0,0,0,0.4)',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 16,
            marginBottom: 16,
    },
    scanCounter: {
        flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(34, 197, 94, 0.3)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            gap: 6,
    },
    scanCountText: {
        color: 'white',
            fontSize: 13,
            fontWeight: '600',
    },

    bottomSection: {
        paddingHorizontal: 20,
            paddingBottom: 16,
            zIndex: 10,
    },
    controlsContainer: {
        flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
    },
    flashButton: {
        borderRadius: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
    },
    soundButton: {
        borderRadius: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
    },
    controlButtonGradient: {
        width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
    },
    backButton: {
        flex: 1,
            marginLeft: 8,
            borderRadius: 18,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 6,
    },
    backButtonGradient: {
        flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 18,
            paddingHorizontal: 24,
            gap: 10,
    },
    backButtonText: {
        color: 'white',
            fontSize: 16,
            fontWeight: '600',
    },

    materialModalOverlay: {
        flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'flex-end',
    },
    materialModal: {
        backgroundColor: 'white',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: height * 0.85,
            paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    modalHandle: {
        width: 40,
            height: 4,
            backgroundColor: '#d1d5db',
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 12,
            marginBottom: 8,
    },

    modalHeader: {
        alignItems: 'center',
            paddingTop: 24,
            paddingHorizontal: 24,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#f3f4f6',
    },
    successCheckIcon: {
        backgroundColor: '#dcfce7',
            borderRadius: 40,
            padding: 12,
            marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: 8,
            textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 22,
    },
    barcodeInfo: {
        backgroundColor: '#f0fdf4',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#22c55e',
            alignItems: 'center',
    },
    barcodeLabel: {
        color: '#059669',
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 4,
    },
    barcodeValue: {
        color: '#1f2937',
            fontSize: 14,
            fontWeight: '700',
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            marginBottom: 8,
    },
    verificationBadge: {
        flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#dcfce7',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            gap: 4,
    },
    verificationText: {
        color: '#059669',
            fontSize: 11,
            fontWeight: '600',
    },

    materialOptionsWrapper: {
        paddingHorizontal: 24,
            paddingTop: 16,
    },
    selectMaterialTitle: {
        fontSize: 18,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 16,
    },
    materialScrollContainer: {
        maxHeight: height * 0.4,
    },
    materialScrollContent: {
        paddingBottom: 16,
    },
    materialOptionButton: {
        borderRadius: 18,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
    },
    materialOptionGradient: {
        flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            minHeight: 85,
    },
    materialOptionIcon: {
        width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'rgba(255,255,255,0.25)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 20,
    },
    materialOptionInfo: {
        flex: 1,
            justifyContent: 'center',
    },
    materialOptionTitle: {
        fontSize: 18,
            fontWeight: '700',
            color: 'white',
            marginBottom: 6,
    },
    materialOptionDesc: {
        fontSize: 14,
            color: 'rgba(255,255,255,0.85)',
            marginBottom: 10,
            lineHeight: 20,
    },
    pointsBadge: {
        flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.25)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            alignSelf: 'flex-start',
            gap: 4,
    },
    pointsBadgeText: {
        color: 'white',
            fontSize: 13,
            fontWeight: '700',
    },
    selectArrow: {
        marginLeft: 16,
            opacity: 0.9,
    },

    modalFooter: {
        paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 8,
            borderTopWidth: 1,
            borderTopColor: '#f3f4f6',
    },
    cancelScanButton: {
        backgroundColor: '#f9fafb',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e5e7eb',
    },
    cancelScanContent: {
        flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            paddingHorizontal: 24,
            gap: 8,
    },
    cancelScanText: {
        color: '#6b7280',
            fontSize: 16,
            fontWeight: '600',
    },
});
