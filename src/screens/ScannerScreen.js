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
    SafeAreaView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { addToQueue } from '../services/offlineQueue';
import { recordScan, MATERIAL_TYPES } from '../services/database'; // Removed recognizeMaterial
import { validateScanLocation } from '../services/locationService';
import NetInfo from '@react-native-community/netinfo';
import { colors, gradients } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState('PLASTIC');
    const { user } = useAuth();

    const scanAnimation = useRef(new Animated.Value(0)).current;
    const successAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        startScanAnimation();
    }, []);

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
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const animateSuccess = () => {
        Animated.sequence([
            Animated.timing(successAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(successAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
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
            <SafeAreaView style={styles.permissionContainer}>
                <LinearGradient
                    colors={gradients.backgroundPrimary}
                    style={styles.permissionGradient}
                >
                    <View style={styles.permissionContent}>
                        <View style={styles.permissionIconContainer}>
                            <Ionicons name="camera-outline" size={80} color="white" />
                        </View>
                        <Text style={styles.permissionTitle}>
                            Camera Access Required
                        </Text>
                        <Text style={styles.permissionText}>
                            We need camera permissions to scan barcodes for recycling items
                        </Text>
                        <LinearGradient
                            colors={gradients.success}
                            style={styles.permissionButton}
                        >
                            <TouchableOpacity
                                onPress={requestPermission}
                                style={styles.permissionButtonContent}
                            >
                                <Text style={styles.permissionButtonText}>Grant Permission</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || isProcessing) return;

        setScanned(true);
        setIsProcessing(true);
        Vibration.vibrate(100);

        try {
            // Validate location first
            const locationValidation = await validateScanLocation();

            if (!locationValidation.valid) {
                Alert.alert(
                    'Location Required',
                    locationValidation.error || 'You must be on campus to scan items',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setScanned(false);
                                setIsProcessing(false);
                            }
                        }
                    ]
                );
                return;
            }

            // Get material info from selected type
            const material = MATERIAL_TYPES[selectedMaterial];

            const scanData = {
                barcode: data,
                materialType: material.name,
                points: material.points,
                location: locationValidation.location || { latitude: 0, longitude: 0 }
            };

            // Check network connectivity
            const netInfo = await NetInfo.fetch();

            if (!netInfo.isConnected) {
                // Queue for later if offline
                await addToQueue(scanData);

                Alert.alert(
                    'Scan Queued ⏳',
                    `You're offline! This ${material.name} scan will be processed when you reconnect.\n\nBarcode: ${data}`,
                    [
                        {
                            text: 'Scan Another',
                            onPress: () => {
                                setScanned(false);
                                setIsProcessing(false);
                            }
                        },
                        {
                            text: 'View Dashboard',
                            onPress: () => navigation.navigate('Dashboard')
                        }
                    ]
                );
                return;
            }

            // Record scan in Firebase
            const result = await recordScan(user.uid, scanData);

            if (result.success) {
                animateSuccess();
                Vibration.vibrate([0, 200, 100, 200]);

                Alert.alert(
                    '🎉 Recycling Success!',
                    `Great job! You've earned points for recycling!\n\n` +
                    `Material: ${material.name}\n` +
                    `Barcode: ${data}\n` +
                    `Points Earned: +${material.points}\n\n` +
                    `Your Stats:\n` +
                    `Total Points: ${result.newTotalPoints}\n` +
                    `Level: ${result.newLevel}\n` +
                    `Items Recycled: ${result.newTotalScans}`,
                    [
                        {
                            text: 'Scan Another',
                            onPress: () => {
                                setScanned(false);
                                setIsProcessing(false);
                            }
                        },
                        {
                            text: 'View Dashboard',
                            onPress: () => navigation.navigate('Dashboard')
                        }
                    ]
                );
            } else if (result.duplicate) {
                Alert.alert(
                    'Already Recycled ♻️',
                    `This item has already been scanned and recycled.\n\nBarcode: ${data}\n\nEach item can only be recycled once to prevent fraud.`,
                    [
                        {
                            text: 'Try Another Item',
                            onPress: () => {
                                setScanned(false);
                                setIsProcessing(false);
                            }
                        }
                    ]
                );
            } else {
                throw new Error(result.error || 'Failed to record scan');
            }
        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert(
                'Scan Error',
                `Failed to process scan. Please try again.\n\nError: ${error.message}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setScanned(false);
                            setIsProcessing(false);
                        }
                    }
                ]
            );
        }
    };

    const scanLineTranslateY = scanAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 120],
    });

    const successScale = successAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
    });

    return (
        <SafeAreaView style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: [
                        'ean13',
                        'ean8',
                        'upc_a',
                        'upc_e',
                        'code39',
                        'code128',
                        'qr',
                        'pdf417'
                    ],
                }}
                enableTorch={flashOn}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.overlay}
                >
                    {/* Top Section - Material Selection */}
                    <View style={styles.topSection}>
                        <LinearGradient
                            colors={[colors.surface.overlay, 'rgba(5, 150, 105, 0.8)']}
                            style={styles.materialSelector}
                        >
                            <Text style={styles.selectorTitle}>Select Material Type:</Text>
                            <View style={styles.materialGrid}>
                                {Object.entries(MATERIAL_TYPES).map(([key, material]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.materialButton,
                                            selectedMaterial === key && styles.selectedMaterial
                                        ]}
                                        onPress={() => setSelectedMaterial(key)}
                                    >
                                        <LinearGradient
                                            colors={
                                                selectedMaterial === key
                                                    ? [material.color, material.color]
                                                    : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                                            }
                                            style={styles.materialButtonGradient}
                                        >
                                            <Ionicons
                                                name={material.icon || 'leaf'}
                                                size={20}
                                                color="white"
                                            />
                                            <Text style={styles.materialButtonText} numberOfLines={2}>
                                                {material.name}
                                            </Text>
                                            <Text style={styles.materialPointsText}>
                                                +{material.points} pts
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Center Section - Scanning Frame */}
                    <View style={styles.centerSection}>
                        <View style={styles.scanFrameContainer}>
                            <Text style={styles.instructionText}>
                                Scan {MATERIAL_TYPES[selectedMaterial].name.toLowerCase()} barcode
                            </Text>

                            <View style={styles.scanFrame}>
                                {/* Corner indicators */}
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />

                                {/* Animated scan line */}
                                {!scanned && !isProcessing && (
                                    <Animated.View
                                        style={[
                                            styles.scanLine,
                                            { transform: [{ translateY: scanLineTranslateY }] }
                                        ]}
                                    />
                                )}

                                {/* Processing indicator */}
                                {isProcessing && (
                                    <View style={styles.processingContainer}>
                                        <ActivityIndicator size="large" color={colors.success.main} />
                                        <Text style={styles.processingText}>
                                            Processing {MATERIAL_TYPES[selectedMaterial].name}...
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Points preview */}
                            <LinearGradient
                                colors={[MATERIAL_TYPES[selectedMaterial].color, MATERIAL_TYPES[selectedMaterial].color + '80']}
                                style={styles.pointsPreview}
                            >
                                <Text style={styles.pointsPreviewText}>
                                    +{MATERIAL_TYPES[selectedMaterial].points} points for {MATERIAL_TYPES[selectedMaterial].name}
                                </Text>
                            </LinearGradient>
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

                            <View style={styles.tipContainer}>
                                <Text style={styles.tipText}>
                                    💡 Select material type above, then scan any barcode or QR code
                                </Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Success Overlay */}
                {scanned && isProcessing && (
                    <Animated.View
                        style={[
                            styles.successOverlay,
                            { transform: [{ scale: successScale }] }
                        ]}
                    >
                        <LinearGradient
                            colors={gradients.success}
                            style={styles.successCircle}
                        >
                            <Ionicons name="checkmark" size={60} color="white" />
                        </LinearGradient>
                        <Text style={styles.successText}>Processing Scan...</Text>
                    </Animated.View>
                )}
            </CameraView>
        </SafeAreaView>
    );
}

// Add the existing styles here (same as before)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface.light,
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
        padding: 40,
    },
    permissionIconContainer: {
        marginBottom: 24,
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
        borderRadius: 16,
        shadowColor: colors.success.main,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    permissionButtonContent: {
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 18,
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
    materialSelector: {
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 10,
    },
    selectorTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    materialGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    materialButton: {
        width: (width - 80) / 2,
        margin: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    materialButtonGradient: {
        padding: 8,
        alignItems: 'center',
        minHeight: 70,
        justifyContent: 'center',
    },
    materialButtonText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 4,
    },
    materialPointsText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
    selectedMaterial: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    centerSection: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrameContainer: {
        alignItems: 'center',
    },
    instructionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(5, 150, 105, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    scanFrame: {
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: colors.success.main,
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
    scanLine: {
        width: '90%',
        height: 3,
        backgroundColor: colors.success.main,
        shadowColor: colors.success.main,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    processingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 12,
        fontWeight: '600',
    },
    pointsPreview: {
        marginTop: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    pointsPreviewText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    bottomSection: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    tipContainer: {
        flex: 1,
        marginLeft: 15,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 12,
        padding: 10,
    },
    tipText: {
        color: 'white',
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '500',
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
});
