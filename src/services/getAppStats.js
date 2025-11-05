import { ref, get } from "firebase/database";
import { database } from '../config/firebase';

// getAllScans helper (optional lightweight)
const getAllScansLight = async () => {
  const scansRef = ref(database, 'scans');
  const snapshot = await get(scansRef);
  const scans = [];
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      const v = child.val();
      scans.push({ id: child.key, ...v });
    });
  }
  return scans;
};

export const getAppStats = async () => {
  try {
    // fetch core datasets
    const [usersSnap, vouchersSnap, rewardsSnap, scans] = await Promise.all([
      get(ref(database, 'users')),
      get(ref(database, 'vouchers')),
      get(ref(database, 'rewards')),
      getAllScansLight()
    ]);

    // users
    const users = [];
    if (usersSnap.exists()) {
      usersSnap.forEach(c => users.push({ id: c.key, ...c.val() }));
    }
    const totalUsers = users.length;
    const activeUsers = users.filter(u => (u.totalScans || 0) > 0).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const staffUsers = users.filter(u => u.role === 'staff').length;
    const regularUsers = users.filter(u => u.role === 'user' || !u.role).length;
    const totalPoints = users.reduce((s,u)=> s + (u.points || 0), 0);
    const totalScans = users.reduce((s,u)=> s + (u.totalScans || 0), 0);

    // vouchers
    const vouchers = [];
    if (vouchersSnap.exists()) {
      vouchersSnap.forEach(c => vouchers.push({ id: c.key, ...c.val() }));
    }
    const activeVouchers = vouchers.filter(v => v.status === 'active').length;
    const redeemedVouchers = vouchers.filter(v => v.status === 'redeemed').length;
    const expiredVouchers = vouchers.filter(v => v.status === 'expired').length;

    // rewards
    const rewards = [];
    if (rewardsSnap.exists()) {
      rewardsSnap.forEach(c => rewards.push({ id: c.key, ...c.val() }));
    }
    const availableRewards = rewards.filter(r => r.available).length;

    // top users
    const topUsers = users
      .filter(u => (u.role === 'user' || !u.role) && (u.points || 0) >= 0)
      .sort((a,b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10)
      .map(u => ({ id: u.id, displayName: u.displayName || 'User', points: u.points || 0 }));

    // date windows
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7*24*60*60*1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // today redemptions from vouchers
    const todayRedemptions = vouchers.filter(v => v.status === 'redeemed' && v.redeemedAt && new Date(v.redeemedAt) >= todayStart).length;

    // scans-based quick aggregates (best-effort; createdAt can be number/object)
    const scansToday = scans.filter(s => s.timestamp && new Date(s.timestamp) >= todayStart).length;
    const weeklyScans = scans.filter(s => s.timestamp && new Date(s.timestamp) >= weekStart).length;
    const monthlyScans = scans.filter(s => s.timestamp && new Date(s.timestamp) >= monthStart).length;

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      staffUsers,
      regularUsers,
      totalScans,
      totalPoints,
      todayScans: scansToday,
      weeklyScans,
      monthlyScans,
      totalVouchers: vouchers.length,
      activeVouchers,
      redeemedVouchers,
      expiredVouchers,
      todayRedemptions,
      totalRewards: rewards.length,
      availableRewards,
      unavailableRewards: rewards.length - availableRewards,
      averagePointsPerUser: totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0,
      averageScansPerUser: totalUsers > 0 ? Math.round(totalScans / totalUsers) : 0,
      averagePointsPerScan: totalScans > 0 ? Math.round(totalPoints / totalScans) : 0,
      topUsers,
      systemHealth: { lastUpdated: new Date().toISOString() }
    };

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
