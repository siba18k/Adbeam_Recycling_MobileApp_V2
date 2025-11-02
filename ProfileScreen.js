import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Animated,
} from 'react-native';
import { Text, TextInput, ActivityIndicator, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadProfileImage, addTestPointsToUser, resetUserPointsAndLevel } from '../services/database';
import { useOffline } from '../context/OfflineContext';

const { width, height } = Dimensions.get('window');

const UNIVERSITIES = [
    { id: 'uj', name: 'University of Johannesburg', domain: 'uj.ac.za' },
    { id: 'wits', name: 'University of the Witwatersrand', domain: 'wits.ac.za' },
    { id: 'uct', name: 'University of Cape Town', domain: 'uct.ac.za' },
    { id: 'up', name: 'University of Pretoria', domain: 'up.ac.za' },
    { id: 'ukzn', name: 'University of KwaZulu-Natal', domain: 'ukzn.ac.za' },
    { id: 'sun', name: 'Stellenbosch University', domain: 'sun.ac.za' },
    { id: 'nwu', name: 'North-West University', domain: 'nwu.ac.za' },
    { id: 'ru', name: 'Rhodes University', domain: 'ru.ac.za' },
    { id: 'ufs', name: 'University of the Free State', domain: 'ufs.ac.za' },
    { id: 'unisa', name: 'University of South Africa', domain: 'unisa.ac.za' },
];

export default function ProfileScreen({ navigation }) {
    const { user, userProfile, logout, refreshUserProfile } = useAuth();
    const { isOffline, queueSize } = useOffline();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showUniversityPicker, setShowUniversityPicker] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('online');

    // DEVELOPER TESTING STATE - ONLY ADDITION
    const [showDevTools, setShowDevTools] = useState(false);
    const [devClickCount, setDevClickCount] = useState(0);

    const [editData, setEditData] = useState({
        displayName: '',
        studentNumber: '',
        university: '',
        bio: '',
        phone: '',
    });

    const [universitySearch, setUniversitySearch] = useState('');
    const [filteredUniversities, setFilteredUniversities] = useState(UNIVERSITIES);

    // Gentle animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Gentle entrance animations
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
            Animated.spring(headerScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Subtle floating backgrounds
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

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    useEffect(() => {
        if (userProfile) {
            setEditData({
                displayName: userProfile.displayName || '',
                studentNumber: userProfile.studentNumber || '',
                university: userProfile.university || '',
                bio: userProfile.bio || '',
                phone: userProfile.phone || '',
            });
        }
    }, [userProfile]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setConnectionStatus(state.isConnected ? 'online' : 'offline');
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const filtered = UNIVERSITIES.filter(uni =>
            uni.name.toLowerCase().includes(universitySearch.toLowerCase())
        );
        setFilteredUniversities(filtered);
    }, [universitySearch]);

    // DEVELOPER TESTING FUNCTIONS - ONLY ADDITIONS
    const handleDevClick = () => {
        const newCount = devClickCount + 1;
        setDevClickCount(newCount);

        if (newCount >= 7 && !showDevTools) {
            setShowDevTools(true);
            Alert.alert('🔧 Developer Mode', 'Developer tools unlocked! Scroll down to see testing options.');
        }
    };

    const addTestPoints = async (pointsToAdd) => {
        try {
            setSaving(true);

            // Use the enhanced database function
            const result = await addTestPointsToUser(user.uid, pointsToAdd);

            if (result.success) {
                Alert.alert(
                    '🎉 Points Added!',
                    `Added ${pointsToAdd} points!\n\nNew Total: ${result.newPoints} points\nLevel: ${result.newLevel}${result.levelUp ? ' 🎊 LEVEL UP!' : ''}`
                );
                await refreshUserProfile();
            } else {
                Alert.alert('Error', result.error || 'Failed to add points');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add points: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const resetPoints = async () => {
        Alert.alert(
            '⚠️ Reset Points',
            'This will reset your points to 0, level to 1, and total scans to 0. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setSaving(true);

                            // Use the enhanced database function
                            const result = await resetUserPointsAndLevel(user.uid);

                            if (result.success) {
                                Alert.alert('✅ Reset Complete', 'Points reset to 0, Level reset to 1');
                                await refreshUserProfile();
                            } else {
                                Alert.alert('Error', result.error || 'Failed to reset points');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reset points: ' + error.message);
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ]
        );
    };

    const handleImagePicker = () => {
        Alert.alert(
            'Update Profile Photo',
            'Choose how to update your profile photo',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take Photo', onPress: openCamera },
                { text: 'Choose from Gallery', onPress: openGallery },
            ]
        );
    };

    const openCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    const openGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Gallery permission is required');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open gallery');
        }
    };

    const uploadImage = async (imageUri) => {
        try {
            setIsUploadingImage(true);
            const result = await uploadProfileImage(user.uid, imageUri);
            if (result.success) {
                Alert.alert('Success!', 'Profile photo updated!');
                await refreshUserProfile();
            } else {
                Alert.alert('Upload Failed', result.error);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            if (!editData.displayName.trim()) {
                Alert.alert('Error', 'Display name is required');
                return;
            }

            if (!editData.studentNumber.trim()) {
                Alert.alert('Error', 'Student number is required');
                return;
            }

            if (!/^\d{9}$/.test(editData.studentNumber)) {
                Alert.alert('Error', 'Student number must be 9 digits');
                return;
            }

            const updates = {
                displayName: editData.displayName.trim(),
                studentNumber: editData.studentNumber.trim(),
                university: editData.university.trim(),
                bio: editData.bio.trim(),
                phone: editData.phone.trim(),
            };

            const result = await updateUserProfile(user.uid, updates);
            if (result.success) {
                Alert.alert('Success!', 'Profile updated successfully!');
                setIsEditing(false);
                await refreshUserProfile();
            } else {
                Alert.alert('Error', result.error);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await logout();
                        if (!result.success) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    },
                },
            ]
        );
    };

    const selectUniversity = (university) => {
        setEditData(prev => ({ ...prev, university: university.name }));
        setShowUniversityPicker(false);
        setUniversitySearch('');
    };

    const startEditing = () => {
        setIsEditing(true);
    };

    const renderUniversityItem = ({ item }) => (
        <TouchableOpacity
            style={styles.universityItem}
            onPress={() => selectUniversity(item)}
            activeOpacity={0.7}
        >
            <View style={styles.universityInfo}>
                <Text style={styles.universityName}>{item.name}</Text>
                <Text style={styles.universityDomain}>{item.domain}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fef3c7', '#fde68a', '#ffffff']} style={styles.gradient}>
                {/* Floating circles */}
                <Animated.View style={[
                    styles.floatingCircle,
                    styles.circle1,
                    { transform: [{ translateY: float1 }, { rotate: spin }] }
                ]} />
                <Animated.View style={[
                    styles.floatingCircle,
                    styles.circle2,
                    { transform: [{ translateY: float2 }] }
                ]} />

                {/* Connection Status Bar */}
                {connectionStatus === 'offline' && (
                    <Animated.View style={[styles.statusBar, { opacity: fadeAnim }]}>
                        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.statusBarGradient}>
                            <Ionicons name="wifi-off" size={16} color="white" />
                            <Text style={styles.statusText}>Offline</Text>
                            {queueSize > 0 && (
                                <>
                                    <View style={styles.statusSeparator} />
                                    <Text style={styles.queueText}>{queueSize} queued</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Animated.View>
                )}

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Header */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: headerScale }] }}>
                        <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.headerCard}>
                            {/* MODIFIED: Made avatar clickable for dev mode */}
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={handleDevClick}
                                disabled={isUploadingImage}
                                activeOpacity={0.8}
                            >
                                <View style={styles.avatarCircle}>
                                    <LinearGradient colors={['#ffffff', '#d1fae5']} style={styles.avatarGradient}>
                                        <Text style={styles.avatarText}>
                                            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                                        </Text>
                                    </LinearGradient>
                                </View>

                                <View style={styles.cameraButton}>
                                    <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.cameraButtonGradient}>
                                        {isUploadingImage ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Ionicons name="camera" size={18} color="white" />
                                        )}
                                    </LinearGradient>
                                </View>
                            </TouchableOpacity>

                            <Text style={styles.nameText}>{userProfile?.displayName || 'User'}</Text>
                            <Text style={styles.emailText}>{userProfile?.email || user?.email}</Text>
                            <Text style={styles.universityText}>{userProfile?.university || 'Add your university'}</Text>

                            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']} style={styles.levelBadge}>
                                <Ionicons name="star" size={14} color="white" />
                                <Text style={styles.levelBadgeText}>Level {userProfile?.level || 1}</Text>
                            </LinearGradient>

                            {!isEditing && (
                                <TouchableOpacity style={styles.quickEditButton} onPress={startEditing} activeOpacity={0.8}>
                                    <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']} style={styles.quickEditGradient}>
                                        <Ionicons name="pencil" size={16} color="white" />
                                        <Text style={styles.quickEditText}>Edit Profile</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </LinearGradient>
                    </Animated.View>

                    {/* Stats Cards */}
                    <Animated.View style={[styles.statsSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <LinearGradient colors={['#059669', '#047857']} style={styles.statCard}>
                            <Ionicons name="leaf" size={28} color="white" />
                            <View style={styles.statText}>
                                <Text style={styles.statValue}>{userProfile?.totalScans || 0}</Text>
                                <Text style={styles.statLabel}>Items Recycled</Text>
                            </View>
                        </LinearGradient>

                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statCard}>
                            <Ionicons name="star" size={28} color="white" />
                            <View style={styles.statText}>
                                <Text style={styles.statValue}>{userProfile?.points || 0}</Text>
                                <Text style={styles.statLabel}>Total Points</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Profile Information Card */}
                    <Animated.View style={[styles.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.cardGradient}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Profile Information</Text>
                                <TouchableOpacity
                                    onPress={() => setIsEditing(!isEditing)}
                                    disabled={isSaving}
                                    style={styles.editButtonContainer}
                                >
                                    <LinearGradient
                                        colors={isEditing ? ['#ef4444', '#dc2626'] : ['#10b981', '#059669']}
                                        style={styles.editButton}
                                    >
                                        <Ionicons name={isEditing ? 'close' : 'pencil'} size={16} color="white" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {isEditing ? (
                                <View style={styles.editForm}>
                                    {/* Display Name */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Display Name</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="person" size={18} color="#10b981" />
                                            <TextInput
                                                value={editData.displayName}
                                                onChangeText={(text) => setEditData(prev => ({ ...prev, displayName: text }))}
                                                style={styles.textInput}
                                                placeholder="Enter your name"
                                            />
                                        </View>
                                    </View>

                                    {/* Student Number */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Student Number</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="school" size={18} color="#10b981" />
                                            <TextInput
                                                value={editData.studentNumber}
                                                onChangeText={(text) => setEditData(prev => ({ ...prev, studentNumber: text }))}
                                                style={styles.textInput}
                                                placeholder="9 digits"
                                                keyboardType="numeric"
                                                maxLength={9}
                                            />
                                        </View>
                                    </View>

                                    {/* University */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>University</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowUniversityPicker(true)}
                                            style={styles.inputWrapper}
                                        >
                                            <Ionicons name="school" size={18} color="#10b981" />
                                            <Text style={[
                                                styles.textInput,
                                                !editData.university && styles.placeholderText,
                                            ]}>
                                                {editData.university || 'Select university'}
                                            </Text>
                                            <Ionicons name="chevron-down" size={18} color="#9ca3af" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Phone */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Phone (Optional)</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="call" size={18} color="#10b981" />
                                            <TextInput
                                                value={editData.phone}
                                                onChangeText={(text) => setEditData(prev => ({ ...prev, phone: text }))}
                                                style={styles.textInput}
                                                placeholder="Add phone"
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </View>

                                    {/* Bio */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Bio (Optional)</Text>
                                        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                            <Ionicons name="text" size={18} color="#10b981" style={styles.textAreaIcon} />
                                            <TextInput
                                                value={editData.bio}
                                                onChangeText={(text) => setEditData(prev => ({ ...prev, bio: text }))}
                                                style={[styles.textInput, styles.textArea]}
                                                placeholder="Add bio"
                                                multiline
                                                numberOfLines={3}
                                            />
                                        </View>
                                    </View>

                                    {/* Save Button */}
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleSave}
                                        disabled={isSaving}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient colors={['#10b981', '#059669']} style={styles.saveGradient}>
                                            {isSaving ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <>
                                                    <Ionicons name="checkmark" size={20} color="white" />
                                                    <Text style={styles.saveText}>Save Changes</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.displayInfo}>
                                    <View style={styles.infoItem}>
                                        <Ionicons name="person" size={18} color="#6b7280" />
                                        <Text style={styles.infoValue}>{userProfile?.displayName || 'Not set'}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Ionicons name="school" size={18} color="#6b7280" />
                                        <Text style={styles.infoValue}>{userProfile?.studentNumber || 'Not set'}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Ionicons name="library" size={18} color="#6b7280" />
                                        <Text style={styles.infoValue}>{userProfile?.university || 'Not set'}</Text>
                                    </View>
                                    {userProfile?.phone && (
                                        <View style={styles.infoItem}>
                                            <Ionicons name="call" size={18} color="#6b7280" />
                                            <Text style={styles.infoValue}>{userProfile.phone}</Text>
                                        </View>
                                    )}
                                    {userProfile?.bio && (
                                        <View style={styles.infoItem}>
                                            <Ionicons name="text" size={18} color="#6b7280" />
                                            <Text style={styles.infoValue}>{userProfile.bio}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </LinearGradient>
                    </Animated.View>

                    {/* DEVELOPER TESTING PANEL - ONLY ADDITION */}
                    {showDevTools && (
                        <Animated.View style={[styles.devToolsPanel, { opacity: fadeAnim }]}>
                            <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.devToolsGradient}>
                                <View style={styles.devToolsHeader}>
                                    <View style={styles.devToolsTitle}>
                                        <Ionicons name="construct" size={20} color="white" />
                                        <Text style={styles.devToolsLabel}>🔧 Developer Testing</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowDevTools(false)}
                                        style={styles.hideDevButton}
                                    >
                                        <Ionicons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.devToolsDescription}>
                                    Testing tools for point system and level progression
                                </Text>

                                <View style={styles.devButtonsGrid}>
                                    <TouchableOpacity
                                        style={styles.devButton}
                                        onPress={() => addTestPoints(50)}
                                        activeOpacity={0.8}
                                        disabled={isSaving}
                                    >
                                        <LinearGradient colors={['#10b981', '#059669']} style={styles.devButtonGradient}>
                                            <Ionicons name="add-circle" size={18} color="white" />
                                            <Text style={styles.devButtonText}>+50 Points</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.devButton}
                                        onPress={() => addTestPoints(100)}
                                        activeOpacity={0.8}
                                        disabled={isSaving}
                                    >
                                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.devButtonGradient}>
                                            <Ionicons name="add-circle" size={18} color="white" />
                                            <Text style={styles.devButtonText}>+100 Points</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.devButton}
                                        onPress={() => addTestPoints(500)}
                                        activeOpacity={0.8}
                                        disabled={isSaving}
                                    >
                                        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.devButtonGradient}>
                                            <Ionicons name="add-circle" size={18} color="white" />
                                            <Text style={styles.devButtonText}>+500 Points</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.devButton}
                                        onPress={resetPoints}
                                        activeOpacity={0.8}
                                        disabled={isSaving}
                                    >
                                        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.devButtonGradient}>
                                            <Ionicons name="refresh" size={18} color="white" />
                                            <Text style={styles.devButtonText}>Reset Points</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* App Settings - YOUR EXACT ORIGINAL SECTION */}
                    <Animated.View style={[styles.actionsSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.actionsCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>App Settings</Text>
                                <Ionicons name="settings" size={24} color="#059669" />
                            </View>

                            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')} activeOpacity={0.8}>
                                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionGradient}>
                                    <Ionicons name="cog" size={24} color="white" />
                                    <View style={styles.actionText}>
                                        <Text style={styles.actionTitle}>Settings</Text>
                                        <Text style={styles.actionSubtitle}>App preferences and configuration</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Privacy')} activeOpacity={0.8}>
                                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.actionGradient}>
                                    <Ionicons name="shield-checkmark" size={24} color="white" />
                                    <View style={styles.actionText}>
                                        <Text style={styles.actionTitle}>Privacy</Text>
                                        <Text style={styles.actionSubtitle}>Data privacy and security settings</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.8}>
                                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.actionGradient}>
                                    <Ionicons name="notifications" size={24} color="white" />
                                    <View style={styles.actionText}>
                                        <Text style={styles.actionTitle}>Notifications</Text>
                                        <Text style={styles.actionSubtitle}>Push notifications and alerts</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>

                    {/* Data Synced Status - YOUR EXACT ORIGINAL SECTION */}
                    <Animated.View style={[styles.syncSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <LinearGradient colors={['#059669', '#047857']} style={styles.syncCard}>
                            <View style={styles.syncIcon}>
                                <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']} style={styles.syncIconGradient}>
                                    <Ionicons name="checkmark" size={24} color="white" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.syncTitle}>Data Synced</Text>
                            <Text style={styles.syncSubtitle}>All data is synchronized</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Logout Button - YOUR EXACT ORIGINAL SECTION */}
                    <Animated.View style={[styles.logoutSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.logoutGradient}>
                                <Ionicons name="logout" size={20} color="white" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>

                {/* University Picker Modal */}
                <Portal>
                    <Modal
                        visible={showUniversityPicker}
                        onDismiss={() => setShowUniversityPicker(false)}
                        contentContainerStyle={styles.modalContainer}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.universityModal}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select University</Text>
                                <TouchableOpacity onPress={() => setShowUniversityPicker(false)}>
                                    <Ionicons name="close" size={24} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.searchWrapper}>
                                <Ionicons name="search" size={20} color="#10b981" />
                                <TextInput
                                    value={universitySearch}
                                    onChangeText={setUniversitySearch}
                                    style={styles.searchInput}
                                    placeholder="Search universities..."
                                />
                            </View>

                            <FlatList
                                data={filteredUniversities}
                                renderItem={renderUniversityItem}
                                keyExtractor={item => item.id}
                                style={styles.universityList}
                                showsVerticalScrollIndicator={false}
                            />
                        </LinearGradient>
                    </Modal>
                </Portal>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },

    // Floating background
    floatingCircle: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.1,
        backgroundColor: '#27ae60',
    },
    circle1: {
        width: 150,
        height: 150,
        top: '20%',
        right: -50,
    },
    circle2: {
        width: 120,
        height: 120,
        bottom: '30%',
        left: -40,
    },

    // Status bar
    statusBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    statusBarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    statusText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    statusSeparator: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    queueText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },

    scrollView: { flex: 1 },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
    },

    // Profile Header
    headerCard: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarGradient: {
        flex: 1,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#059669',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    cameraButtonGradient: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nameText: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
        textAlign: 'center',
    },
    universityText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        marginBottom: 16,
    },
    levelBadgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    quickEditButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    quickEditGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 8,
    },
    quickEditText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },

    // Stats Section
    statsSection: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    statText: { flex: 1 },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },

    // Profile Information Card
    infoCard: { marginBottom: 20 },
    cardGradient: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    editButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    editButton: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Edit Form
    editForm: { gap: 20 },
    inputGroup: { gap: 8 },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
        paddingVertical: 0,
    },
    textAreaWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 16,
    },
    textAreaIcon: {
        marginTop: 4,
    },
    textArea: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    placeholderText: {
        color: '#9ca3af',
    },
    saveButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
    },
    saveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    saveText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },

    // Display Info
    displayInfo: { gap: 16 },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    infoValue: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },

    // DEVELOPER TOOLS PANEL STYLES - ONLY ADDITION
    devToolsPanel: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 2,
        borderColor: '#fecaca',
    },
    devToolsGradient: {
        padding: 16,
    },
    devToolsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    devToolsTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    devToolsLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    hideDevButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    devToolsDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 16,
    },
    devButtonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    devButton: {
        width: (width - 64) / 2,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    devButtonGradient: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    devButtonText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },

    // Actions Section - YOUR EXACT ORIGINAL STYLES
    actionsSection: { marginBottom: 20 },
    actionsCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        gap: 12,
    },
    actionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 12,
    },
    actionText: { flex: 1 },
    actionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    actionSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '500',
    },

    // Sync Section - YOUR EXACT ORIGINAL STYLES
    syncSection: { marginBottom: 20 },
    syncCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    syncIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginBottom: 16,
        overflow: 'hidden',
    },
    syncIconGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    syncTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
    },
    syncSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },

    // Logout Section - YOUR EXACT ORIGINAL STYLES
    logoutSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    logoutButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },

    // University Modal
    modalContainer: {
        margin: 20,
        borderRadius: 20,
        overflow: 'hidden',
        maxHeight: height * 0.7,
    },
    universityModal: {
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
        paddingVertical: 0,
    },
    universityList: { maxHeight: 300 },
    universityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    universityInfo: { flex: 1 },
    universityName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    universityDomain: {
        fontSize: 12,
        color: '#6b7280',
    },
});
