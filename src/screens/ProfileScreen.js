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
import { updateUserProfile, uploadProfileImage } from '../services/database';
import { useOffline } from '../context/OfflineContext';

const { width } = Dimensions.get('window');

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
        phone: '',
    });

    const [universitySearch, setUniversitySearch] = useState('');
    const [filteredUniversities, setFilteredUniversities] = useState(UNIVERSITIES);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
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
            Animated.spring(headerScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Floating backgrounds
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
        const unsubscribe = NetInfo.addEventListener((state) => {
            setConnectionStatus(state.isConnected ? 'online' : 'offline');
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const filtered = UNIVERSITIES.filter((uni) =>
            uni.name.toLowerCase().includes(universitySearch.toLowerCase())
        );
        setFilteredUniversities(filtered);
    }, [universitySearch]);

    const handleImagePicker = () => {
        Alert.alert('Update Profile Photo', 'Choose how to update your profile photo', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Take Photo', onPress: () => openCamera() },
            { text: 'Choose from Gallery', onPress: () => openGallery() },
        ]);
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
                Alert.alert('Success! 📸', 'Profile photo updated!');
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
                Alert.alert('Success! ✅', 'Profile updated successfully!');
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
        Alert.alert('Logout', 'Are you sure you want to logout?', [
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
        ]);
    };

    const selectUniversity = (university) => {
        setEditData((prev) => ({ ...prev, university: university.name }));
        setShowUniversityPicker(false);
        setUniversitySearch('');
    };

    const startEditing = () => {
        setIsEditing(true);
    };

    const renderUniversityItem = ({ item }) => (
        <TouchableOpacity style={styles.universityItem} onPress={() => selectUniversity(item)} activeOpacity={0.7}>
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

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Profile Header */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: headerScale }] }}>
                        <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.headerCard}>
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={handleImagePicker}
                                disabled={isUploadingImage}
                                activeOpacity={0.8}
                            >
                                <View style={styles.avatarCircle}>
                                    <LinearGradient
                                        colors={['#ffffff', '#d1fae5']}
                                        style={styles.avatarGradient}
                                    >
                                        <Text style={styles.avatarText}>
                                            {(userProfile?.displayName || 'U').charAt(0).toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                </View>

                                <View style={styles.cameraButton}>
                                    <LinearGradient
                                        colors={['#3b82f6', '#2563eb']}
                                        style={styles.cameraButtonGradient}
                                    >
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

                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                                style={styles.levelBadge}
                            >
                                <Ionicons name="star" size={14} color="white" />
                                <Text style={styles.levelBadgeText}>Level {userProfile?.level || 1}</Text>
                            </LinearGradient>

                            {!isEditing && (
                                <TouchableOpacity style={styles.quickEditButton} onPress={startEditing} activeOpacity={0.8}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                                        style={styles.quickEditGradient}
                                    >
                                        <Ionicons name="pencil" size={16} color="white" />
                                        <Text style={styles.quickEditText}>Edit Profile</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </LinearGradient>
                    </Animated.View>

                    {/* Stats Cards */}
                    <Animated.View
                        style={[
                            styles.statsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#27ae60', '#229954']} style={styles.statCard}>
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
                    <Animated.View
                        style={[
                            styles.infoCard,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
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
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Display Name *</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="person" size={18} color="#10b981" />
                                            <TextInput
                                                value={editData.displayName}
                                                onChangeText={(text) =>
                                                    setEditData((prev) => ({ ...prev, displayName: text }))
                                                }
                                                style={styles.textInput}
                                                placeholder="Enter your name"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Student Number *</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="school" size={18} color="#10b981" />
                                            <TextInput
                                                value={editData.studentNumber}
                                                onChangeText={(text) =>
                                                    setEditData((prev) => ({ ...prev, studentNumber: text }))
                                                }
                                                style={styles.textInput}
                                                placeholder="9 digits"
                                                keyboardType="numeric"
                                                maxLength={9}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>University</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowUniversityPicker(true)}
                                            style={styles.inputWrapper}
                                        >
                                            <Ionicons name="school" size={18} color="#10b981" />
                                            <Text
                                                style={[
                                                    styles.textInput,
                                                    !editData.university && styles.placeholderText,
                                                ]}
                                            >
                                                {editData.university || 'Select university'}
                                            </Text>
                                            <Ionicons name="chevron-down" size={18} color="#9ca3af" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Phone (Optional)</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="call" size={18} color="#10b981" />
                                            <TextInput
                                                value={editData.phone}
                                                onChangeText={(text) => setEditData((prev) => ({ ...prev, phone: text }))}
                                                style={styles.textInput}
                                                placeholder="Phone number"
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Bio (Optional)</Text>
                                        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                            <Ionicons name="text" size={18} color="#10b981" style={styles.textAreaIcon} />
                                            <TextInput
                                                value={editData.bio}
                                                onChangeText={(text) => setEditData((prev) => ({ ...prev, bio: text }))}
                                                style={[styles.textInput, styles.textArea]}
                                                placeholder="Tell us about yourself..."
                                                multiline
                                                numberOfLines={3}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={handleSave}
                                            disabled={isSaving}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={['#27ae60', '#229954']}
                                                style={styles.saveButtonGradient}
                                            >
                                                {isSaving ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="checkmark" size={20} color="white" />
                                                        <Text style={styles.saveButtonText}>Save</Text>
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
                                    {[
                                        {
                                            icon: 'person',
                                            label: 'Full Name',
                                            value: userProfile?.displayName || 'Not set',
                                        },
                                        {
                                            icon: 'school',
                                            label: 'Student Number',
                                            value: userProfile?.studentNumber || 'Not set',
                                        },
                                        {
                                            icon: 'school',
                                            label: 'University',
                                            value: userProfile?.university || 'Not set',
                                        },
                                        {
                                            icon: 'call',
                                            label: 'Phone',
                                            value: userProfile?.phone || 'Add phone',
                                            optional: true,
                                        },
                                        { icon: 'text', label: 'Bio', value: userProfile?.bio || 'Add bio', optional: true },
                                    ].map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.infoItem}
                                            onPress={startEditing}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name={item.icon} size={20} color="#10b981" />
                                            <View style={styles.infoText}>
                                                <Text style={styles.infoLabel}>{item.label}</Text>
                                                <Text
                                                    style={[
                                                        styles.infoValue,
                                                        item.optional && !userProfile?.[item.label.toLowerCase()] && styles.emptyValue,
                                                    ]}
                                                >
                                                    {item.value}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </LinearGradient>
                    </Animated.View>

                    {/* Sync Status */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <LinearGradient
                            colors={connectionStatus === 'online' ? ['#27ae60', '#229954'] : ['#64748b', '#94a3b8']}
                            style={styles.syncCard}
                        >
                            <View style={styles.syncIconCircle}>
                                <Ionicons
                                    name={connectionStatus === 'online' ? 'cloud-done' : 'cloud-offline'}
                                    size={24}
                                    color="white"
                                />
                            </View>
                            <Text style={styles.syncTitle}>
                                {connectionStatus === 'online' ? 'Data Synced' : 'Offline Mode'}
                            </Text>
                            <Text style={styles.syncDescription}>
                                {connectionStatus === 'online'
                                    ? 'All data is synchronized'
                                    : `Will sync when online${queueSize > 0 ? ` (${queueSize} items)` : ''}`}
                            </Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.logoutGradient}>
                            <Ionicons name="log-out" size={20} color="white" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>

                {/* University Picker Modal */}
                <Portal>
                    <Modal
                        visible={showUniversityPicker}
                        onDismiss={() => setShowUniversityPicker(false)}
                        transparent
                        animationType="slide"
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Select University</Text>
                                        <TouchableOpacity onPress={() => setShowUniversityPicker(false)}>
                                            <Ionicons name="close" size={24} color="#1f2937" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.searchWrapper}>
                                        <Ionicons name="search" size={18} color="#9ca3af" />
                                        <TextInput
                                            placeholder="Search universities..."
                                            value={universitySearch}
                                            onChangeText={setUniversitySearch}
                                            style={styles.searchInput}
                                        />
                                    </View>

                                    <FlatList
                                        data={filteredUniversities}
                                        renderItem={renderUniversityItem}
                                        keyExtractor={(item) => item.id}
                                        style={styles.universitiesList}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </LinearGradient>
                            </View>
                        </View>
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
    floatingCircle: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.1,
        backgroundColor: '#10b981',
    },
    circle1: {
        width: 150,
        height: 150,
        top: 100,
        right: -50,
    },
    circle2: {
        width: 120,
        height: 120,
        bottom: 200,
        left: -40,
    },
    statusBar: {
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statusBarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
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
    },
    scrollView: {
        flex: 1,
    },
    headerCard: {
        padding: 32,
        alignItems: 'center',
        margin: 16,
        borderRadius: 24,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarCircle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    avatarGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#10b981',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 20,
        overflow: 'hidden',
    },
    cameraButtonGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameText: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    universityText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
        textAlign: 'center',
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
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 4,
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    statText: {
        marginLeft: 12,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.95)',
        marginTop: 2,
    },
    infoCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardGradient: {
        padding: 20,
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
        borderRadius: 16,
        overflow: 'hidden',
    },
    editButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editForm: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4b5563',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    textInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1f2937',
    },
    placeholderText: {
        color: '#9ca3af',
    },
    textAreaWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    textAreaIcon: {
        marginTop: 2,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    saveButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#d1d5db',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '600',
    },
    infoDisplay: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    infoText: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#1f2937',
        fontWeight: '500',
    },
    emptyValue: {
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    syncCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    syncIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    syncTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginBottom: 6,
    },
    syncDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 18,
    },
    logoutButton: {
        marginHorizontal: 16,
        marginBottom: 32,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    modalContent: {
        padding: 20,
        paddingBottom: 40,
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
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1f2937',
    },
    universitiesList: {
        maxHeight: 400,
    },
    universityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    universityInfo: {
        flex: 1,
    },
    universityName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    universityDomain: {
        fontSize: 12,
        color: '#6b7280',
    },
});
