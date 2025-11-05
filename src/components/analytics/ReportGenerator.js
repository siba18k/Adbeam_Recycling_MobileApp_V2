// ReportGenerator.js
// PDF Report Generation and Social Sharing

import React from 'react';
import { Alert, Platform } from 'react-native';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import EnvironmentalCalculator from './EnvironmentalCalculations';

class ReportGenerator {
  /**
   * Generate and share PDF report
   */
  static async generatePDFReport(userData) {
    try {
      const reportData = this.prepareReportData(userData);
      const htmlContent = this.generateHTMLReport(reportData);
      
      // For now, we'll share as HTML (PDF generation requires additional native setup)
      const shareOptions = {
        title: 'My Environmental Impact Report',
        message: this.generateTextReport(reportData),
        subject: 'Recycling Impact Report',
        type: 'text/plain'
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Could not generate report. Please try again.');
    }
  }

  /**
   * Share environmental impact on social media
   */
  static async shareImpact(impact) {
    try {
      const message = this.createSocialMessage(impact);
      
      const shareOptions = {
        title: 'My Environmental Impact',
        message,
        type: 'text/plain'
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error sharing impact:', error);
      Alert.alert('Error', 'Could not share impact. Please try again.');
    }
  }

  /**
   * Prepare data for report generation
   */
  static prepareReportData(userData) {
    const { recyclingData, impact, streak, milestones, historicalData } = userData;
    
    const realWorldEquivalents = EnvironmentalCalculator.getRealWorldEquivalents(impact);
    const projection = EnvironmentalCalculator.projectFutureImpact(historicalData);

    return {
      userId: userData.userId,
      generatedDate: new Date().toLocaleDateString(),
      summary: {
        totalItems: impact.totalItems,
        co2Saved: impact.totalCO2,
        waterSaved: impact.totalWater,
        energySaved: impact.totalEnergy,
        streak
      },
      breakdown: impact.breakdown,
      realWorldEquivalents,
      milestones: {
        achieved: milestones?.achieved || [],
        next: milestones?.next
      },
      projection,
      period: 'All Time'
    };
  }

  /**
   * Generate HTML report content
   */
  static generateHTMLReport(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Environmental Impact Report</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .report-container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #10B981;
                padding-bottom: 20px;
            }
            .title {
                font-size: 28px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 8px;
            }
            .subtitle {
                font-size: 16px;
                color: #6B7280;
            }
            .section {
                margin-bottom: 30px;
            }
            .section-title {
                font-size: 20px;
                font-weight: bold;
                color: #374151;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
            }
            .emoji {
                margin-right: 10px;
                font-size: 24px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            .stat-card {
                background: #F8FAFC;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                border-left: 4px solid #10B981;
            }
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #1F2937;
                display: block;
            }
            .stat-label {
                font-size: 14px;
                color: #6B7280;
                margin-top: 5px;
            }
            .breakdown-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #E5E7EB;
            }
            .material-info {
                display: flex;
                align-items: center;
            }
            .material-icon {
                margin-right: 10px;
                font-size: 20px;
            }
            .achievement-badge {
                display: inline-block;
                background: #DBEAFE;
                color: #1E40AF;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin: 5px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                color: #6B7280;
                font-size: 14px;
                border-top: 1px solid #E5E7EB;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="header">
                <div class="title">🌍 Environmental Impact Report</div>
                <div class="subtitle">Generated on ${data.generatedDate} | User: ${data.userId}</div>
            </div>

            <div class="section">
                <div class="section-title">
                    <span class="emoji">📊</span>
                    Impact Summary (${data.period})
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${data.summary.totalItems}</span>
                        <div class="stat-label">Items Recycled</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${data.summary.co2Saved} kg</span>
                        <div class="stat-label">CO₂ Saved</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${data.summary.waterSaved} L</span>
                        <div class="stat-label">Water Saved</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${data.summary.energySaved} kWh</span>
                        <div class="stat-label">Energy Saved</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">
                    <span class="emoji">♻️</span>
                    Material Breakdown
                </div>
                ${data.breakdown.map(item => `
                    <div class="breakdown-item">
                        <div class="material-info">
                            <span class="material-icon">${item.icon}</span>
                            <span>${item.displayName}</span>
                        </div>
                        <div>
                            <strong>${item.count} items</strong>
                            <div style="font-size: 12px; color: #6B7280;">
                                ${item.co2Saved}kg CO₂ • ${item.waterSaved}L H₂O • ${item.energySaved}kWh
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="section">
                <div class="section-title">
                    <span class="emoji">🌍</span>
                    Real-World Impact
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${data.realWorldEquivalents.co2.trees}</span>
                        <div class="stat-label">Trees Planted Equivalent</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${data.realWorldEquivalents.water.showers}</span>
                        <div class="stat-label">5-Minute Showers</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${data.realWorldEquivalents.energy.phones}</span>
                        <div class="stat-label">Phone Charges</div>
                    </div>
                </div>
            </div>

            ${data.milestones.achieved.length > 0 ? `
            <div class="section">
                <div class="section-title">
                    <span class="emoji">🏆</span>
                    Achievements Unlocked
                </div>
                <div>
                    ${data.milestones.achieved.map(milestone => `
                        <span class="achievement-badge">
                            ${milestone.emoji} ${milestone.title}
                        </span>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${data.projection ? `
            <div class="section">
                <div class="section-title">
                    <span class="emoji">📈</span>
                    30-Day Projection
                </div>
                <p>Based on your current recycling trend (${data.projection.trend} growth), 
                you're projected to recycle <strong>${data.projection.projectedTotal} items</strong> 
                in the next 30 days, saving approximately:</p>
                <ul>
                    <li>${data.projection.projectedImpact.totalCO2} kg CO₂</li>
                    <li>${data.projection.projectedImpact.totalWater} L Water</li>
                    <li>${data.projection.projectedImpact.totalEnergy} kWh Energy</li>
                </ul>
            </div>
            ` : ''}

            <div class="footer">
                <p>🌱 Every item recycled makes a difference for our planet!</p>
                <p>Generated by Adbeam Recycling App • Keep up the great work!</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate simple text report for sharing
   */
  static generateTextReport(data) {
    return `
🌍 My Environmental Impact Report

📊 Total Impact:
• ${data.summary.totalItems} items recycled
• ${data.summary.co2Saved} kg CO₂ saved
• ${data.summary.waterSaved} L water saved  
• ${data.summary.energySaved} kWh energy saved
• ${data.summary.streak} day streak 🔥

🌍 Real-World Equivalent:
• ${data.realWorldEquivalents.co2.trees} trees planted
• ${data.realWorldEquivalents.water.showers} 5-minute showers
• ${data.realWorldEquivalents.energy.phones} phone charges

♻️ Material Breakdown:
${data.breakdown.map(item => 
  `• ${item.icon} ${item.displayName}: ${item.count} items`
).join('\n')}

🏆 Achievements: ${data.milestones.achieved.length} unlocked

Generated by Adbeam Recycling App
#Recycling #Environment #Sustainability
    `.trim();
  }

  /**
   * Create social media message
   */
  static createSocialMessage(impact) {
    return `
🌍 My recycling impact so far:

♻️ ${impact.totalItems} items recycled
🌿 ${impact.totalCO2} kg CO₂ saved
💧 ${impact.totalWater} L water saved
⚡ ${impact.totalEnergy} kWh energy saved

Every small action makes a BIG difference! 🌱

#Recycling #Environment #Sustainability #EcoFriendly
    `.trim();
  }

  /**
   * Export data as JSON for backup
   */
  static async exportData(userData) {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        userData,
        version: '1.0'
      };

      const shareOptions = {
        title: 'Export Recycling Data',
        message: JSON.stringify(exportData, null, 2),
        type: 'text/plain',
        filename: `recycling_data_${userData.userId}_${Date.now()}.json`
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Could not export data. Please try again.');
    }
  }
}

export default ReportGenerator;
