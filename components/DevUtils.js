import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { seedRewards } from '../scripts/seedData';

export default function DevUtils() {
    const [loading, setLoading] = useState(false);

    const runSeed = async () => {
        setLoading(true);
        const result = await seedRewards();
        if (result.success) {
            Alert.alert('Success!', 'Database seeded successfully');
        } else {
            Alert.alert('Error', result.error);
        }
        setLoading(false);
    };

    // Only show in development
    if (__DEV__) {
        return (
            <View style={{ margin: 20 }}>
                <Button
                    mode="outlined"
                    onPress={runSeed}
                    loading={loading}
                >
                    🌱 Seed Database
                </Button>
            </View>
        );
    }

    return null;
}
