import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, TextInput, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { addTestPoints, resetUserPoints } from '../services/database';
import { colors, gradients } from '../theme/colors';

export default function AdminDashboardScreen() {
    const { user } = useAuth();
    const [pointsToAdd, setPointsToAdd] = useState('1000');

    const handleAddPoints = async () => {
        const points = parseInt(pointsToAdd);
        if (isNaN(points) || points <= 0) {
            Alert.alert('Error', 'Please enter a valid number of points');
            return;
        }

        const result = await addTestPoints(user.uid, points);
        if (result.success) {
            Alert.alert(
                'Success! 🎉',
                `Added ${result.pointsAdded} points!\nTotal: ${result.newPoints}\nLevel: ${result.newLevel}`
            );
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleResetPoints = async () => {
        Alert.alert(
            'Reset Points',
            'Are you sure you want to reset all points to 0?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await resetUserPoints(user.uid);
                        if (result.success) {
                            Alert.alert('Success', 'Points reset to 0');
                        } else {
                            Alert.alert('Error', result.error);
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.title}>Development Tools</Text>

                    <TextInput
                        label="Points to Add"
                        value={pointsToAdd}
                        onChangeText={setPointsToAdd}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />

                    <Button
                        mode="contained"
                        onPress={handleAddPoints}
                        style={[styles.button, { backgroundColor: colors.success.main }]}
                    >
                        Add Points
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={handleResetPoints}
                        style={styles.button}
                    >
                        Reset Points to 0
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginBottom: 12,
    },
});
