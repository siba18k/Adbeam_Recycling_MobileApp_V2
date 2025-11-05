import AsyncStorage from '@react-native-async-storage/async-storage';
import AccessibilityService from './AccessibilityService';
import ThemeManager from './ThemeManager';

class UserPreferences {
  constructor() {
    this.preferences = {
      // Accessibility preferences
      accessibility: {
        screenReader: false,
        voiceGuidance: false,
        highContrast: false,
        largeText: false,
        hapticFeedback: true,
        slowAnimations: false,
        simplifiedUI: false
      },
      
      // Theme preferences
      theme: {
        mode: 'auto', // 'light', 'dark', 'auto'
        colorScheme: 'default',
        fontSize: 'medium',
        compactMode: false
      },
      
      // Interaction preferences
      interaction: {
        oneHandedMode: false,
        swipeGestures: true,
        hapticOnScan: true,
        vibrationPattern: 'medium',
        confirmActions: false
      },
      
      // Notification preferences
      notifications: {
        scanReminders: true,
        goalAchievements: true,
        weeklyProgress: true,
        socialUpdates: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        },
        frequency: 'normal' // 'minimal', 'normal', 'frequent'
      },
      
      // Privacy preferences
      privacy: {
        dataCollection: true,
        analytics: true,
        locationTracking: false,
        shareProgress: false,
        profileVisibility: 'private'
      },
      
      // App behavior preferences
      behavior: {
        autoScan: false,
        quickScan: true,
        skipTutorials: false,
        rememberChoices: true,
        offlineMode: false,
        backgroundSync: true
      },
      
      // Language and localization
      localization: {
        language: 'en',
        region: 'US',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        currency: 'USD'
      },
      
      // Goals and gamification
      goals: {
        dailyTarget: 5,
        weeklyTarget: 25,
        enableChallenges: true,
        shareAchievements: false,
        competitiveMode: false
      },
      
      // Performance preferences
      performance: {
        imageQuality: 'medium',
        animationSpeed: 'normal',
        preloadContent: true,
        backgroundRefresh: true,
        lowPowerMode: false
      }
    };
    
    this.listeners = [];
    this.adaptiveSettings = {
      usagePatterns: {},
      frequentlyUsedFeatures: [],
      preferredInteractionMethods: []
    };
    
    this.init();
  }

  async init() {
    await this.loadPreferences();
    await this.loadAdaptiveSettings();
    this.applyPreferences();
  }

  // Load all preferences from storage
  async loadPreferences() {
    try {
      const stored = await AsyncStorage.getItem('userPreferences');
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        this.preferences = this.mergePreferences(this.preferences, parsedPreferences);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }

  // Load adaptive learning data
  async loadAdaptiveSettings() {
    try {
      const stored = await AsyncStorage.getItem('adaptiveSettings');
      if (stored) {
        this.adaptiveSettings = { ...this.adaptiveSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load adaptive settings:', error);
    }
  }

  // Deep merge preferences to handle nested objects
  mergePreferences(defaultPrefs, userPrefs) {
    const merged = { ...defaultPrefs };
    
    for (const category in userPrefs) {
      if (merged[category] && typeof merged[category] === 'object') {
        merged[category] = { ...merged[category], ...userPrefs[category] };
      } else {
        merged[category] = userPrefs[category];
      }
    }
    
    return merged;
  }

  // Apply preferences to relevant services
  async applyPreferences() {
    const { accessibility, theme, interaction } = this.preferences;
    
    // Apply accessibility preferences
    await AccessibilityService.updatePreference('isHighContrastEnabled', accessibility.highContrast);
    await AccessibilityService.updatePreference('isVoiceGuidanceEnabled', accessibility.voiceGuidance);
    await AccessibilityService.updatePreference('hapticFeedbackEnabled', accessibility.hapticFeedback);
    
    if (accessibility.largeText) {
      await AccessibilityService.updatePreference('textScale', 1.3);
    }
    
    // Apply theme preferences
    await ThemeManager.setTheme(theme.mode);
    
    this.notifyListeners('preferencesApplied');
  }

  // Get specific preference
  get(category, key) {
    if (key) {
      return this.preferences[category]?.[key];
    }
    return this.preferences[category];
  }

  // Set specific preference
  async set(category, key, value) {
    if (!this.preferences[category]) {
      this.preferences[category] = {};
    }
    
    if (typeof key === 'object') {
      // Setting entire category
      this.preferences[category] = { ...this.preferences[category], ...key };
    } else {
      // Setting specific key
      this.preferences[category][key] = value;
    }
    
    await this.savePreferences();
    await this.applyPreferences();
    
    this.notifyListeners('preferenceChanged', { category, key, value });
  }

  // Save preferences to storage
  async savePreferences() {
    try {
      await AsyncStorage.setItem('userPreferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  // Adaptive UI learning system
  async recordUsagePattern(feature, context = {}) {
    const timestamp = Date.now();
    const hour = new Date().getHours();
    
    if (!this.adaptiveSettings.usagePatterns[feature]) {
      this.adaptiveSettings.usagePatterns[feature] = {
        totalUses: 0,
        timeDistribution: Array(24).fill(0),
        contextPatterns: {},
        lastUsed: timestamp
      };
    }
    
    const pattern = this.adaptiveSettings.usagePatterns[feature];
    pattern.totalUses++;
    pattern.timeDistribution[hour]++;
    pattern.lastUsed = timestamp;
    
    // Record context patterns
    if (context.location) {
      if (!pattern.contextPatterns.location) pattern.contextPatterns.location = {};
      pattern.contextPatterns.location[context.location] = (pattern.contextPatterns.location[context.location] || 0) + 1;
    }
    
    // Update frequently used features
    this.updateFrequentlyUsedFeatures(feature, pattern.totalUses);
    
    await this.saveAdaptiveSettings();
  }

  // Update frequently used features list
  updateFrequentlyUsedFeatures(feature, usageCount) {
    const existing = this.adaptiveSettings.frequentlyUsedFeatures.find(f => f.name === feature);
    
    if (existing) {
      existing.count = usageCount;
    } else {
      this.adaptiveSettings.frequentlyUsedFeatures.push({ name: feature, count: usageCount });
    }
    
    // Sort by usage count and keep top 10
    this.adaptiveSettings.frequentlyUsedFeatures.sort((a, b) => b.count - a.count);
    this.adaptiveSettings.frequentlyUsedFeatures = this.adaptiveSettings.frequentlyUsedFeatures.slice(0, 10);
  }

  // Get personalized recommendations
  getPersonalizedRecommendations() {
    const recommendations = [];
    const { usagePatterns, frequentlyUsedFeatures } = this.adaptiveSettings;
    
    // Recommend based on usage patterns
    if (frequentlyUsedFeatures.length > 0) {
      const topFeature = frequentlyUsedFeatures[0].name;
      if (topFeature === 'scan' && !this.preferences.behavior.quickScan) {
        recommendations.push({
          type: 'feature',
          title: 'Enable Quick Scan',
          description: 'Based on your scanning frequency, quick scan could save you time',
          action: () => this.set('behavior', 'quickScan', true)
        });
      }
    }
    
    // Recommend accessibility features based on usage
    const currentHour = new Date().getHours();
    if (currentHour >= 20 || currentHour <= 7) {
      if (!this.preferences.theme.mode === 'dark') {
        recommendations.push({
          type: 'accessibility',
          title: 'Try Dark Mode',
          description: 'Dark mode reduces eye strain in low light conditions',
          action: () => this.set('theme', 'mode', 'dark')
        });
      }
    }
    
    return recommendations;
  }

  // Get adaptive UI configuration
  getAdaptiveUIConfig() {
    const { frequentlyUsedFeatures, usagePatterns } = this.adaptiveSettings;
    const { interaction, accessibility } = this.preferences;
    
    return {
      // Show frequently used features prominently
      priorityFeatures: frequentlyUsedFeatures.slice(0, 3).map(f => f.name),
      
      // Optimize for one-handed use if enabled
      bottomNavigation: interaction.oneHandedMode,
      
      // Simplify interface for accessibility
      simplifiedMode: accessibility.simplifiedUI,
      
      // Reduce animations if needed
      reducedMotion: accessibility.slowAnimations,
      
      // Customize interaction methods
      preferredGestures: this.adaptiveSettings.preferredInteractionMethods,
      
      // Smart defaults based on usage
      smartDefaults: this.getSmartDefaults()
    };
  }

  // Generate smart defaults based on user behavior
  getSmartDefaults() {
    const defaults = {};
    const { usagePatterns } = this.adaptiveSettings;
    
    // Auto-enable features used frequently
    Object.entries(usagePatterns).forEach(([feature, pattern]) => {
      if (pattern.totalUses > 10) {
        switch (feature) {
          case 'scan':
            defaults.autoOpenCamera = true;
            break;
          case 'rewards':
            defaults.showRewardsShortcut = true;
            break;
          case 'profile':
            defaults.showProgressWidget = true;
            break;
        }
      }
    });
    
    return defaults;
  }

  // Save adaptive settings
  async saveAdaptiveSettings() {
    try {
      await AsyncStorage.setItem('adaptiveSettings', JSON.stringify(this.adaptiveSettings));
    } catch (error) {
      console.error('Failed to save adaptive settings:', error);
    }
  }

  // Export preferences for backup
  exportPreferences() {
    return {
      preferences: this.preferences,
      adaptiveSettings: this.adaptiveSettings,
      exportDate: new Date().toISOString()
    };
  }

  // Import preferences from backup
  async importPreferences(data) {
    try {
      if (data.preferences) {
        this.preferences = this.mergePreferences(this.preferences, data.preferences);
        await this.savePreferences();
      }
      
      if (data.adaptiveSettings) {
        this.adaptiveSettings = { ...this.adaptiveSettings, ...data.adaptiveSettings };
        await this.saveAdaptiveSettings();
      }
      
      await this.applyPreferences();
      this.notifyListeners('preferencesImported');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset preferences to defaults
  async resetPreferences(categories = null) {
    try {
      if (categories) {
        // Reset specific categories
        categories.forEach(category => {
          if (this.preferences[category]) {
            // Get default value for this category
            const defaultPrefs = new UserPreferences().preferences;
            this.preferences[category] = defaultPrefs[category];
          }
        });
      } else {
        // Reset all preferences
        const defaultPrefs = new UserPreferences().preferences;
        this.preferences = defaultPrefs;
      }
      
      await this.savePreferences();
      await this.applyPreferences();
      
      this.notifyListeners('preferencesReset');
      return { success: true };
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Event system
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.warn('Preference listener error:', error);
      }
    });
  }
}

export default new UserPreferences();