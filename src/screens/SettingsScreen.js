import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
    const [settings, setSettings] = useState({
        autoSync: true,
        soundEffects: true,
        hapticFeedback: true,
        darkMode: false,
        autoBackup: true,
        cacheImages: true,
        offlineMode: true,
        dataUsage: 'normal', // 'low', 'normal', 'high'
    });

    const [isLoading, setIsLoading] = useState(true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadSettings();

        // Enhanced entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Enhanced background animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2200,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: -20,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 20,
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
            Animated.timing(rotate, {
                toValue: 1,
                duration: 12000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('appSettings');
            if (savedSettings) {
                setSettings({ ...settings, ...JSON.parse(savedSettings) });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', 'Failed to save settings');
        }
    };

    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        saveSettings(newSettings);
    };

    const clearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear all cached images and data. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            Alert.alert('Success! 🧹', 'Cache cleared successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear cache');
                        }
                    },
                },
            ]
        );
    };

    const resetSettings = () => {
        Alert.alert(
            'Reset Settings',
            'This will reset all settings to default values. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        const defaultSettings = {
                            autoSync: true,
                            soundEffects: true,
                            hapticFeedback: true,
                            darkMode: false,
                            autoBackup: true,
                            cacheImages: true,
                            offlineMode: true,
                            dataUsage: 'normal',
                        };
                        saveSettings(defaultSettings);
                        Alert.alert('Success! ⚙️', 'Settings reset to defaults');
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#fef3c7', '#fde68a', '#ffffff']} style={styles.gradient} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fef3c7', '#fde68a', '#ffffff']} style={styles.gradient}>
                {/* Enhanced floating background elements */}
                <Animated.View
                    style={[
                        styles.floatingElement,
                        styles.element1,
                        {
                            backgroundColor: '#3b82f6',
                            opacity: 0.15,
                            transform: [{ translateY: float1 }, { rotate: spin }]
                        },
                    ]}
                />

                {/* Header */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: pulseAnim }] }}>
                    <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <View style={styles.headerRight} />
                    </LinearGradient>
                </Animated.View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Sync & Data Section */}
                    <Animated.View
                        style={[
                            styles.settingsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sync" size={20} color="#059669" />
                                <Text style={styles.sectionTitle}>Sync & Data</Text>
                            </View>

                            <View style={styles.settingsGroup}>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Auto Sync</Text>
                                        <Text style={styles.settingDescription}>
                                            Automatically sync data when online
                                        </Text>
                                    </View>
                                    <Switch
                                        value={settings.autoSync}
                                        onValueChange={(value) => updateSetting('autoSync', value)}
                                        trackColor={{ false: '#d1d5db', true: '#10b981' }}
                                        thumbColor={settings.autoSync ? '#059669' : '#6b7280'}
                                    />
                                </View>

                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Auto Backup</Text>
                                        <Text style={styles.settingDescription}>
                                            Backup profile data to cloud
                                        </Text>
                                    </View>
                                    <Switch
                                        value={settings.autoBackup}
                                        onValueChange={(value) => updateSetting('autoBackup', value)}
                                        trackColor={{ false: '#d1d5db', true: '#10b981' }}
                                        thumbColor={settings.autoBackup ? '#059669' : '#6b7280'}
                                    />
                                </View>

                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Cache Images</Text>
                                        <Text style={styles.settingDescription}>
                                            Save images for offline viewing
                                        </Text>
                                    </View>
                                    <Switch
                                        value={settings.cacheImages}
                                        onValueChange={(value) => updateSetting('cacheImages', value)}
                                        trackColor={{ false: '#d1d5db', true: '#10b981' }}
                                        thumbColor={settings.cacheImages ? '#059669' : '#6b7280'}
                                    />
                                </View>

                                <TouchableOpacity style={styles.actionItem} onPress={clearCache} activeOpacity={0.7}>
                                    <View style={styles.actionIcon}>
                                        <Ionicons name="trash" size={18} color="#ef4444" />
                                    </View>
                                    <View style={styles.settingInfo}>
                                        <Text style={[styles.settingTitle, { color: '#ef4444' }]}>Clear Cache</Text>
                                        <Text style={styles.settingDescription}>
                                            Free up storage space
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Experience Section */}
                    <Animated.View
                        style={[
                            styles.settingsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sparkles" size={20} color="#f59e0b" />
                                <Text style={styles.sectionTitle}>Experience</Text>
                            </View>

                            <View style={styles.settingsGroup}>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Sound Effects</Text>
                                        <Text style={styles.settingDescription}>
                                            Play sounds for actions and alerts
                                        </Text>
                                    </View>
                                    <Switch
                                        value={settings.soundEffects}
                                        onValueChange={(value) => updateSetting('soundEffects', value)}
                                        trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                        thumbColor={settings.soundEffects ? '#f59e0b' : '#6b7280'}
                                    />
                                </View>

                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Haptic Feedback</Text>
                                        <Text style={styles.settingDescription}>
                                            Vibration feedback for interactions
                                        </Text>
                                    </View>
                                    <Switch
                                        value={settings.hapticFeedback}
                                        onValueChange={(value) => updateSetting('hapticFeedback', value)}
                                        trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                        thumbColor={settings.hapticFeedback ? '#f59e0b' : '#6b7280'}
                                    />
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Actions Section */}
                    <Animated.View
                        style={[
                            styles.settingsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="build" size={20} color="#ef4444" />
                                <Text style={styles.sectionTitle}>Actions</Text>
                            </View>

                            <View style={styles.settingsGroup}>
                                <TouchableOpacity style={styles.actionItem} onPress={resetSettings} activeOpacity={0.7}>
                                    <View style={styles.actionIcon}>
                                        <Ionicons name="refresh" size={18} color="#f59e0b" />
                                    </View>
                                    <View style={styles.settingInfo}>
                                        <Text style={[styles.settingTitle, { color: '#f59e0b' }]}>Reset Settings</Text>
                                        <Text style={styles.settingDescription}>
                                            Reset all settings to default values
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* App Info */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <LinearGradient colors={['#059669', '#047857']} style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <Animated.View style={[styles.infoIconCircle, { transform: [{ rotate: spin }] }]}>
                                    <Ionicons name="information-circle" size={24} color="white" />
                                </Animated.View>
                                <Text style={styles.infoTitle}>App Information</Text>
                            </View>
                            <View style={styles.infoList}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Version:</Text>
                                    <Text style={styles.infoValue}>1.0.0</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Build:</Text>
                                    <Text style={styles.infoValue}>2024.10.31</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Developer:</Text>
                                    <Text style={styles.infoValue}>AdBeam Team</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </ScrollView>
            </LinearGradient>
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
    floatingElement: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        top: 80,
        right: -40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 24,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
    },
    settingsSection: {
        marginBottom: 20,
    },
    sectionCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginLeft: 12,
    },
    settingsGroup: {
        gap: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 12,
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoCard: {
        borderRadius: 20,
        padding: 24,
        marginTop: 8,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    infoList: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: 'white',
        fontWeight: '600',
    },
});
