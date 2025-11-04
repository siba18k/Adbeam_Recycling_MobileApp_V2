import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { addToQueue } from '../services/offlineQueue';
import { recordScanWithNotifications, MATERIAL_TYPES } from '../services/database';
import { validateScanLocation } from '../services/locationService';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showMaterialSelector, setShowMaterialSelector] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const { user, refreshUserProfile, userProfile } = useAuth();
    const { isOffline, addToOfflineQueue } = useOffline();

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scanAnimation = useRef(new Animated.Value(0)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const materialModalAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        startAnimations();
    }, []);

    useEffect(() => {
        if (!scanned) {
            startScanAnimation();
        }
    }, [scanned]);

    const startAnimations = () => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Floating background elements
        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: -20,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, {
                    toValue: -15,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 20000,
                useNativeDriver: true,
            })
        ).start();
    };

    const startScanAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnimation, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnimation, {
                    toValue: 0,
                    duration: 0,
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
                // Android vibration patterns
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

    // Handle barcode scan - ALWAYS show material selector
    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || isProcessing) return;

        console.log('📷 Barcode scanned:', { type, data });

        // Store scanned barcode and show material selector
        setScannedBarcode({
            barcode: data,
            barcodeType: type,
            timestamp: new Date().toISOString()
        });

        setScanned(true);
        await playHapticFeedback('light');

        // Animate material selector modal
        setShowMaterialSelector(true);
        Animated.spring(materialModalAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    // Process scan after user selects material type
    const processScanWithMaterial = async (materialType) => {
        if (!scannedBarcode || !materialType) return;

        setIsProcessing(true);
        setShowMaterialSelector(false);

        try {
            const material = MATERIAL_TYPES[materialType];

            // Prepare comprehensive scan data
            const scanData = {
                barcode: scannedBarcode.barcode,
                barcodeType: scannedBarcode.barcodeType,
                materialType: materialType,
                itemName: `${material.name} Item`, // Generic name since user classified it
                brand: 'User Classified', // Indicate user classification
                points: material.points,
                category: materialType,
                location: null, // Will be filled by location service if needed
                timestamp: scannedBarcode.timestamp,
                scanMode: 'user_classified',
                userSelected: true
            };

            // Location validation (if required)
            const locationValidation = await validateScanLocation();
            if (locationValidation.valid) {
                scanData.location = locationValidation.location;
            }

            // Handle offline scanning
            if (isOffline) {
                await addToOfflineQueue(scanData);

                setLastScanResult({
                    success: true,
                    offline: true,
                    itemName: scanData.itemName,
                    materialType: materialType,
                    points: material.points,
                    barcode: scannedBarcode.barcode
                });

                await playHapticFeedback('success');
                setShowSuccessModal(true);
                return;
            }

            // Process scan online
            const result = await recordScanWithNotifications(user.uid, scanData);

            if (result.success) {
                // Update local scan history
                const newScan = {
                    id: Date.now().toString(),
                    ...scanData,
                    pointsEarned: result.points,
                    newTotalPoints: result.newTotalPoints,
                    newLevel: result.newLevel,
                };

                setScanHistory(prev => [newScan, ...prev.slice(0, 9)]); // Keep last 10

                setLastScanResult({
                    success: true,
                    offline: false,
                    itemName: `${material.name} Item`,
                    materialType: materialType,
                    points: result.points,
                    newTotalPoints: result.newTotalPoints,
                    newLevel: result.newLevel,
                    newTotalScans: result.newTotalScans,
                    newAchievements: result.newAchievements || [],
                    barcode: scannedBarcode.barcode,
                    userClassified: true
                });

                await refreshUserProfile();
                await playHapticFeedback('success');
                setShowSuccessModal(true);

            } else if (result.duplicate) {
                setLastScanResult({
                    success: false,
                    duplicate: true,
                    itemName: `${material.name} Item`,
                    barcode: scannedBarcode.barcode,
                    materialType: materialType
                });
                await playHapticFeedback('error');
                setShowSuccessModal(true);
            } else {
                throw new Error(result.error || 'Failed to process scan');
            }

        } catch (error) {
            console.error('❌ Scan processing error:', error);

            setLastScanResult({
                success: false,
                error: error.message,
                itemName: 'Unknown Item',
                barcode: scannedBarcode.barcode,
                materialType: materialType
            });

            await playHapticFeedback('error');
            setShowSuccessModal(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setIsProcessing(false);
        setShowSuccessModal(false);
        setShowMaterialSelector(false);
        setScannedBarcode(null);
        setLastScanResult(null);

        // Reset material modal animation
        materialModalAnim.setValue(0);
    };

    const cancelScan = () => {
        Animated.timing(materialModalAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowMaterialSelector(false);
            resetScanner();
        });
    };

    // Animation interpolations
    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const scanLineTranslateY = scanAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-140, 140],
    });

    // Camera permission handling
    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Initializing camera...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.permissionGradient}>
                    <Animated.View
                        style={[
                            styles.permissionContent,
                            { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
                        ]}
                    >
                        <View style={styles.permissionIconContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                style={styles.permissionIconCircle}
                            >
                                <Ionicons name="camera-outline" size={60} color="white" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.permissionTitle}>Camera Access Required</Text>
                        <Text style={styles.permissionText}>
                            AdBeam needs camera permission to scan barcodes on any recyclable items. You'll choose what type of material it is after scanning.
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
                                <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
                                <Ionicons name="camera" size={20} color="#22c55e" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // Main Camera Scanner Interface
    return (
        <SafeAreaView style={styles.cameraContainer}>
            {/* Floating background elements */}
            <Animated.View
                style={[
                    styles.floatingCircle,
                    styles.circle1,
                    { transform: [{ translateY: float1 }, { rotate: spin }] },
                ]}
            />
            <Animated.View
                style={[styles.floatingCircle, styles.circle2, { transform: [{ translateY: float2 }] }]}
            />

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
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.overlay}
                >
                    {/* Top Section - App Info */}
                    <Animated.View
                        style={[
                            styles.topSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        <View style={styles.appHeader}>
                            <LinearGradient
                                colors={['rgba(34, 197, 94, 0.95)', 'rgba(22, 163, 74, 0.95)']}
                                style={styles.appHeaderGradient}
                            >
                                <View style={styles.appHeaderContent}>
                                    <View style={styles.appIcon}>
                                        <Ionicons name="leaf" size={24} color="white" />
                                    </View>
                                    <View style={styles.appInfo}>
                                        <Text style={styles.appTitle}>AdBeam Scanner</Text>
                                        <Text style={styles.appSubtitle}>Scan any recyclable item</Text>
                                    </View>
                                    <View style={styles.userPoints}>
                                        <Ionicons name="star" size={16} color="#fbbf24" />
                                        <Text style={styles.userPointsText}>
                                            {userProfile?.points || 0}
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Connection Status */}
                        {isOffline && (
                            <View style={styles.offlineIndicator}>
                                <LinearGradient
                                    colors={['#ef4444dd', '#dc2626dd']}
                                    style={styles.offlineGradient}
                                >
                                    <Ionicons name="cloud-offline" size={16} color="white" />
                                    <Text style={styles.offlineText}>Offline - Scans will sync later</Text>
                                </LinearGradient>
                            </View>
                        )}
                    </Animated.View>

                    {/* Center Section - Scanning Frame */}
                    <View style={styles.centerSection}>
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ scale: fadeAnim }],
                            }}
                        >
                            <Text style={styles.instructionText}>
                                {isProcessing
                                    ? '🔄 Processing your scan...'
                                    : '📱 Point camera at any barcode or QR code'
                                }
                            </Text>

                            <View style={styles.scanFrame}>
                                {/* Enhanced corner indicators with gradient */}
                                <LinearGradient
                                    colors={['#22c55e', '#16a34a']}
                                    style={[styles.corner, styles.topLeft]}
                                />
                                <LinearGradient
                                    colors={['#22c55e', '#16a34a']}
                                    style={[styles.corner, styles.topRight]}
                                />
                                <LinearGradient
                                    colors={['#22c55e', '#16a34a']}
                                    style={[styles.corner, styles.bottomLeft]}
                                />
                                <LinearGradient
                                    colors={['#22c55e', '#16a34a']}
                                    style={[styles.corner, styles.bottomRight]}
                                />

                                {/* Animated scan line */}
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

                                {/* Processing indicator */}
                                {isProcessing && (
                                    <View style={styles.processingContainer}>
                                        <ActivityIndicator size="large" color="#22c55e" />
                                        <Text style={styles.processingText}>Processing scan...</Text>
                                    </View>
                                )}

                                {/* Center target guide */}
                                <View style={styles.targetGuide}>
                                    <View style={styles.targetDot} />
                                    <Text style={styles.targetText}>Aim here</Text>
                                </View>
                            </View>

                            <Text style={styles.tipText}>
                                💡 After scanning, you'll choose what type of material it is
                            </Text>

                            {/* Scan Process Steps */}
                            <View style={styles.stepsContainer}>
                                <View style={styles.step}>
                                    <View style={[styles.stepIcon, { backgroundColor: '#22c55e' }]}>
                                        <Text style={styles.stepNumber}>1</Text>
                                    </View>
                                    <Text style={styles.stepText}>Scan barcode</Text>
                                </View>
                                <View style={styles.stepArrow}>
                                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                                </View>
                                <View style={styles.step}>
                                    <View style={[styles.stepIcon, scanned ? { backgroundColor: '#22c55e' } : styles.stepIconInactive]}>
                                        <Text style={styles.stepNumber}>2</Text>
                                    </View>
                                    <Text style={styles.stepText}>Choose material</Text>
                                </View>
                                <View style={styles.stepArrow}>
                                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                                </View>
                                <View style={styles.step}>
                                    <View style={[styles.stepIcon, styles.stepIconInactive]}>
                                        <Text style={styles.stepNumber}>3</Text>
                                    </View>
                                    <Text style={styles.stepText}>Earn points!</Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Recent Scans Preview */}
                        {scanHistory.length > 0 && (
                            <Animated.View
                                style={[
                                    styles.recentScansContainer,
                                    { opacity: fadeAnim }
                                ]}
                            >
                                <Text style={styles.recentScansTitle}>Recent Scans:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {scanHistory.slice(0, 3).map((scan, index) => (
                                        <View key={scan.id} style={styles.recentScanChip}>
                                            <Ionicons
                                                name={MATERIAL_TYPES[scan.materialType]?.icon || 'leaf'}
                                                size={12}
                                                color="white"
                                            />
                                            <Text style={styles.recentScanText}>
                                                +{scan.pointsEarned}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        )}
                    </View>

                    {/* Bottom Section - Controls */}
                    <Animated.View
                        style={[
                            styles.bottomSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        <View style={styles.controlsRow}>
                            {/* Flash Toggle */}
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={() => {
                                    setFlashOn(!flashOn);
                                    playHapticFeedback('light');
                                }}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={
                                        flashOn
                                            ? ['#fbbf24', '#f59e0b']
                                            : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']
                                    }
                                    style={styles.controlButtonGradient}
                                >
                                    <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={24} color="white" />
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Sound Toggle */}
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={() => {
                                    setSoundEnabled(!soundEnabled);
                                    playHapticFeedback('light');
                                }}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={
                                        soundEnabled
                                            ? ['#22c55e', '#16a34a']
                                            : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']
                                    }
                                    style={styles.controlButtonGradient}
                                >
                                    <Ionicons
                                        name={soundEnabled ? 'volume-high' : 'volume-mute'}
                                        size={20}
                                        color="white"
                                    />
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Back Button */}
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                                    style={styles.backButtonGradient}
                                >
                                    <Ionicons name="arrow-back" size={20} color="white" />
                                    <Text style={styles.backButtonText}>Back</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </LinearGradient>
            </CameraView>

            {/* Material Selection Modal */}
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
                                opacity: materialModalAnim,
                                transform: [
                                    {
                                        scale: materialModalAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1],
                                        })
                                    },
                                    {
                                        translateY: materialModalAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [50, 0],
                                        })
                                    }
                                ]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#22c55e', '#16a34a']}
                            style={styles.materialModalGradient}
                        >
                            {/* Modal Header */}
                            <View style={styles.materialModalHeader}>
                                <View style={styles.modalHeaderIcon}>
                                    <Ionicons name="checkmark-circle" size={32} color="white" />
                                </View>
                                <Text style={styles.materialModalTitle}>Barcode Scanned! 📷</Text>
                                <Text style={styles.materialModalSubtitle}>
                                    What type of material is this item?
                                </Text>
                                {scannedBarcode && (
                                    <View style={styles.barcodeInfo}>
                                        <Text style={styles.barcodeText}>
                                            Barcode: {scannedBarcode.barcode.substring(0, 15)}
                                            {scannedBarcode.barcode.length > 15 ? '...' : ''}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Material Options */}
                            <View style={styles.materialOptions}>
                                {Object.entries(MATERIAL_TYPES).map(([key, material], index) => (
                                    <Animated.View
                                        key={key}
                                        style={{
                                            opacity: materialModalAnim,
                                            transform: [{
                                                translateX: materialModalAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [index % 2 === 0 ? -100 : 100, 0],
                                                })
                                            }]
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={styles.materialOptionCard}
                                            onPress={() => processScanWithMaterial(key)}
                                            activeOpacity={0.8}
                                            disabled={isProcessing}
                                        >
                                            <LinearGradient
                                                colors={[material.color, material.color + 'dd']}
                                                style={styles.materialOptionGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <View style={styles.materialOptionIcon}>
                                                    <Ionicons
                                                        name={material.icon}
                                                        size={28}
                                                        color="white"
                                                    />
                                                </View>
                                                <View style={styles.materialOptionInfo}>
                                                    <Text style={styles.materialOptionName}>
                                                        {material.name}
                                                    </Text>
                                                    <Text style={styles.materialOptionDescription}>
                                                        {material.description}
                                                    </Text>
                                                    <View style={styles.materialOptionPoints}>
                                                        <Ionicons name="star" size={14} color="#fbbf24" />
                                                        <Text style={styles.materialOptionPointsText}>
                                                            +{material.points} points
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.materialOptionArrow}>
                                                    {isProcessing ? (
                                                        <ActivityIndicator size="small" color="white" />
                                                    ) : (
                                                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                                                    )}
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>

                            {/* Modal Actions */}
                            <View style={styles.materialModalActions}>
                                <TouchableOpacity
                                    style={styles.modalActionButton}
                                    onPress={cancelScan}
                                    activeOpacity={0.8}
                                    disabled={isProcessing}
                                >
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                                        style={styles.modalActionGradient}
                                    >
                                        <Ionicons name="close" size={18} color="white" />
                                        <Text style={styles.modalActionText}>Cancel & Scan Again</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </Modal>

            {/* Success/Error Result Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.resultModalOverlay}>
                    <Animated.View style={styles.resultModal}>
                        {lastScanResult && (
                            <LinearGradient
                                colors={
                                    lastScanResult.success
                                        ? ['#22c55e', '#16a34a']
                                        : ['#ef4444', '#dc2626']
                                }
                                style={styles.resultModalGradient}
                            >
                                <View style={styles.resultContent}>
                                    {/* Result Icon */}
                                    <View style={styles.resultIcon}>
                                        <Ionicons
                                            name={
                                                lastScanResult.success
                                                    ? lastScanResult.offline
                                                        ? 'cloud-upload-outline'
                                                        : 'checkmark-circle'
                                                    : lastScanResult.duplicate
                                                        ? 'duplicate-outline'
                                                        : 'close-circle'
                                            }
                                            size={64}
                                            color="white"
                                        />
                                    </View>

                                    {/* Result Title */}
                                    <Text style={styles.resultTitle}>
                                        {lastScanResult.success
                                            ? lastScanResult.offline
                                                ? '📡 Scan Queued!'
                                                : '🎉 Great Job!'
                                            : lastScanResult.duplicate
                                                ? '♻️ Already Recycled'
                                                : '❌ Scan Failed'
                                        }
                                    </Text>

                                    {/* Result Details */}
                                    <View style={styles.resultDetails}>
                                        <Text style={styles.resultItemName}>
                                            {MATERIAL_TYPES[lastScanResult.materialType]?.name || 'Unknown'} Item
                                        </Text>

                                        {lastScanResult.userClassified && (
                                            <Text style={styles.resultClassification}>
                                                ✅ You classified this as {lastScanResult.materialType}
                                            </Text>
                                        )}

                                        {lastScanResult.success && (
                                            <View style={styles.resultStats}>
                                                <View style={styles.resultStat}>
                                                    <Ionicons name="star" size={18} color="rgba(255,255,255,0.9)" />
                                                    <Text style={styles.resultStatText}>
                                                        +{lastScanResult.points} points earned
                                                    </Text>
                                                </View>

                                                {!lastScanResult.offline && (
                                                    <>
                                                        <View style={styles.resultStat}>
                                                            <Ionicons name="trending-up" size={18} color="rgba(255,255,255,0.9)" />
                                                            <Text style={styles.resultStatText}>
                                                                Total: {lastScanResult.newTotalPoints} points
                                                            </Text>
                                                        </View>

                                                        <View style={styles.resultStat}>
                                                            <Ionicons name="trophy" size={18} color="rgba(255,255,255,0.9)" />
                                                            <Text style={styles.resultStatText}>
                                                                Level {lastScanResult.newLevel}
                                                            </Text>
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                        )}

                                        {lastScanResult.duplicate && (
                                            <Text style={styles.resultMessage}>
                                                This barcode was already scanned recently. Try a different item!
                                            </Text>
                                        )}

                                        {lastScanResult.error && (
                                            <Text style={styles.resultMessage}>
                                                {lastScanResult.error}
                                            </Text>
                                        )}

                                        {/* New Achievements */}
                                        {lastScanResult.newAchievements && lastScanResult.newAchievements.length > 0 && (
                                            <View style={styles.achievementsContainer}>
                                                <Text style={styles.achievementsTitle}>🏆 New Achievement!</Text>
                                                {lastScanResult.newAchievements.slice(0, 2).map((achievement, index) => (
                                                    <View key={index} style={styles.achievementChip}>
                                                        <Ionicons name={achievement.icon} size={16} color="white" />
                                                        <Text style={styles.achievementName}>
                                                            {achievement.name}
                                                        </Text>
                                                        <Text style={styles.achievementPoints}>
                                                            +{achievement.points}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    {/* Result Actions */}
                                    <View style={styles.resultActions}>
                                        <TouchableOpacity
                                            style={styles.resultButton}
                                            onPress={() => {
                                                setShowSuccessModal(false);
                                                resetScanner();
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                                                style={styles.resultButtonGradient}
                                            >
                                                <Ionicons name="scan" size={18} color="white" />
                                                <Text style={styles.resultButtonText}>Scan Another</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.resultButton}
                                            onPress={() => {
                                                setShowSuccessModal(false);
                                                navigation.navigate('Dashboard');
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                                                style={styles.resultButtonGradient}
                                            >
                                                <Ionicons name="home" size={18} color="white" />
                                                <Text style={styles.resultButtonText}>Dashboard</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </LinearGradient>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
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
    overlay: {
        flex: 1,
    },
    floatingCircle: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.08,
        backgroundColor: '#22c55e',
        zIndex: -1,
    },
    circle1: {
        width: 200,
        height: 200,
        top: 100,
        right: -80,
    },
    circle2: {
        width: 160,
        height: 160,
        bottom: 150,
        left: -60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
    },
    loadingText: {
        fontSize: 16,
        color: '#22c55e',
        fontWeight: '600',
        marginTop: 12,
    },

    // Permission Screen Styles
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
        padding: 40,
        maxWidth: width * 0.8,
    },
    permissionIconContainer: {
        marginBottom: 24,
    },
    permissionIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 16,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
    },
    permissionButton: {
        borderRadius: 20,
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
        paddingVertical: 16,
        gap: 8,
    },
    permissionButtonText: {
        color: '#22c55e',
        fontSize: 18,
        fontWeight: '700',
    },

    // Top Section Styles
    topSection: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    appHeader: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 12,
    },
    appHeaderGradient: {
        padding: 16,
    },
    appHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    appInfo: {
        flex: 1,
    },
    appTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginBottom: 2,
    },
    appSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    userPoints: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    userPointsText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    offlineIndicator: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    offlineGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    offlineText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },

    // Center Section - Scanning Area
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    scanFrame: {
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 20,
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopLeftRadius: 8,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopRightRadius: 8,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomLeftRadius: 8,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomRightRadius: 8,
    },
    scanLine: {
        width: '90%',
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
        marginTop: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    targetGuide: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    targetDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
        marginBottom: 8,
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 6,
    },
    targetText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '600',
    },
    tipText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginBottom: 20,
    },

    // Process Steps
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        marginBottom: 20,
    },
    step: {
        alignItems: 'center',
        gap: 4,
    },
    stepIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepIconInactive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    stepNumber: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    stepText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '600',
    },
    stepArrow: {
        marginHorizontal: 8,
    },

    // Recent Scans
    recentScansContainer: {
        alignItems: 'center',
    },
    recentScansTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    recentScanChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginHorizontal: 4,
        gap: 4,
    },
    recentScanText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
    },

    // Bottom Controls
    bottomSection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 20,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    controlButton: {
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    controlButtonGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        flex: 1,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    backButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Material Selection Modal
    materialModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    materialModal: {
        width: width * 0.95,
        maxWidth: 420,
        maxHeight: height * 0.8,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    materialModalGradient: {
        paddingBottom: 0,
    },
    materialModalHeader: {
        alignItems: 'center',
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    modalHeaderIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        padding: 8,
        marginBottom: 16,
    },
    materialModalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    materialModalSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },
    barcodeInfo: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    barcodeText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: '600',
    },

    // Material Options
    materialOptions: {
        paddingHorizontal: 16,
        gap: 12,
        maxHeight: 320,
    },
    materialOptionCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 4,
    },
    materialOptionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    materialOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    materialOptionInfo: {
        flex: 1,
    },
    materialOptionName: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    materialOptionDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    materialOptionPoints: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 4,
    },
    materialOptionPointsText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    materialOptionArrow: {
        marginLeft: 12,
    },

    // Material Modal Actions
    materialModalActions: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    modalActionButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalActionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    modalActionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Result Modal Styles
    resultModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    resultModal: {
        width: width * 0.9,
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    resultModalGradient: {
        padding: 0,
    },
    resultContent: {
        padding: 24,
        alignItems: 'center',
    },
    resultIcon: {
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 40,
        padding: 12,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        marginBottom: 16,
    },
    resultDetails: {
        alignItems: 'center',
        marginBottom: 24,
    },
    resultItemName: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    resultClassification: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    resultStats: {
        gap: 8,
        alignItems: 'center',
    },
    resultStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    resultStatText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    resultMessage: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 8,
    },

    // Achievements in Result
    achievementsContainer: {
        marginTop: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    achievementsTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    achievementChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 4,
        gap: 6,
    },
    achievementName: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    achievementPoints: {
        color: '#fbbf24',
        fontSize: 11,
        fontWeight: '700',
    },

    // Result Actions
    resultActions: {
        flexDirection: 'row',
        gap: 12,
    },
    resultButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    resultButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 6,
    },
    resultButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
