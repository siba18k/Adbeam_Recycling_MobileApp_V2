// Hook that aggregates live user analytics for the Dashboard
import { useEffect, useState } from 'react';
import { computeWeeklyData, computeMaterialBreakdown } from '../services/analytics';

export function useUserAnalytics(uid) {
  const [weekly, setWeekly] = useState({ labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], scans: [0,0,0,0,0,0,0], goals: [20,20,20,20,20,20,20] });
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [w, m] = await Promise.all([
      computeWeeklyData(uid),
      computeMaterialBreakdown(uid)
    ]);
    if (w.success) setWeekly(w.data);
    if (m.success) setMaterials(m.data);
    setLoading(false);
  }

  useEffect(() => { if (uid) refresh(); }, [uid]);

  return { weekly, materials, loading, refresh };
}
