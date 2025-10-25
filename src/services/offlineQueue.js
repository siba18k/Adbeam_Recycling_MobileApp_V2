import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { recordScan } from './database';

const QUEUE_KEY = '@adbeam_scan_queue';

/**
 * Add a scan to the offline queue when no internet connection
 */
export const addToQueue = async (scanData) => {
    try {
        const queue = await getQueue();
        const queueItem = {
            ...scanData,
            queuedAt: new Date().toISOString(),
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };

        queue.push(queueItem);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        console.log('✅ Scan added to offline queue:', queueItem.id);
        return { success: true, queueId: queueItem.id };
    } catch (error) {
        console.error('❌ Error adding scan to queue:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all items in the offline queue
 */
export const getQueue = async () => {
    try {
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
        console.error('❌ Error getting queue:', error);
        return [];
    }
};

/**
 * Get the number of items in queue
 */
export const getQueueCount = async () => {
    try {
        const queue = await getQueue();
        return queue.length;
    } catch (error) {
        console.error('❌ Error getting queue count:', error);
        return 0;
    }
};

/**
 * Process all queued scans when internet connection is restored
 */
export const processQueue = async (userId) => {
    try {
        const queue = await getQueue();

        if (queue.length === 0) {
            return {
                success: true,
                processed: 0,
                message: 'No items in queue'
            };
        }

        // Check internet connection
        const netInfo = await NetInfo.fetch();

        if (!netInfo.isConnected) {
            return {
                success: false,
                error: "No internet connection",
                queued: queue.length
            };
        }

        let processed = 0;
        let failed = [];
        let successfulScans = [];

        console.log(`📤 Processing ${queue.length} queued scans...`);

        // Process each scan in the queue
        for (const scan of queue) {
            try {
                const result = await recordScan(userId, {
                    barcode: scan.barcode,
                    materialType: scan.materialType,
                    points: scan.points,
                    location: scan.location
                });

                if (result.success) {
                    processed++;
                    successfulScans.push({
                        ...scan,
                        processedAt: new Date().toISOString(),
                        points: result.points
                    });
                    console.log(`✅ Processed queued scan: ${scan.id}`);
                } else {
                    failed.push(scan);
                    console.error(`❌ Failed to process scan ${scan.id}:`, result.error);
                }
            } catch (error) {
                failed.push(scan);
                console.error(`❌ Error processing scan ${scan.id}:`, error);
            }
        }

        // Keep only failed scans in queue
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));

        console.log(`📊 Queue processing complete: ${processed} processed, ${failed.length} failed`);

        return {
            success: true,
            processed,
            failed: failed.length,
            total: queue.length,
            successfulScans,
            message: `Processed ${processed} of ${queue.length} queued scans`
        };
    } catch (error) {
        console.error('❌ Error processing queue:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear the entire offline queue
 */
export const clearQueue = async () => {
    try {
        await AsyncStorage.removeItem(QUEUE_KEY);
        console.log('🗑️ Offline queue cleared');
        return { success: true };
    } catch (error) {
        console.error('❌ Error clearing queue:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove a specific item from the queue
 */
export const removeFromQueue = async (queueId) => {
    try {
        const queue = await getQueue();
        const filteredQueue = queue.filter(item => item.id !== queueId);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));

        console.log(`🗑️ Removed item ${queueId} from queue`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error removing from queue:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if device is online and auto-process queue
 */
export const checkAndProcessQueue = async (userId) => {
    try {
        const netInfo = await NetInfo.fetch();

        if (netInfo.isConnected) {
            const queueCount = await getQueueCount();

            if (queueCount > 0) {
                console.log(`🔄 Device back online, processing ${queueCount} queued scans...`);
                return await processQueue(userId);
            }
        }

        return { success: true, processed: 0, message: 'No processing needed' };
    } catch (error) {
        console.error('❌ Error in auto-process queue:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get queue statistics for display
 */
export const getQueueStats = async () => {
    try {
        const queue = await getQueue();
        const now = new Date();

        const stats = {
            total: queue.length,
            today: 0,
            thisWeek: 0,
            oldest: null,
            newest: null
        };

        if (queue.length > 0) {
            const dates = queue.map(item => new Date(item.queuedAt));
            stats.oldest = Math.min(...dates);
            stats.newest = Math.max(...dates);

            // Count items from today and this week
            stats.today = queue.filter(item => {
                const itemDate = new Date(item.queuedAt);
                return itemDate.toDateString() === now.toDateString();
            }).length;

            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            stats.thisWeek = queue.filter(item => {
                const itemDate = new Date(item.queuedAt);
                return itemDate >= weekAgo;
            }).length;
        }

        return { success: true, stats };
    } catch (error) {
        console.error('❌ Error getting queue stats:', error);
        return { success: false, error: error.message, stats: null };
    }
};

// Set up network listener to auto-process queue when connection restored
export const setupOfflineQueueListener = (userId) => {
    return NetInfo.addEventListener(async (state) => {
        if (state.isConnected) {
            console.log('🌐 Network connection restored');
            await checkAndProcessQueue(userId);
        } else {
            console.log('📱 Device went offline');
        }
    });
};

export default {
    addToQueue,
    getQueue,
    getQueueCount,
    processQueue,
    clearQueue,
    removeFromQueue,
    checkAndProcessQueue,
    getQueueStats,
    setupOfflineQueueListener
};
