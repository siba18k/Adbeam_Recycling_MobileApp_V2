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

export default function PrivacyScreen({ navigation }) {
    const [privacySettings, setPrivacySettings] = useState({
        profileVisible: true,
        shareLocation: true,
        shareStats: true,
        allowAnalytics: true,
        dataCollection: true,
        personalizedAds: false,
        shareProgress: true,
        publicLeaderboard: true,
    });

    const [isLoading, setIsLoading] = useState(true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadPrivacySettings();

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
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 20,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 3500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 15000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const loadPrivacySettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('privacySettings');
            if (saved) {
                setPrivacySettings({ ...privacySettings, ...JSON.parse(saved) });
            }
        } catch (error) {
            console.error('Error loading privacy settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const savePrivacySettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));
            setPrivacySettings(newSettings);
        } catch (error) {
            console.error('Error saving privacy settings:', error);
            Alert.alert('Error', 'Failed to save privacy settings');
        }
    };

    const updatePrivacySetting = (key, value) => {
        const newSettings = { ...privacySettings, [key]: value };
        savePrivacySettings(newSettings);
    };

    const deleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Final Confirmation',
                            'Are you absolutely sure? This will permanently delete everything.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete Forever',
                                    style: 'destructive',
                                    onPress: async () => {
                                        Alert.alert('Account Deleted', 'Your account has been deleted');
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const exportData = () => {
        Alert.alert(
            'Export Data',
            'Download a copy of all your data for your records.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Export',
                    onPress: async () => {
                        try {
                            Alert.alert('Success! 📦', 'Your data has been exported and will be emailed to you');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to export data');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fef3c7', '#fde68a', '#ffffff']} style={styles.gradient}>
                {/* Enhanced floating background element */}
                <Animated.View
                    style={[
                        styles.floatingElement,
                        {
                            backgroundColor: '#8b5cf6',
                            opacity: 0.12,
                            transform: [{ translateY: float1 }, { rotate: spin }]
                        },
                    ]}
                />

                {/* Header */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: pulseAnim }] }}>
                    <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Privacy</Text>
                        <View style={styles.headerRight} />
                    </LinearGradient>
                </Animated.View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Privacy */}
                    <Animated.View
                        style={[
                            styles.settingsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="person-circle" size={20} color="#8b5cf6" />
                                <Text style={styles.sectionTitle}>Profile Privacy</Text>
                            </View>

                            <View style={styles.settingsGroup}>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Profile Visible</Text>
                                        <Text style={styles.settingDescription}>
                                            Show your profile to other users
                                        </Text>
                                    </View>
                                    <Switch
                                        value={privacySettings.profileVisible}
                                        onValueChange={(value) => updatePrivacySetting('profileVisible', value)}
                                        trackColor={{ false: '#d1d5db', true: '#a855f7' }}
                                        thumbColor={privacySettings.profileVisible ? '#8b5cf6' : '#6b7280'}
                                    />
                                </View>

                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Public Leaderboard</Text>
                                        <Text style={styles.settingDescription}>
                                            Show your name on public rankings
                                        </Text>
                                    </View>
                                    <Switch
                                        value={privacySettings.publicLeaderboard}
                                        onValueChange={(value) => updatePrivacySetting('publicLeaderboard', value)}
                                        trackColor={{ false: '#d1d5db', true: '#a855f7' }}
                                        thumbColor={privacySettings.publicLeaderboard ? '#8b5cf6' : '#6b7280'}
                                    />
                                </View>

                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Share Progress</Text>
                                        <Text style={styles.settingDescription}>
                                            Allow sharing recycling achievements
                                        </Text>
                                    </View>
                                    <Switch
                                        value={privacySettings.shareProgress}
                                        onValueChange={(value) => updatePrivacySetting('shareProgress', value)}
                                        trackColor={{ false: '#d1d5db', true: '#a855f7' }}
                                        thumbColor={privacySettings.shareProgress ? '#8b5cf6' : '#6b7280'}
                                    />
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Data & Analytics */}
                    <Animated.View
                        style={[
                            styles.settingsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="analytics" size={20} color="#f59e0b" />
                                <Text style={styles.sectionTitle}>Data & Analytics</Text>
                            </View>

                            <View style={styles.settingsGroup}>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Analytics</Text>
                                        <Text style={styles.settingDescription}>
                                            Help improve the app with usage data
                                        </Text>
                                    </View>
                                    <Switch
                                        value={privacySettings.allowAnalytics}
                                        onValueChange={(value) => updatePrivacySetting('allowAnalytics', value)}
                                        trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                        thumbColor={privacySettings.allowAnalytics ? '#f59e0b' : '#6b7280'}
                                    />
                                </View>

                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Data Collection</Text>
                                        <Text style={styles.settingDescription}>
                                            Collect data to improve features
                                        </Text>
                                    </View>
                                    <Switch
                                        value={privacySettings.dataCollection}
                                        onValueChange={(value) => updatePrivacySetting('dataCollection', value)}
                                        trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                        thumbColor={privacySettings.dataCollection ? '#f59e0b' : '#6b7280'}
                                    />
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Data Management */}
                    <Animated.View
                        style={[
                            styles.settingsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="folder" size={20} color="#059669" />
                                <Text style={styles.sectionTitle}>Data Management</Text>
                            </View>

                            <View style={styles.settingsGroup}>
                                <TouchableOpacity style={styles.actionItem} onPress={exportData} activeOpacity={0.7}>
                                    <View style={styles.actionIcon}>
                                        <Ionicons name="download" size={18} color="#059669" />
                                    </View>
                                    <View style={styles.settingInfo}>
                                        <Text style={[styles.settingTitle, { color: '#059669' }]}>Export Data</Text>
                                        <Text style={styles.settingDescription}>
                                            Download your data and activity
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionItem} onPress={deleteAccount} activeOpacity={0.7}>
                                    <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                                        <Ionicons name="trash" size={18} color="#ef4444" />
                                    </View>
                                    <View style={styles.settingInfo}>
                                        <Text style={[styles.settingTitle, { color: '#ef4444' }]}>Delete Account</Text>
                                        <Text style={styles.settingDescription}>
                                            Permanently delete your account
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Privacy Info */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <Animated.View style={[styles.infoIconCircle, { transform: [{ rotate: spin }] }]}>
                                    <Ionicons name="shield-checkmark" size={24} color="white" />
                                </Animated.View>
                                <Text style={styles.infoTitle}>Your Privacy Matters</Text>
                            </View>
                            <Text style={styles.infoText}>
                                We're committed to protecting your privacy. You have full control over what data is shared and how it's used.
                                All recycling data is anonymized and used only to improve the campus sustainability program.
                            </Text>
                            <View style={styles.linkContainer}>
                                <TouchableOpacity style={styles.linkButton} activeOpacity={0.7}>
                                    <Text style={styles.linkText}>Privacy Policy</Text>
                                    <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.8)" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.linkButton} activeOpacity={0.7}>
                                    <Text style={styles.linkText}>Terms of Service</Text>
                                    <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.8)" />
                                </TouchableOpacity>
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
        width: 100,
        height: 100,
        borderRadius: 50,
        top: 120,
        left: -30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 24,
        shadowColor: '#8b5cf6',
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
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoCard: {
        borderRadius: 20,
        padding: 24,
        marginTop: 8,
        shadowColor: '#8b5cf6',
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
    infoText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 22,
        marginBottom: 20,
    },
    linkContainer: {
        gap: 12,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    linkText: {
        fontSize: 14,
        color: 'white',
        fontWeight: '600',
    },
});
