// Hook that aggregates live user analytics for the Dashboard (FIXED VERSION)
import { useEffect, useState } from 'react';
import { computeWeeklyData, computeMaterialBreakdown } from '../services/analytics';

export function useUserAnalytics(uid) {
    const [weekly, setWeekly] = useState({
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        scans: [0,0,0,0,0,0,0],
        goals: [20,20,20,20,20,20,20]
    });

    // 🚨 FIXED: Initialize with empty array and safety checks
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    async function refresh() {
        if (!uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [w, m] = await Promise.all([
                computeWeeklyData(uid),
                computeMaterialBreakdown(uid)
            ]);

            if (w.success && w.data) {
                setWeekly(w.data);
            }

            if (m.success && m.data) {
                // 🚨 SAFETY CHECK: Ensure we have valid material data
                const validMaterials = m.data.filter(item => item && item.name && typeof item.count === 'number');
                setMaterials(validMaterials);
            }
        } catch (error) {
            console.error('Error refreshing analytics:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (uid) {
            refresh();
        } else {
            setLoading(false);
        }
    }, [uid]);

    return { weekly, materials, loading, refresh };
}
