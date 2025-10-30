import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function GradientButton({
                                           title,
                                           onPress,
                                           colors = ['#27ae60', '#229954'],
                                           style,
                                           textStyle,
                                           disabled = false,
                                           icon,
                                           iconSize = 20,
                                           loading = false,
                                           ActivityIndicator,
                                       }) {
    return (
        <TouchableOpacity
            style={[styles.button, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={disabled ? ['#9ca3af', '#6b7280'] : colors}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <>
                        {icon && <Ionicons name={icon} size={iconSize} color="white" />}
                        <Text style={[styles.text, textStyle]}>{title}</Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
