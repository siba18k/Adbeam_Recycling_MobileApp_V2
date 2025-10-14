import {
    recognizeMaterial,
    recordScan
} from '../services/database';
import { validateScanLocation } from '../services/locationService';
import { addToQueue } from '../services/offlineQueue';
import {
    notifyPointsEarned,
    notifyAchievement,
    notifyLevelUp
} from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import {ActivityIndicator, Alert, Animated, StyleSheet, TouchableOpacity, Vibration, View} from 'react-native';
import {CameraView, useCameraPermissions} from "expo-camera";
import NetInfo from "@react-native-community/netinfo";
import {useEffect, useRef, useState} from "react";
import {Ionicons} from "@expo/vector-icons";

export function ScannerScreen({navigation}) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const {user} = useAuth();

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
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4CAF50"/>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="camera-outline" size={100} color="#666"/>
                <Text style={styles.permissionText}>
                    We need camera permissions to scan barcodes
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({type, data}) => {
        if (scanned || isProcessing) return;

        setScanned(true);
        setIsProcessing(true);
        Vibration.vibrate(100);

        try {
            // Validate location
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

            // Recognize material type
            const material = recognizeMaterial(data);

            // Check network connectivity
            const netInfo = await NetInfo.fetch();

            const scanData = {
                barcode: data,
                materialType: material.name,
                points: material.points,
                location: locationValidation.location
            };

            if (!netInfo.isConnected) {
                // Queue for later if offline
                await addToQueue(scanData);

                Alert.alert(
                    'Scan Queued',
                    `You're offline! This ${material.name} scan will be processed when you reconnect.`,
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

            // Record scan in Firebase
            const result = await recordScan(user.uid, scanData);

            if (result.success) {
                animateSuccess();
                Vibration.vibrate([0, 200, 100, 200]);

                // Send notifications
                await notifyPointsEarned(material.points, material.name);

                // Check for level up
                const currentLevel = Math.floor((result.newTotalPoints - material.points) / 100) + 1;
                if (result.newLevel > currentLevel) {
                    await notifyLevelUp(result.newLevel);
                }

                Alert.alert(
                    '🎉 Success!',
                    `You earned ${material.points} points for recycling ${material.name}!\n\nTotal Points: ${result.newTotalPoints}\nLevel: ${result.newLevel}\nStreak: ${result.streak} days`,
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
                    'Already Scanned',
                    'This item has already been recycled. Each item can only be scanned once.',
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
            } else {
                throw new Error(result.error || 'Failed to record scan');
            }
        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert(
                'Error',
                'Failed to process scan. Please try again.',
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
        outputRange: [-150, 150],
    });

    const successScale = successAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
    });

    return (
        <View style={styles.container}>
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
                        'qr'
                    ],
                }}
                enableTorch={flashOn}
            >
                <View style={styles.overlay}>
                    {/* Top instruction */}
                    <View style={styles.topSection}>
                        <Text style={styles.instructionText}>
                            Position barcode within frame
                        </Text>
                    </View>

                    {/* Scanning frame */}
                    <View style={styles.middleSection}>
                        <View style={styles.scanFrame}>
                            <View style={[styles.corner, styles.topLeft]}/>
                            <View style={[styles.corner, styles.topRight]}/>
                            <View style={[styles.corner, styles.bottomLeft]}/>
                            <View style={[styles.corner, styles.bottomRight]}/>

                            {!scanned && (
                                <Animated.View
                                    style={[
                                        styles.scanLine,
                                        {transform: [{translateY: scanLineTranslateY}]}
                                    ]}
                                />
                            )}

                            {isProcessing && (
                                <View style={styles.processingContainer}>
                                    <ActivityIndicator size="large" color="#4CAF50"/>
                                    <Text style={styles.processingText}>Processing...</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Bottom controls */}
                    <View style={styles.bottomSection}>
                        <TouchableOpacity
                            style={styles.flashButton}
                            onPress={() => setFlashOn(!flashOn)}
                        >
                            <Ionicons
                                name={flashOn ? 'flash' : 'flash-off'}
                                size={30}
                                color="white"
                            />
                        </TouchableOpacity>

                        <Text style={styles.tipText}>
                            💡 Tip: Make sure you're on campus
                        </Text>
                    </View>
                </View>

                {/* Success overlay */}
                {scanned && !isProcessing && (
                    <Animated.View
                        style={[
                            styles.successOverlay,
                            {transform: [{scale: successScale}]}
                        ]}
                    >
                        <Ionicons name="checkmark-circle" size={100} color="#4CAF50"/>
                    </Animated.View>
                )}
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 20,
        color: '#666',
    },
    permissionButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    topSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    instructionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    middleSection: {
        flexDirection: 'row',
    },
    scanFrame: {
        width: 300,
        height: 300,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#4CAF50',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    scanLine: {
        width: '100%',
        height: 2,
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    processingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 10,
    },
    bottomSection: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    flashButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipText: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
});
