import { ref, get } from "firebase/database";
import { database } from "../config/firebase";

// Compute weekly scans (Mon..Sun) and goals (FIXED VERSION)
export async function computeWeeklyData(uid) {
    try {
        if (!uid) {
            return {
                success: false,
                error: 'No user ID provided',
                data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], scans: [0,0,0,0,0,0,0], goals: [20,20,20,20,20,20,20] }
            };
        }

        const scansRef = ref(database, `userScans/${uid}`);
        const snap = await get(scansRef);
        const week = new Array(7).fill(0);
        const goal = new Array(7).fill(20);

        if (snap.exists()) {
            snap.forEach(child => {
                const s = child.val();
                if (s && s.timestamp) {
                    const d = new Date(s.timestamp);
                    const day = d.getDay(); // 0 Sun .. 6 Sat
                    const idx = (day + 6) % 7; // Mon=0 .. Sun=6
                    week[idx] += 1;
                }
            });
        }

        return {
            success: true,
            data: {
                labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                scans: week,
                goals: goal
            }
        };
    } catch (e) {
        console.error('computeWeeklyData error:', e);
        return {
            success: false,
            error: e.message,
            data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], scans: [0,0,0,0,0,0,0], goals: [20,20,20,20,20,20,20] }
        };
    }
}

// Compute material breakdown from userScans (FIXED VERSION)
export async function computeMaterialBreakdown(uid) {
    try {
        if (!uid) {
            return { success: false, error: 'No user ID provided', data: [] };
        }

        const scansRef = ref(database, `userScans/${uid}`);
        const snap = await get(scansRef);
        const counts = { plastic: 0, paper: 0, glass: 0, aluminum: 0 };

        if (snap.exists()) {
            snap.forEach(child => {
                const s = child.val();
                if (s && s.materialType) {
                    const m = s.materialType.toLowerCase();
                    if (counts.hasOwnProperty(m)) {
                        counts[m] += 1;
                    }
                }
            });
        }

        // 🚨 FIXED: Handle empty data case
        const total = Object.values(counts).reduce((a, b) => a + b, 0);

        if (total === 0) {
            // Return empty array for new users
            return {
                success: true,
                data: []
            };
        }

        const palette = {
            plastic: '#3b82f6',
            paper: '#059669',
            glass: '#f59e0b',
            aluminum: '#ef4444'
        };

        const arr = Object.keys(counts)
            .filter(k => counts[k] > 0) // Only include materials with counts
            .map(k => ({
                name: k.charAt(0).toUpperCase() + k.slice(1),
                count: counts[k],
                color: palette[k],
                percentage: Math.round((counts[k] / total) * 100)
            }));

        return { success: true, data: arr };
    } catch (e) {
        console.error('computeMaterialBreakdown error:', e);
        return { success: false, error: e.message, data: [] };
    }
}
