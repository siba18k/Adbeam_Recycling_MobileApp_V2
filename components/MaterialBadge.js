import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { recyclingColors } from '../theme/colors';

export const MaterialBadge = ({ material, points }) => {
    const getMaterialColor = (type) => {
        switch (type.toLowerCase()) {
            case 'plastic': return [recyclingColors.plastic, '#60a5fa'];
            case 'glass': return [recyclingColors.glass, '#6ee7b7'];
            case 'metal': return [recyclingColors.metal, '#94a3b8'];
            case 'paper': return [recyclingColors.paper, '#fbbf24'];
            default: return [recyclingColors.glass, '#6ee7b7'];
        }
    };

    return (
        <LinearGradient
            colors={getMaterialColor(material)}
            style={styles.badge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <Text style={styles.materialText}>{material}</Text>
            <Text style={styles.pointsText}>+{points} pts</Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: 100,
    },
    materialText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
    pointsText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
    },
});
