import * as Location from 'expo-location';

// Campus boundaries (example - adjust to your actual campus)
const CAMPUS_BOUNDARIES = {
    latitude: -26.1844, // Example: University of Johannesburg APK Campus
    longitude: 28.0287,
    radius: 2000 // 2km radius
};

export const requestLocationPermissions = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error("Error requesting location permissions:", error);
        return false;
    }
};

export const getCurrentLocation = async () => {
    try {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
        });
        return {
            success: true,
            location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy
            }
        };
    } catch (error) {
        console.error("Error getting location:", error);
        return { success: false, error: error.message };
    }
};

export const isOnCampus = (userLocation) => {
    const distance = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        CAMPUS_BOUNDARIES.latitude,
        CAMPUS_BOUNDARIES.longitude
    );

    return distance <= CAMPUS_BOUNDARIES.radius;
};

// Haversine formula to calculate distance
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export const validateScanLocation = async () => {
    const hasPermission = await requestLocationPermissions();

    if (!hasPermission) {
        return {
            valid: false,
            error: "Location permission denied"
        };
    }

    const locationResult = await getCurrentLocation();

    if (!locationResult.success) {
        return {
            valid: false,
            error: "Could not get location"
        };
    }

    const onCampus = isOnCampus(locationResult.location);

    return {
        valid: onCampus,
        location: locationResult.location,
        error: onCampus ? null : "You must be on campus to scan items"
    };
};
