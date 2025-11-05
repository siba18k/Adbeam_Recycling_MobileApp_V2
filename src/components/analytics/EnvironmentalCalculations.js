// EnvironmentalCalculations.js
// Environmental Impact Calculation Engine

export const MATERIAL_IMPACT = {
  plastic: {
    co2Saved: 0.12, // kg
    waterSaved: 2.3, // liters
    energySaved: 1.8, // kWh
    displayName: 'Plastic Bottle',
    color: '#3B82F6',
    icon: '♻️'
  },
  aluminum: {
    co2Saved: 0.35, // kg
    waterSaved: 3.1, // liters
    energySaved: 2.8, // kWh
    displayName: 'Aluminum Can',
    color: '#10B981',
    icon: '🥫'
  },
  glass: {
    co2Saved: 0.18, // kg
    waterSaved: 1.8, // liters
    energySaved: 1.2, // kWh
    displayName: 'Glass Bottle',
    color: '#F59E0B',
    icon: '🍾'
  }
};

export class EnvironmentalCalculator {
  /**
   * Calculate total environmental impact from recycling data
   */
  static calculateTotalImpact(recyclingData) {
    let totalCO2 = 0;
    let totalWater = 0;
    let totalEnergy = 0;
    let totalItems = 0;

    Object.keys(recyclingData).forEach(materialType => {
      const count = recyclingData[materialType] || 0;
      const impact = MATERIAL_IMPACT[materialType];
      
      if (impact) {
        totalCO2 += count * impact.co2Saved;
        totalWater += count * impact.waterSaved;
        totalEnergy += count * impact.energySaved;
        totalItems += count;
      }
    });

    return {
      totalCO2: totalCO2.toFixed(2),
      totalWater: totalWater.toFixed(2),
      totalEnergy: totalEnergy.toFixed(2),
      totalItems,
      breakdown: this.calculateMaterialBreakdown(recyclingData)
    };
  }

  /**
   * Calculate breakdown by material type
   */
  static calculateMaterialBreakdown(recyclingData) {
    return Object.keys(MATERIAL_IMPACT).map(materialType => {
      const count = recyclingData[materialType] || 0;
      const impact = MATERIAL_IMPACT[materialType];
      
      return {
        type: materialType,
        displayName: impact.displayName,
        count,
        co2Saved: (count * impact.co2Saved).toFixed(2),
        waterSaved: (count * impact.waterSaved).toFixed(2),
        energySaved: (count * impact.energySaved).toFixed(2),
        color: impact.color,
        icon: impact.icon,
        percentage: 0 // Will be calculated later
      };
    });
  }

  /**
   * Calculate recycling streak
   */
  static calculateStreak(recyclingHistory) {
    if (!recyclingHistory || recyclingHistory.length === 0) return 0;

    let currentStreak = 1;
    const sortedHistory = [...recyclingHistory].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    for (let i = 0; i < sortedHistory.length - 1; i++) {
      const current = new Date(sortedHistory[i].date);
      const next = new Date(sortedHistory[i + 1].date);
      const dayDiff = Math.floor((current - next) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        currentStreak++;
      } else if (dayDiff > 1) {
        break;
      }
    }

    return currentStreak;
  }

  /**
   * Calculate campus percentile ranking
   */
  static calculatePercentile(userTotal, campusData) {
    if (!campusData || campusData.length === 0) return 0;

    const sortedData = [...campusData].sort((a, b) => b - a);
    const userRank = sortedData.findIndex(total => total <= userTotal);
    
    if (userRank === -1) return 100;
    
    const percentile = ((sortedData.length - userRank) / sortedData.length) * 100;
    return Math.round(percentile);
  }

  /**
   * Convert environmental impact to real-world equivalents
   */
  static getRealWorldEquivalents(impact) {
    return {
      co2: {
        trees: (impact.totalCO2 / 21.77).toFixed(1), // Trees planted equivalent
        cars: (impact.totalCO2 / 4600).toFixed(3), // Cars off road for a year
        miles: (impact.totalCO2 / 0.404).toFixed(0) // Miles not driven
      },
      water: {
        showers: (impact.totalWater / 75).toFixed(1), // 5-minute showers
        bottles: (impact.totalWater / 0.5).toFixed(0), // 500ml bottles
        pools: (impact.totalWater / 75000).toFixed(3) // Olympic pools
      },
      energy: {
        homes: (impact.totalEnergy / 30).toFixed(2), // Homes powered for a day
        phones: (impact.totalEnergy / 0.012).toFixed(0), // Phone charges
        bulbs: (impact.totalEnergy / 0.06).toFixed(0) // Hours of LED bulb
      }
    };
  }

  /**
   * Check milestone achievements
   */
  static checkMilestones(totalItems) {
    const milestones = [
      { items: 10, title: 'Getting Started', emoji: '🌱', reward: 'Eco Beginner Badge' },
      { items: 50, title: 'Eco Warrior', emoji: '⚡', reward: 'Bronze Medal' },
      { items: 100, title: 'Century Club', emoji: '💯', reward: 'Silver Medal' },
      { items: 250, title: 'Quarter Master', emoji: '🏆', reward: 'Gold Medal' },
      { items: 500, title: 'Half a Thousand', emoji: '🌟', reward: 'Platinum Badge' },
      { items: 1000, title: 'Recycling Champion', emoji: '👑', reward: 'Diamond Badge' }
    ];

    const achieved = milestones.filter(m => totalItems >= m.items);
    const nextMilestone = milestones.find(m => totalItems < m.items);

    return {
      achieved,
      next: nextMilestone,
      progress: nextMilestone ? 
        ((totalItems / nextMilestone.items) * 100).toFixed(1) : 100
    };
  }
}

export default EnvironmentalCalculator;