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
    AppState,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { addToQueue } from '../services/offlineQueue';
import { recordScanWithNotifications, MATERIAL_TYPES } from '../services/database';
import { validateScanLocation } from '../services/locationService';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();

    // Core scanner states
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [showMaterialSelector, setShowMaterialSelector] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState(null);
    const [scanCount, setScanCount] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Camera lifecycle management
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [cameraKey, setCameraKey] = useState(0);
    const [isScreenFocused, setIsScreenFocused] = useState(true);
    const [appState, setAppState] = useState(AppState.currentState);
    const [scannerReady, setScannerReady] = useState(false);

    const { user, refreshUserProfile, userProfile } = useAuth();

    // Animation and timer refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scanAnimation = useRef(new Animated.Value(0)).current;
    const materialModalAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const resetTimeoutRef = useRef(null);
    const animationCleanupRef = useRef([]);

    // BULLETPROOF: Multiple reset mechanisms
    useFocusEffect(
        useCallback(() => {
            console.log('📱 Scanner screen focused - initiating full reset');
            setIsScreenFocused(true);

            // Force camera reset with new key
            setCameraKey(prev => prev + 1);

            // Complete state reset
            hardResetScanner();

            // Initialize scanner after short delay
            const initTimeout = setTimeout(() => {
                initializeScanner();
            }, 500);

            return () => {
                console.log('📱 Scanner screen unfocused - cleaning up');
                setIsScreenFocused(false);
                setScannerReady(false);
                cleanupAnimations();

                if (initTimeout) {
                    clearTimeout(initTimeout);
                }
            };
        }, [])
    );

    // App state change handler
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            console.log('📱 App state changed:', appState, '→', nextAppState);
            setAppState(nextAppState);

            if (nextAppState === 'active' && isScreenFocused) {
                // App became active - reset camera
                setTimeout(() => {
                    forceResetCamera();
                }, 300);
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                // App went to background - pause scanner
                setScannerReady(false);
                cleanupAnimations();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [isScreenFocused, appState]);

    // Camera activation effect
    useEffect(() => {
        if (isScreenFocused && appState === 'active') {
            const activationTimeout = setTimeout(() => {
                setIsCameraActive(true);
                setScannerReady(true);
                initializeScanner();
            }, 200);

            return () => {
                if (activationTimeout) {
                    clearTimeout(activationTimeout);
                }
            };
        } else {
            setIsCameraActive(false);
            setScannerReady(false);
        }
    }, [isScreenFocused, appState]);

    // Animation restart effect
    useEffect(() => {
        if (scannerReady && !scanned && !isProcessing && !showMaterialSelector) {
            startScanAnimation();
        } else {
            stopScanAnimation();
        }
    }, [scannerReady, scanned, isProcessing, showMaterialSelector]);

    // BULLETPROOF: Hard reset function
    const hardResetScanner = useCallback(() => {
        console.log('🔄 Hard reset scanner - clearing all states');

        // Clear all timeouts
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }

        // Reset all scanner states
        setScanned(false);
        setIsProcessing(false);
        setShowMaterialSelector(false);
        setScannedBarcode(null);
        setIsCameraActive(false);
        setScannerReady(false);

        // Reset animation values
        materialModalAnim.setValue(0);
        fadeAnim.setValue(0);
        scanAnimation.setValue(0);
        pulseAnim.setValue(1);

        // Clean up existing animations
        cleanupAnimations();
    }, []);

    // BULLETPROOF: Force camera reset
    const forceResetCamera = useCallback(() => {
        console.log('🎥 Force resetting camera component');

        setIsCameraActive(false);
        setCameraKey(prev => prev + 1);

        setTimeout(() => {
            setIsCameraActive(true);
            hardResetScanner();

            setTimeout(() => {
                initializeScanner();
            }, 200);
        }, 100);
    }, []);

    // Initialize scanner
    const initializeScanner = useCallback(() => {
        if (!isScreenFocused || appState !== 'active') return;

        console.log('🚀 Initializing scanner');
        setScannerReady(false);

        // Start animations
        startAnimations();

        // Mark scanner as ready
        setTimeout(() => {
            setScannerReady(true);
            console.log('✅ Scanner ready for scanning');
        }, 800);
    }, [isScreenFocused, appState]);

    // Cleanup animations
    const cleanupAnimations = useCallback(() => {
        console.log('🧹 Cleaning up animations');

        // Stop all running animations
        try {
            scanAnimation.stopAnimation();
            pulseAnim.stopAnimation();
            fadeAnim.stopAnimation();
            materialModalAnim.stopAnimation();
        } catch (error) {
            console.log('Animation cleanup error:', error);
        }

        // Clear animation cleanup array
        animationCleanupRef.current.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.log('Animation cleanup error:', error);
            }
        });
        animationCleanupRef.current = [];
    }, []);

    const startAnimations = () => {
        console.log('🎬 Starting entrance animations');

        // Reset animation values
        fadeAnim.setValue(0);
        pulseAnim.setValue(1);

        // Entrance animation
        const fadeAnimation = Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        });

        // Pulse animation
        const pulseAnimation = Animated.loop(
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
        );

        fadeAnimation.start();
        pulseAnimation.start();

        // Store cleanup functions
        animationCleanupRef.current.push(
            () => fadeAnimation.stop(),
            () => pulseAnimation.stop()
        );
    };

    const startScanAnimation = () => {
        if (!scannerReady || !isScreenFocused) return;

        console.log('📡 Starting scan line animation');
        scanAnimation.setValue(0);

        const scanLineAnimation = Animated.loop(
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
        );

        scanLineAnimation.start();

        // Store cleanup function
        animationCleanupRef.current.push(() => scanLineAnimation.stop());
    };

    const stopScanAnimation = () => {
        try {
            scanAnimation.stopAnimation();
        } catch (error) {
            console.log('Stop scan animation error:', error);
        }
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

    // BULLETPROOF: Barcode scan handler with multiple safeguards
    const handleBarCodeScanned = async ({ type, data }) => {
        // Multiple guard conditions
        if (!scannerReady || !isScreenFocused || scanned || isProcessing || showMaterialSelector || !isCameraActive) {
            console.log('🚫 Scan blocked - scanner not ready or already processing');
            return;
        }

        console.log('📷 Processing barcode scan:', { type, data, scannerReady, isScreenFocused });

        try {
            // Immediately disable further scanning
            setScannerReady(false);
            stopScanAnimation();

            setScannedBarcode({
                barcode: data,
                barcodeType: type,
                timestamp: new Date().toISOString()
            });

            setScanned(true);
            await playHapticFeedback('light');

            // Show material selector
            setShowMaterialSelector(true);
            Animated.spring(materialModalAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }).start();

        } catch (error) {
            console.error('❌ Error in handleBarCodeScanned:', error);
            // Force reset if scan handling fails
            forceResetCamera();
        }
    };

    // Process scan with selected material
    const processScanWithMaterial = async (materialType) => {
        if (!scannedBarcode || !materialType || isProcessing) return;

        console.log('⚡ Processing scan with material:', materialType);
        setIsProcessing(true);

        // Close material selector smoothly
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

            // Location validation (non-blocking)
            try {
                const locationValidation = await validateScanLocation();
                if (locationValidation?.valid) {
                    scanData.location = locationValidation.location;
                }
            } catch (locationError) {
                console.log('📍 Location validation skipped:', locationError.message);
            }

            // Check network status
            const netInfo = await NetInfo.fetch();

            if (!netInfo.isConnected) {
                console.log('📡 Processing offline scan');
                await addToQueue(scanData);

                Alert.alert(
                    '📡 Scan Queued for Sync!',
                    `You're offline! Your ${material.name.toLowerCase()} scan (+${material.points} points) is saved and will sync when you reconnect.\n\n✅ Session scans: ${scanCount + 1}`,
                    [
                        {
                            text: 'Scan Another Item',
                            onPress: completeScanAndReset,
                            style: 'default'
                        },
                        {
                            text: 'View Dashboard',
                            onPress: () => {
                                setScanCount(prev => prev + 1);
                                navigation.navigate('Dashboard');
                            },
                            style: 'cancel'
                        }
                    ]
                );

                setScanCount(prev => prev + 1);
                return;
            }

            // Process scan online
            console.log('🌐 Processing online scan');
            const result = await recordScanWithNotifications(user.uid, scanData);

            if (result.success) {
                setScanCount(prev => prev + 1);
                await refreshUserProfile();
                await playHapticFeedback('success');

                // Comprehensive success notification
                const alertTitle = '🎉 Recycling Success!';
                const achievementBonus = result.newAchievements && result.newAchievements.length > 0 ?
                    `\n\n🏆 NEW ACHIEVEMENT UNLOCKED!\n"${result.newAchievements[0].name}"\n🌟 Bonus: +${result.newAchievements[0].points} points` : '';

                const levelUpBonus = result.leveledUp ? '\n🚀 LEVEL UP! You reached a new level!' : '';
                const streakBonus = result.currentStreak > 1 ?
                    `\n🔥 Daily streak: ${result.currentStreak} day${result.currentStreak > 1 ? 's' : ''}` : '';

                const alertMessage =
                    `Awesome recycling! You're making a real environmental impact:\n\n` +
                    `📦 Material: ${material.name}\n` +
                    `⭐ Points Earned: +${result.points}\n` +
                    `💰 Your Total Points: ${result.newTotalPoints}\n` +
                    `📈 Current Level: ${result.newLevel}${levelUpBonus}\n` +
                    `♻️ Total Items Recycled: ${result.newTotalScans}${streakBonus}${achievementBonus}` +
                    `\n\n🌍 Keep protecting our planet, one scan at a time!`;

                Alert.alert(
                    alertTitle,
                    alertMessage,
                    [
                        {
                            text: 'Scan Another Item',
                            onPress: completeScanAndReset,
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

                Alert.alert(
                    '♻️ Item Already Recycled',
                    `This barcode was already scanned within the last 24 hours.\n\n📋 Barcode: ${scannedBarcode.barcode}\n📦 Material: ${material.name}\n\n💡 Try scanning a different recyclable item to continue earning points!`,
                    [
                        {
                            text: 'Scan Different Item',
                            onPress: completeScanAndReset,
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
                '❌ Scan Processing Error',
                `Failed to process your ${MATERIAL_TYPES[materialType]?.name || 'item'} scan.\n\n⚠️ Error: ${error.message}\n\nDon't worry, you can try again!`,
                [
                    {
                        text: 'Try Again',
                        onPress: completeScanAndReset,
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

    // BULLETPROOF: Complete scan and reset system
    const completeScanAndReset = useCallback(() => {
        console.log('🔄 Complete scan and reset initiated');

        // Step 1: Clear timeouts
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
        }

        // Step 2: Clean animations
        cleanupAnimations();

        // Step 3: Reset states
        hardResetScanner();

        // Step 4: Force camera reset
        setCameraKey(prev => prev + 1);

        // Step 5: Reinitialize after delay
        resetTimeoutRef.current = setTimeout(() => {
            if (isScreenFocused && appState === 'active') {
                setIsCameraActive(true);
                initializeScanner();
            }
        }, 600);
    }, [isScreenFocused, appState, hardResetScanner, initializeScanner]);

    const cancelScan = () => {
        console.log('❌ Scan cancelled by user');

        Animated.timing(materialModalAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            completeScanAndReset();
        });
    };

    // Animation interpolations
    const scanLineTranslateY = scanAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 120],
    });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('🧹 Component unmounting - final cleanup');
            cleanupAnimations();
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }
        };
    }, []);

    // Loading state
    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.loadingGradient}>
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text style={styles.loadingText}>Initializing AdBeam Scanner...</Text>
                    <Text style={styles.loadingSubtext}>Setting up camera and barcode detection</Text>
                </LinearGradient>
            </View>
        );
    }

    // Permission request screen
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

    // Main Camera Interface
    return (
        <View style={styles.cameraContainer}>
            {/* BULLETPROOF: Camera with lifecycle management */}
            {isCameraActive && (
                <CameraView
                    key={`camera-${cameraKey}-${isScreenFocused}`}
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scannerReady && !scanned ? handleBarCodeScanned : undefined}
                    barcodeScannerSettings={{
                        barcodeTypes: [
                            'ean13', 'ean8', 'upc_a', 'upc_e',
                            'code39', 'code128', 'qr', 'pdf417',
                            'codabar', 'itf14', 'aztec', 'datamatrix'
                        ],
                    }}
                    enableTorch={flashOn}
                />
            )}

            {/* Camera Overlay */}
            <View style={styles.cameraOverlay}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.gradientOverlay}
                >
                    {/* Top Status Bar */}
                    <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
                        <SafeAreaView>
                            <View style={styles.statusBar}>
                                <View style={styles.scannerInfo}>
                                    <Ionicons name="scan-outline" size={20} color="white" />
                                    <Text style={styles.scannerTitle}>AdBeam Scanner</Text>
                                    {!scannerReady && (
                                        <View style={styles.statusIndicator}>
                                            <ActivityIndicator size="small" color="#fbbf24" />
                                            <Text style={styles.statusText}>Initializing...</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.userStatus}>
                                    <Ionicons name="star" size={16} color="#fbbf24" />
                                    <Text style={styles.userPoints}>{userProfile?.points || 0}</Text>
                                    <Text style={styles.levelBadge}>L{userProfile?.level || 1}</Text>
                                </View>
                            </View>
                        </SafeAreaView>
                    </Animated.View>

                    {/* Center Scanning Area */}
                    <View style={styles.centerSection}>
                        <Animated.View style={[styles.scanningArea, { opacity: fadeAnim }]}>
                            <Text style={styles.instructionText}>
                                {!isCameraActive
                                    ? '📷 Activating camera...'
                                    : !scannerReady
                                        ? '⚡ Preparing scanner...'
                                        : isProcessing
                                            ? '🔄 Processing scan...'
                                            : '📱 Point camera at any barcode or QR code'
                                }
                            </Text>

                            {/* Scan Frame with Animation */}
                            <Animated.View
                                style={[
                                    styles.scanFrame,
                                    {
                                        transform: [{ scale: pulseAnim }],
                                        opacity: scannerReady && isCameraActive ? 1 : 0.6
                                    }
                                ]}
                            >
                                {/* Corner indicators */}
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />

                                {/* Animated scan line - only when fully ready */}
                                {scannerReady && isCameraActive && !scanned && !isProcessing && (
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

                                {/* Processing indicator */}
                                {isProcessing && (
                                    <View style={styles.processingContainer}>
                                        <ActivityIndicator size="large" color="#22c55e" />
                                        <Text style={styles.processingText}>Processing...</Text>
                                    </View>
                                )}

                                {/* Scanner not ready indicator */}
                                {!scannerReady && (
                                    <View style={styles.initializingContainer}>
                                        <ActivityIndicator size="large" color="#22c55e" />
                                        <Text style={styles.initializingText}>Getting Ready...</Text>
                                    </View>
                                )}

                                {/* Target dot - only when ready */}
                                {scannerReady && isCameraActive && !scanned && !isProcessing && (
                                    <View style={styles.targetDot} />
                                )}
                            </Animated.View>

                            <Text style={styles.helpText}>
                                {!scannerReady
                                    ? '⏳ Preparing scanner for barcode detection...'
                                    : '📋 After scanning, you\'ll choose the material type'
                                }
                            </Text>

                            {/* Scan counter */}
                            {scanCount > 0 && (
                                <Animated.View style={[styles.scanCounter, { opacity: fadeAnim }]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                                    <Text style={styles.scanCountText}>
                                        {scanCount} item{scanCount !== 1 ? 's' : ''} scanned this session
                                    </Text>
                                </Animated.View>
                            )}

                            {/* Ready indicator */}
                            {scannerReady && isCameraActive && !scanned && !isProcessing && (
                                <Animated.View style={[styles.readyIndicator, { opacity: fadeAnim }]}>
                                    <View style={styles.readyDot} />
                                    <Text style={styles.readyText}>Scanner Ready</Text>
                                </Animated.View>
                            )}
                        </Animated.View>
                    </View>

                    {/* Bottom Controls */}
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

                                {/* Reset Button - Emergency fallback */}
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={forceResetCamera}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['rgba(239, 68, 68, 0.8)', 'rgba(220, 38, 38, 0.8)']}
                                        style={styles.controlButtonGradient}
                                    >
                                        <Ionicons name="refresh" size={20} color="white" />
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

            {/* Camera activation overlay */}
            {!isCameraActive && (
                <View style={styles.cameraActivationOverlay}>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.9)']}
                        style={styles.activationGradient}
                    >
                        <ActivityIndicator size="large" color="#22c55e" />
                        <Text style={styles.activationText}>Activating Camera...</Text>
                    </LinearGradient>
                </View>
            )}

            {/* FIXED: Fully Scrollable Material Selection Modal */}
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
                        {/* Modal Handle */}
                        <View style={styles.modalHandle} />

                        {/* Fixed Header Section */}
                        <View style={styles.modalHeader}>
                            <View style={styles.successCheckIcon}>
                                <Ionicons name="checkmark-circle" size={52} color="#22c55e" />
                            </View>

                            <Text style={styles.modalTitle}>Barcode Detected Successfully! 📷</Text>
                            <Text style={styles.modalSubtitle}>
                                What type of recyclable material is this item?
                            </Text>

                            {scannedBarcode && (
                                <View style={styles.barcodeInfo}>
                                    <Text style={styles.barcodeLabel}>Scanned Barcode:</Text>
                                    <Text style={styles.barcodeValue}>
                                        {scannedBarcode.barcode}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* SCROLLABLE Material Options */}
                        <View style={styles.materialOptionsWrapper}>
                            <Text style={styles.selectMaterialTitle}>Select Material Type:</Text>

                            <ScrollView
                                style={styles.materialScrollContainer}
                                contentContainerStyle={styles.materialScrollContent}
                                showsVerticalScrollIndicator={true}
                                indicatorStyle="default"
                                bounces={true}
                                nestedScrollEnabled={true}
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

                        {/* Fixed Footer */}
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
    // Base Container
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    gradientOverlay: {
        flex: 1,
    },

    // Camera activation overlay
    cameraActivationOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2,
    },
    activationGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activationText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },

    // Loading Screen
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
    loadingSubtext: {
        fontSize: 14,
        color: '#16a34a',
        fontWeight: '500',
        marginTop: 8,
        textAlign: 'center',
    },

    // Permission Screen
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

    // Top Section
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
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 12,
    },
    statusText: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: '500',
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

    // Center Scanning Area
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
    initializingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initializingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        opacity: 0.8,
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
        marginBottom: 12,
    },
    scanCountText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    readyIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    readyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
    },
    readyText: {
        color: '#22c55e',
        fontSize: 12,
        fontWeight: '600',
    },

    // Bottom Controls
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
    resetButton: {
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

    // SCROLLABLE Material Selection Modal
    materialModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
        zIndex: 1000,
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

    // Modal Header - Fixed Position
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
        backgroundColor: '#f9fafb',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        minWidth: width * 0.6,
    },
    barcodeLabel: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    barcodeValue: {
        color: '#1f2937',
        fontSize: 14,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textAlign: 'center',
    },

    // SCROLLABLE Material Options
    materialOptionsWrapper: {
        paddingHorizontal: 24,
        paddingTop: 16,
        flex: 1,
    },
    selectMaterialTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
        textAlign: 'left',
    },
    materialScrollContainer: {
        maxHeight: height * 0.42,
        flex: 1,
    },
    materialScrollContent: {
        paddingBottom: 20,
        flexGrow: 1,
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

    // Fixed Modal Footer
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
