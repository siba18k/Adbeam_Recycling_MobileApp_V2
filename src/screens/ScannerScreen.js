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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { addToQueue } from '../services/offlineQueue';
import { recordScan, MATERIAL_TYPES } from '../services/database';
import { validateScanLocation } from '../services/locationService';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const { user, refreshUserProfile } = useAuth();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scanAnimation = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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

        // Floating background
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
    }, []);

    useEffect(() => {
        if (selectedMaterial && !scanned) {
            startScanAnimation();
        }
    }, [selectedMaterial, scanned]);

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

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Material Selection Screen
    if (!selectedMaterial) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#27ae60', '#229954', '#1e8449']} style={styles.gradient}>
                    {/* Floating circles */}
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

                    <ScrollView contentContainerStyle={styles.materialSelectionContainer}>
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}
                        >
                            <View style={styles.selectionHeader}>
                                <View style={styles.headerIconContainer}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                        style={styles.headerIcon}
                                    >
                                        <Ionicons name="scan" size={50} color="white" />
                                    </LinearGradient>
                                </View>
                                <Text style={styles.selectionTitle}>What are you recycling?</Text>
                                <Text style={styles.selectionSubtitle}>
                                    Select the type of material you want to scan
                                </Text>
                            </View>

                            <View style={styles.materialGrid}>
                                {Object.entries(MATERIAL_TYPES).map(([key, material], index) => (
                                    <Animated.View
                                        key={key}
                                        style={{
                                            opacity: fadeAnim,
                                            transform: [
                                                {
                                                    translateX: fadeAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [index % 2 === 0 ? -50 : 50, 0],
                                                    }),
                                                },
                                            ],
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={styles.materialCard}
                                            onPress={() => setSelectedMaterial(key)}
                                            activeOpacity={0.9}
                                        >
                                            <LinearGradient
                                                colors={[material.color, material.color + 'dd']}
                                                style={styles.materialCardGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <View style={styles.materialIconContainer}>
                                                    <View style={styles.materialIconCircle}>
                                                        <Ionicons
                                                            name={material.icon || 'leaf'}
                                                            size={28}
                                                            color="white"
                                                        />
                                                    </View>
                                                </View>
                                                <View style={styles.materialInfo}>
                                                    <Text style={styles.materialCardTitle}>{material.name}</Text>
                                                    <View style={styles.pointsBadge}>
                                                        <Ionicons name="star" size={12} color="#fbbf24" />
                                                        <Text style={styles.pointsBadgeText}>
                                                            +{material.points} points
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.backButtonText}>Back to Dashboard</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // Camera permission check
    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#27ae60" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <LinearGradient colors={['#27ae60', '#229954']} style={styles.permissionGradient}>
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
                            We need camera permissions to scan barcodes for recycling items
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
                                <Text style={styles.permissionButtonText}>Grant Permission</Text>
                                <Ionicons name="camera" size={20} color="#27ae60" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
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
            const locationValidation = await validateScanLocation();

            if (!locationValidation.valid) {
                Alert.alert('Location Required', locationValidation.error || 'You must be on campus to scan items', [
                    {
                        text: 'OK',
                        onPress: () => {
                            setScanned(false);
                            setIsProcessing(false);
                        },
                    },
                ]);
                return;
            }

            const material = MATERIAL_TYPES[selectedMaterial];

            const scanData = {
                barcode: data,
                materialType: material.name,
                points: material.points,
                location: locationValidation.location || { latitude: 0, longitude: 0 },
            };

            const netInfo = await NetInfo.fetch();

            if (!netInfo.isConnected) {
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
                            },
                        },
                        {
                            text: 'View Dashboard',
                            onPress: () => navigation.navigate('Dashboard'),
                        },
                    ]
                );
                return;
            }

            const result = await recordScan(user.uid, scanData);

            if (result.success) {
                await refreshUserProfile();
                Vibration.vibrate([0, 200, 100, 200]);

                Alert.alert(
                    '🎉 Recycling Success!',
                    `Great job! You've earned points!\n\n` +
                    `Material: ${material.name}\n` +
                    `Points: +${material.points}\n\n` +
                    `Total Points: ${result.newTotalPoints}\n` +
                    `Level: ${result.newLevel}\n` +
                    `Items Recycled: ${result.newTotalScans}`,
                    [
                        {
                            text: 'Scan Another',
                            onPress: () => {
                                setScanned(false);
                                setIsProcessing(false);
                            },
                        },
                        {
                            text: 'Change Material',
                            onPress: () => {
                                setSelectedMaterial(null);
                                setScanned(false);
                                setIsProcessing(false);
                            },
                        },
                        {
                            text: 'View Dashboard',
                            onPress: () => navigation.navigate('Dashboard'),
                        },
                    ]
                );
            } else if (result.duplicate) {
                Alert.alert(
                    'Already Recycled ♻️',
                    `This item has already been scanned.\n\nBarcode: ${data}`,
                    [
                        {
                            text: 'Try Another',
                            onPress: () => {
                                setScanned(false);
                                setIsProcessing(false);
                            },
                        },
                    ]
                );
            } else {
                throw new Error(result.error || 'Failed to record scan');
            }
        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert('Scan Error', `Failed to process scan.\n\nError: ${error.message}`, [
                {
                    text: 'OK',
                    onPress: () => {
                        setScanned(false);
                        setIsProcessing(false);
                    },
                },
            ]);
        }
    };

    const material = MATERIAL_TYPES[selectedMaterial];
    const scanLineTranslateY = scanAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 120],
    });

    return (
        <SafeAreaView style={styles.cameraContainer}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code128', 'qr', 'pdf417'],
                }}
                enableTorch={flashOn}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.overlay}
                >
                    {/* Top Section */}
                    <View style={styles.topSection}>
                        <LinearGradient
                            colors={[material.color + 'ee', material.color + 'dd']}
                            style={styles.selectedMaterialCard}
                        >
                            <TouchableOpacity
                                style={styles.changeButton}
                                onPress={() => setSelectedMaterial(null)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={20} color="white" />
                                <Text style={styles.changeButtonText}>Change</Text>
                            </TouchableOpacity>

                            <View style={styles.selectedMaterialInfo}>
                                <View style={styles.selectedIconCircle}>
                                    <Ionicons name={material.icon || 'leaf'} size={22} color="white" />
                                </View>
                                <Text style={styles.selectedMaterialName}>{material.name}</Text>
                                <View style={styles.selectedPointsBadge}>
                                    <Ionicons name="star" size={14} color="#fbbf24" />
                                    <Text style={styles.selectedMaterialPoints}>+{material.points}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Center Section - Scanning Frame */}
                    <View style={styles.centerSection}>
                        <Text style={styles.instructionText}>
                            {isProcessing ? 'Processing...' : 'Point at barcode or QR code'}
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
                                    style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
                                >
                                    <LinearGradient
                                        colors={['transparent', '#27ae60', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.scanLineGradient}
                                    />
                                </Animated.View>
                            )}

                            {/* Processing indicator */}
                            {isProcessing && (
                                <View style={styles.processingContainer}>
                                    <ActivityIndicator size="large" color="#27ae60" />
                                    <Text style={styles.processingText}>Processing {material.name}...</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.tipText}>
                            💡 Works with any barcode or QR code
                        </Text>
                    </View>

                    {/* Bottom Section */}
                    <View style={styles.bottomSection}>
                        <TouchableOpacity
                            style={styles.flashButton}
                            onPress={() => setFlashOn(!flashOn)}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={
                                    flashOn
                                        ? ['#fbbf24', '#f59e0b']
                                        : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                                }
                                style={styles.flashButtonGradient}
                            >
                                <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={24} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoText}>
                                Scanning: <Text style={styles.infoMaterial}>{material.name}</Text>
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
        backgroundColor: '#27ae60',
    },
    gradient: {
        flex: 1,
    },
    floatingCircle: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.15,
        backgroundColor: '#fff',
    },
    circle1: {
        width: 150,
        height: 150,
        top: 50,
        right: -50,
    },
    circle2: {
        width: 120,
        height: 120,
        bottom: 100,
        left: -40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
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
    headerIconContainer: {
        marginBottom: 20,
    },
    headerIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    selectionTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        marginBottom: 12,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    materialCardGradient: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    materialIconContainer: {
        marginRight: 16,
    },
    materialIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    materialInfo: {
        flex: 1,
    },
    materialCardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginBottom: 6,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    pointsBadgeText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 4,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignSelf: 'center',
    },
    backButtonText: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
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
        paddingHorizontal: 20,
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
        color: '#27ae60',
        fontSize: 18,
        fontWeight: '700',
    },
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
    topSection: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 40,
    },
    selectedMaterialCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    changeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
    },
    changeButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    selectedMaterialInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    selectedMaterialName: {
        flex: 1,
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    selectedPointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    selectedMaterialPoints: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    centerSection: {
        flex: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(39, 174, 96, 0.9)',
        paddingHorizontal: 24,
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
        borderColor: '#27ae60',
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
        borderTopLeftRadius: 8,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderTopRightRadius: 8,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomLeftRadius: 8,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderBottomRightRadius: 8,
    },
    scanLine: {
        width: '100%',
        height: 3,
    },
    scanLineGradient: {
        flex: 1,
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
    },
    tipText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        marginTop: 24,
        textAlign: 'center',
        fontWeight: '500',
    },
    bottomSection: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 30,
    },
    flashButton: {
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    flashButtonGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        flex: 1,
        marginLeft: 16,
        backgroundColor: 'rgba(39, 174, 96, 0.9)',
        borderRadius: 16,
        padding: 16,
    },
    infoText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    infoMaterial: {
        fontWeight: '700',
        color: 'white',
    },
});
