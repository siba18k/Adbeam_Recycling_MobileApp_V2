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
    ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { addToQueue } from '../services/offlineQueue';
import { recordScan, MATERIAL_TYPES } from '../services/database';
import { validateScanLocation } from '../services/locationService';
import NetInfo from '@react-native-community/netinfo';
import { colors, gradients } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const { user, refreshUserProfile } = useAuth();

    const scanAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (selectedMaterial) {
            startScanAnimation();
        }
    }, [selectedMaterial]);

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

    // Show material selection first
    if (!selectedMaterial) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={gradients.backgroundPrimary} style={styles.gradient}>
                    <ScrollView contentContainerStyle={styles.materialSelectionContainer}>
                        <View style={styles.selectionHeader}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="scan" size={60} color="white" />
                            </View>
                            <Text style={styles.selectionTitle}>What are you recycling?</Text>
                            <Text style={styles.selectionSubtitle}>
                                Select the type of material you want to scan
                            </Text>
                        </View>

                        <View style={styles.materialGrid}>
                            {Object.entries(MATERIAL_TYPES).map(([key, material]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={styles.materialCard}
                                    onPress={() => setSelectedMaterial(key)}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[material.color, material.color + 'CC']}
                                        style={styles.materialCardGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <View style={styles.materialIconContainer}>
                                            <Ionicons
                                                name={material.icon || 'leaf'}
                                                size={32}
                                                color="white"
                                            />
                                        </View>
                                        <Text style={styles.materialCardTitle}>
                                            {material.name}
                                        </Text>
                                        <View style={styles.pointsBadge}>
                                            <Ionicons name="star" size={14} color="white" />
                                            <Text style={styles.pointsBadgeText}>
                                                +{material.points} points
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>← Back to Dashboard</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // Camera permission check
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
                    `You're offline! This ${material.name} scan will be processed when you reconnect.`,
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
                // Refresh user profile to sync points immediately
                await refreshUserProfile();

                Vibration.vibrate([0, 200, 100, 200]);

                Alert.alert(
                    '🎉 Recycling Success!',
                    `Great job! You've earned points for recycling!\n\n` +
                    `Material: ${material.name}\n` +
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
                            text: 'Change Material',
                            onPress: () => {
                                setSelectedMaterial(null);
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

    const material = MATERIAL_TYPES[selectedMaterial];
    const scanLineTranslateY = scanAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 120],
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
                    {/* Top Section - Selected Material Info */}
                    <View style={styles.topSection}>
                        <LinearGradient
                            colors={[material.color, material.color + 'CC']}
                            style={styles.selectedMaterialCard}
                        >
                            <TouchableOpacity
                                style={styles.changeButton}
                                onPress={() => setSelectedMaterial(null)}
                            >
                                <Ionicons name="chevron-back" size={20} color="white" />
                                <Text style={styles.changeButtonText}>Change</Text>
                            </TouchableOpacity>

                            <View style={styles.selectedMaterialInfo}>
                                <Ionicons name={material.icon || 'leaf'} size={24} color="white" />
                                <Text style={styles.selectedMaterialName}>{material.name}</Text>
                                <Text style={styles.selectedMaterialPoints}>+{material.points} pts</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Center Section - Scanning Frame */}
                    <View style={styles.centerSection}>
                        <Text style={styles.instructionText}>
                            Scan any barcode or QR code
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
                                        Processing {material.name}...
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Bottom Section - Controls */}
                    <View style={styles.bottomSection}>
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
                                💡 Point camera at any barcode or QR code on your {material.name.toLowerCase()}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </CameraView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    gradient: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface.light,
    },
    materialSelectionContainer: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 40,
    },
    selectionHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    headerIcon: {
        marginBottom: 20,
    },
    selectionTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    selectionSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
    },
    materialGrid: {
        gap: 16,
    },
    materialCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: colors.shadow.heavy,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    materialCardGradient: {
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    materialIconContainer: {
        marginRight: 20,
    },
    materialCardTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    pointsBadgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
    },
    backButton: {
        marginTop: 40,
        alignSelf: 'center',
    },
    backButtonText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
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
    selectedMaterialCard: {
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 10,
    },
    changeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    changeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 4,
    },
    selectedMaterialInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedMaterialName: {
        flex: 1,
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 12,
    },
    selectedMaterialPoints: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    centerSection: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(5, 150, 105, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 12,
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
    bottomSection: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
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
        padding: 12,
    },
    tipText: {
        color: 'white',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
});
