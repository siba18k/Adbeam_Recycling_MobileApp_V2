import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function SocialShareButton({
                                      achievement,
                                      stats,
                                      message = "Just achieved something amazing in recycling!"
                                  }) {
    const handleShare = async () => {
        try {
            const shareMessage = `🌱 ${message}\n\n` +
                `🏆 Achievement: ${achievement?.name || 'Eco Progress'}\n` +
                `♻️ Items Recycled: ${stats?.totalScans || 0}\n` +
                `🌍 CO₂ Saved: ${stats?.co2Saved || 0}kg\n` +
                `⭐ Level: ${stats?.level || 1}\n\n` +
                `Join me in making campus sustainable! #AdbeamRecycling #EcoWarrior`;

            await Share.share({
                message: shareMessage,
                title: 'My Recycling Achievement!',
            });
        } catch (error) {
            Alert.alert('Share Error', 'Could not share achievement');
        }
    };

    return (
        <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
        >
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.shareGradient}>
                <Ionicons name="share-social" size={16} color="white" />
                <Text style={styles.shareText}>Share Achievement</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    shareButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    shareGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 6,
    },
    shareText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
});
