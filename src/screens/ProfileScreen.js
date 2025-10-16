import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    FlatList,
    Modal
} from 'react-native';
import {
    Text,
    Card,
    Avatar,
    Button,
    TextInput,
    Portal,
    ActivityIndicator,
    Badge
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadProfileImage } from '../services/database';
import { useOffline } from '../context/OfflineContext';
import { colors, gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

// South African Universities List
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
    { id: 'tut', name: 'Tshwane University of Technology', domain: 'tut.ac.za' },
    { id: 'cut', name: 'Central University of Technology', domain: 'cut.ac.za' },
    { id: 'dut', name: 'Durban University of Technology', domain: 'dut.ac.za' },
    { id: 'cput', name: 'Cape Peninsula University of Technology', domain: 'cput.ac.za' },
    { id: 'vu', name: 'Vaal University of Technology', domain: 'vut.ac.za' }
];

export default function ProfileScreen() {
    const { user, userProfile, logout, refreshUserProfile } = useAuth();
    const { isOffline, queueSize } = useOffline();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showUniversityPicker, setShowUniversityPicker] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('online');

    const [editData, setEditData] = useState({
        displayName: '',
        studentNumber: '',
        university: '',
        bio: '',
        phone: ''
    });

    const [universitySearch, setUniversitySearch] = useState('');
    const [filteredUniversities, setFilteredUniversities] = useState(UNIVERSITIES);

    useEffect(() => {
        if (userProfile) {
            setEditData({
                displayName: userProfile.displayName || '',
                studentNumber: userProfile.studentNumber || '',
                university: userProfile.university || '',
                bio: userProfile.bio || '',
                phone: userProfile.phone || ''
            });
        }
    }, [userProfile]);

    useEffect(() => {
        // Monitor connection status
        const unsubscribe = NetInfo.addEventListener(state => {
            setConnectionStatus(state.isConnected ? 'online' : 'offline');
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        // Filter universities based on search
        const filtered = UNIVERSITIES.filter(uni =>
            uni.name.toLowerCase().includes(universitySearch.toLowerCase())
        );
        setFilteredUniversities(filtered);
    }, [universitySearch]);

    const handleImagePicker = () => {
        Alert.alert(
            'Update Profile Photo',
            'Choose how to update your profile photo',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take Photo', onPress: () => openCamera() },
                { text: 'Choose from Gallery', onPress: () => openGallery() }
            ]
        );
    };

    const openCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required to take photos');
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
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    const openGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Gallery permission is required to select photos');
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
            console.error('Gallery error:', error);
            Alert.alert('Error', 'Failed to open gallery');
        }
    };

    const uploadImage = async (imageUri) => {
        try {
            setIsUploadingImage(true);
            const result = await uploadProfileImage(user.uid, imageUri);

            if (result.success) {
                Alert.alert('Success! 📸', 'Profile photo updated successfully!');
                await refreshUserProfile();
            } else {
                Alert.alert('Upload Failed', result.error);
            }
        } catch (error) {
            console.error('Image upload error:', error);
            Alert.alert('Error', 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Validate required fields
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
                phone: editData.phone.trim()
            };

            const result = await updateUserProfile(user.uid, updates);

            if (result.success) {
                Alert.alert('Success! ✅', 'Profile updated successfully!');
                setIsEditing(false);
                await refreshUserProfile();
            } else {
                Alert.alert('Error', result.error);
            }
        } catch (error) {
            console.error('Profile update error:', error);
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
                    }
                }
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
        >
            <View style={styles.universityInfo}>
                <Text style={styles.universityName}>{item.name}</Text>
                <Text style={styles.universityDomain}>{item.domain}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                {/* Connection Status Bar */}
                <View style={styles.statusBar}>
                    <LinearGradient
                        colors={connectionStatus === 'online' ? gradients.success : ['#ef4444', '#dc2626']}
                        style={styles.statusBarGradient}
                    >
                        <View style={styles.statusContent}>
                            <Ionicons
                                name={connectionStatus === 'online' ? 'wifi' : 'wifi-off'}
                                size={16}
                                color="white"
                            />
                            <Text style={styles.statusText}>
                                {connectionStatus === 'online' ? 'Online' : 'Offline'}
                            </Text>
                            {queueSize > 0 && (
                                <>
                                    <View style={styles.statusSeparator} />
                                    <Ionicons name="time" size={14} color="white" />
                                    <Text style={styles.queueText}>
                                        {queueSize} item{queueSize !== 1 ? 's' : ''} queued
                                    </Text>
                                </>
                            )}
                        </View>
                    </LinearGradient>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Profile Header */}
                    <LinearGradient
                        colors={gradients.backgroundPrimary}
                        style={styles.headerCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerContent}>
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={handleImagePicker}
                                disabled={isUploadingImage}
                            >
                                {userProfile?.profileImageUrl ? (
                                    <Avatar.Image
                                        size={100}
                                        source={{ uri: userProfile.profileImageUrl }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <Avatar.Text
                                        size={100}
                                        label={(userProfile?.displayName || 'U').charAt(0).toUpperCase()}
                                        style={styles.avatar}
                                        labelStyle={styles.avatarLabel}
                                    />
                                )}

                                <View style={styles.cameraButton}>
                                    <LinearGradient
                                        colors={gradients.accent}
                                        style={styles.cameraButtonGradient}
                                    >
                                        {isUploadingImage ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Ionicons name="camera" size={16} color="white" />
                                        )}
                                    </LinearGradient>
                                </View>
                            </TouchableOpacity>

                            <Text style={styles.nameText}>
                                {userProfile?.displayName || user?.displayName || 'User'}
                            </Text>
                            <Text style={styles.emailText}>
                                {userProfile?.email || user?.email}
                            </Text>
                            <Text style={styles.universityText}>
                                {userProfile?.university || 'Add your university'}
                            </Text>

                            {/* Level Badge */}
                            <LinearGradient
                                colors={gradients.accent}
                                style={styles.levelBadge}
                            >
                                <Ionicons name="star" size={16} color="white" />
                                <Text style={styles.levelBadgeText}>
                                    Level {userProfile?.level || 1}
                                </Text>
                            </LinearGradient>

                            {/* Quick Edit Button */}
                            {!isEditing && (
                                <TouchableOpacity
                                    style={styles.quickEditButton}
                                    onPress={startEditing}
                                >
                                    <LinearGradient
                                        colors={gradients.secondary}
                                        style={styles.quickEditGradient}
                                    >
                                        <Ionicons name="pencil" size={16} color="white" />
                                        <Text style={styles.quickEditText}>Edit Profile</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>
                    </LinearGradient>

                    {/* Stats Cards */}
                    <View style={styles.statsSection}>
                        <Card style={styles.statCard}>
                            <LinearGradient
                                colors={[colors.success.main, colors.success.light]}
                                style={styles.statGradient}
                            >
                                <View style={styles.statContent}>
                                    <Ionicons name="leaf" size={24} color="white" />
                                    <View style={styles.statText}>
                                        <Text style={styles.statValue}>{userProfile?.totalScans || 0}</Text>
                                        <Text style={styles.statLabel}>Items Recycled</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </Card>

                        <Card style={styles.statCard}>
                            <LinearGradient
                                colors={[colors.primary.main, colors.primary.light]}
                                style={styles.statGradient}
                            >
                                <View style={styles.statContent}>
                                    <Ionicons name="star" size={24} color="white" />
                                    <View style={styles.statText}>
                                        <Text style={styles.statValue}>{userProfile?.points || 0}</Text>
                                        <Text style={styles.statLabel}>Total Points</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </Card>
                    </View>

                    {/* Profile Information Card */}
                    <Card style={styles.infoCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Profile Information</Text>
                            <TouchableOpacity
                                onPress={() => setIsEditing(!isEditing)}
                                disabled={isSaving}
                            >
                                <LinearGradient
                                    colors={isEditing ? gradients.secondary : gradients.primary}
                                    style={styles.editButton}
                                >
                                    <Ionicons
                                        name={isEditing ? 'close' : 'pencil'}
                                        size={16}
                                        color="white"
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {isEditing ? (
                            <View style={styles.editForm}>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        label="Display Name *"
                                        value={editData.displayName}
                                        onChangeText={(text) => setEditData(prev => ({ ...prev, displayName: text }))}
                                        mode="outlined"
                                        left={<TextInput.Icon icon="account-outline" />}
                                        style={styles.input}
                                        theme={{
                                            colors: {
                                                primary: colors.primary.main,
                                                outline: colors.primary.light
                                            }
                                        }}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        label="Student Number *"
                                        value={editData.studentNumber}
                                        onChangeText={(text) => setEditData(prev => ({ ...prev, studentNumber: text }))}
                                        mode="outlined"
                                        keyboardType="numeric"
                                        maxLength={9}
                                        left={<TextInput.Icon icon="school-outline" />}
                                        style={styles.input}
                                        theme={{
                                            colors: {
                                                primary: colors.primary.main,
                                                outline: colors.primary.light
                                            }
                                        }}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <TouchableOpacity
                                        onPress={() => setShowUniversityPicker(true)}
                                        style={styles.universitySelector}
                                    >
                                        <LinearGradient
                                            colors={[colors.surface.white, colors.surface.light]}
                                            style={styles.universitySelectorGradient}
                                        >
                                            <View style={styles.universitySelectorContent}>
                                                <Ionicons name="school" size={20} color={colors.primary.main} />
                                                <View style={styles.universitySelectorText}>
                                                    <Text style={styles.universitySelectorLabel}>University</Text>
                                                    <Text style={styles.universitySelectorValue}>
                                                        {editData.university || 'Select your university'}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        label="Phone Number (Optional)"
                                        value={editData.phone}
                                        onChangeText={(text) => setEditData(prev => ({ ...prev, phone: text }))}
                                        mode="outlined"
                                        keyboardType="phone-pad"
                                        left={<TextInput.Icon icon="phone-outline" />}
                                        style={styles.input}
                                        theme={{
                                            colors: {
                                                primary: colors.primary.main,
                                                outline: colors.primary.light
                                            }
                                        }}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        label="Bio (Optional)"
                                        value={editData.bio}
                                        onChangeText={(text) => setEditData(prev => ({ ...prev, bio: text }))}
                                        mode="outlined"
                                        multiline
                                        numberOfLines={3}
                                        left={<TextInput.Icon icon="text-outline" />}
                                        style={styles.input}
                                        theme={{
                                            colors: {
                                                primary: colors.primary.main,
                                                outline: colors.primary.light
                                            }
                                        }}
                                    />
                                </View>

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleSave}
                                        disabled={isSaving}
                                    >
                                        <LinearGradient
                                            colors={gradients.success}
                                            style={styles.saveButtonGradient}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <>
                                                    <Ionicons name="checkmark" size={20} color="white" />
                                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setIsEditing(false)}
                                        disabled={isSaving}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.infoDisplay}>
                                {/* Tap-to-edit hint */}
                                <View style={styles.editHint}>
                                    <LinearGradient
                                        colors={[colors.primary.light + '40', colors.primary.light + '20']}
                                        style={styles.editHintGradient}
                                    >
                                        <Ionicons name="information-circle" size={16} color={colors.primary.main} />
                                        <Text style={styles.editHintText}>
                                            Tap any field below to edit your information
                                        </Text>
                                    </LinearGradient>
                                </View>

                                <TouchableOpacity style={styles.infoItem} onPress={startEditing}>
                                    <Ionicons name="person-outline" size={20} color={colors.primary.main} />
                                    <View style={styles.infoText}>
                                        <Text style={styles.infoLabel}>Full Name</Text>
                                        <Text style={styles.infoValue}>
                                            {userProfile?.displayName || 'Not set'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.text.light} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.infoItem} onPress={startEditing}>
                                    <Ionicons name="school-outline" size={20} color={colors.primary.main} />
                                    <View style={styles.infoText}>
                                        <Text style={styles.infoLabel}>Student Number</Text>
                                        <Text style={styles.infoValue}>
                                            {userProfile?.studentNumber || 'Not set'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.text.light} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.infoItem} onPress={startEditing}>
                                    <Ionicons name="school" size={20} color={colors.primary.main} />
                                    <View style={styles.infoText}>
                                        <Text style={styles.infoLabel}>University</Text>
                                        <Text style={styles.infoValue}>
                                            {userProfile?.university || 'Not set'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.text.light} />
                                </TouchableOpacity>

                                {userProfile?.phone ? (
                                    <TouchableOpacity style={styles.infoItem} onPress={startEditing}>
                                        <Ionicons name="call-outline" size={20} color={colors.primary.main} />
                                        <View style={styles.infoText}>
                                            <Text style={styles.infoLabel}>Phone</Text>
                                            <Text style={styles.infoValue}>{userProfile.phone}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={colors.text.light} />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.infoItem} onPress={startEditing}>
                                        <Ionicons name="call-outline" size={20} color={colors.text.light} />
                                        <View style={styles.infoText}>
                                            <Text style={styles.infoLabel}>Phone</Text>
                                            <Text style={[styles.infoValue, styles.emptyValue]}>Add phone number</Text>
                                        </View>
                                        <Ionicons name="add" size={16} color={colors.text.light} />
                                    </TouchableOpacity>
                                )}

                                {userProfile?.bio ? (
                                    <TouchableOpacity style={styles.infoItem} onPress={startEditing}>
                                        <Ionicons name="text-outline" size={20} color={colors.primary.main} />
                                        <View style={styles.infoText}>
                                            <Text style={styles.infoLabel}>Bio</Text>
                                            <Text style={styles.infoValue}>{userProfile.bio}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={colors.text.light} />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.infoItem} onPress={startEditing}>
                                        <Ionicons name="text-outline" size={20} color={colors.text.light} />
                                        <View style={styles.infoText}>
                                            <Text style={styles.infoLabel}>Bio</Text>
                                            <Text style={[styles.infoValue, styles.emptyValue]}>Add a bio</Text>
                                        </View>
                                        <Ionicons name="add" size={16} color={colors.text.light} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </Card>

                    {/* Account Settings */}
                    <Card style={styles.settingsCard}>
                        <Text style={styles.cardTitle}>Account Settings</Text>

                        <TouchableOpacity style={styles.settingItem}>
                            <LinearGradient
                                colors={[colors.status.info, colors.status.info + '80']}
                                style={styles.settingIcon}
                            >
                                <Ionicons name="notifications-outline" size={20} color="white" />
                            </LinearGradient>
                            <Text style={styles.settingText}>Notifications</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem}>
                            <LinearGradient
                                colors={[colors.secondary.main, colors.secondary.light]}
                                style={styles.settingIcon}
                            >
                                <Ionicons name="shield-outline" size={20} color="white" />
                            </LinearGradient>
                            <Text style={styles.settingText}>Privacy & Security</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem}>
                            <LinearGradient
                                colors={[colors.accent.main, colors.accent.light]}
                                style={styles.settingIcon}
                            >
                                <Ionicons name="help-circle-outline" size={20} color="white" />
                            </LinearGradient>
                            <Text style={styles.settingText}>Help & Support</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </Card>

                    {/* Offline Sync Status Card */}
                    <Card style={styles.syncCard}>
                        <LinearGradient
                            colors={connectionStatus === 'online' ? gradients.success : ['#64748b', '#94a3b8']}
                            style={styles.syncGradient}
                        >
                            <View style={styles.syncContent}>
                                <View style={styles.syncHeader}>
                                    <Ionicons
                                        name={connectionStatus === 'online' ? 'cloud-done' : 'cloud-offline'}
                                        size={24}
                                        color="white"
                                    />
                                    <Text style={styles.syncTitle}>
                                        {connectionStatus === 'online' ? 'Data Synced' : 'Offline Mode'}
                                    </Text>
                                </View>
                                <Text style={styles.syncDescription}>
                                    {connectionStatus === 'online'
                                        ? 'All your data is synchronized with the server'
                                        : `Your data will sync when you're back online${queueSize > 0 ? ` (${queueSize} items queued)` : ''}`
                                    }
                                </Text>
                                {connectionStatus === 'online' && queueSize === 0 && (
                                    <View style={styles.syncBadge}>
                                        <Ionicons name="checkmark-circle" size={16} color="white" />
                                        <Text style={styles.syncBadgeText}>Up to date</Text>
                                    </View>
                                )}
                            </View>
                        </LinearGradient>
                    </Card>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LinearGradient
                            colors={['#ef4444', '#dc2626']}
                            style={styles.logoutGradient}
                        >
                            <Ionicons name="log-out-outline" size={20} color="white" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>

                {/* University Picker Modal */}
                <Portal>
                    <Modal
                        visible={showUniversityPicker}
                        onDismiss={() => setShowUniversityPicker(false)}
                        contentContainerStyle={styles.modalContainer}
                    >
                        <LinearGradient
                            colors={[colors.surface.white, colors.surface.light]}
                            style={styles.modalContent}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select University</Text>
                                <TouchableOpacity onPress={() => setShowUniversityPicker(false)}>
                                    <Ionicons name="close" size={24} color={colors.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                placeholder="Search universities..."
                                value={universitySearch}
                                onChangeText={setUniversitySearch}
                                mode="outlined"
                                left={<TextInput.Icon icon="magnify" />}
                                style={styles.searchInput}
                                theme={{
                                    colors: {
                                        primary: colors.primary.main,
                                        outline: colors.primary.light
                                    }
                                }}
                            />

                            <FlatList
                                data={filteredUniversities}
                                renderItem={renderUniversityItem}
                                keyExtractor={(item) => item.id}
                                style={styles.universitiesList}
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
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    statusBar: {
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statusBarGradient: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    statusSeparator: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 8,
    },
    queueText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    scrollView: {
        flex: 1,
    },
    headerCard: {
        padding: 30,
        alignItems: 'center',
        margin: 16,
        borderRadius: 20,
        shadowColor: colors.shadow.medium,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    headerContent: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatar: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        shadowColor: colors.shadow.heavy,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    avatarLabel: {
        color: 'white',
        fontWeight: '700',
        fontSize: 36,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        borderRadius: 18,
        overflow: 'hidden',
    },
    cameraButtonGradient: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameText: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    universityText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 16,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
    },
    levelBadgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
    },
    quickEditButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    quickEditGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    quickEditText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    statsSection: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    statGradient: {
        padding: 20,
    },
    statContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 12,
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    infoCard: {
        borderRadius: 16,
        padding: 20,
        margin: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editForm: {
        gap: 16,
    },
    inputContainer: {
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.surface.white,
    },
    universitySelector: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.primary.light,
    },
    universitySelectorGradient: {
        padding: 16,
    },
    universitySelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    universitySelectorText: {
        flex: 1,
        marginLeft: 12,
    },
    universitySelectorLabel: {
        fontSize: 12,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    universitySelectorValue: {
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    saveButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    cancelButton: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.text.light,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: colors.text.secondary,
        fontSize: 16,
        fontWeight: '600',
    },
    infoDisplay: {
        gap: 12,
    },
    editHint: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
    },
    editHintGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    editHintText: {
        color: colors.primary.main,
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 8,
    },
    infoText: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.text.secondary,
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: '500',
    },
    emptyValue: {
        color: colors.text.light,
        fontStyle: 'italic',
    },
    settingsCard: {
        borderRadius: 16,
        padding: 20,
        margin: 16,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingText: {
        flex: 1,
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: '500',
    },
    syncCard: {
        borderRadius: 16,
        margin: 16,
        overflow: 'hidden',
        elevation: 2,
    },
    syncGradient: {
        padding: 16,
    },
    syncContent: {
        alignItems: 'center',
    },
    syncHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    syncTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    syncDescription: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    syncBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    syncBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    logoutButton: {
        margin: 16,
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        maxHeight: '70%',
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
        color: colors.text.primary,
    },
    searchInput: {
        marginBottom: 16,
        backgroundColor: colors.surface.white,
    },
    universitiesList: {
        maxHeight: 300,
    },
    universityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    universityInfo: {
        flex: 1,
    },
    universityName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 2,
    },
    universityDomain: {
        fontSize: 12,
        color: colors.text.secondary,
    },
});
