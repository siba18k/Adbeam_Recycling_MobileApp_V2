import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccessibilityService from './AccessibilityService';

class ThemeManager {
  constructor() {
    this.currentTheme = 'auto';
    this.isDarkMode = false;
    this.listeners = [];
    this.customThemes = {};
    
    this.init();
  }

  async init() {
    // Load saved theme preference
    await this.loadThemePreference();
    
    // Set up appearance change listener
    this.setupAppearanceListener();
    
    // Apply initial theme
    this.updateTheme();
  }

  setupAppearanceListener() {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (this.currentTheme === 'auto') {
        this.isDarkMode = colorScheme === 'dark';
        this.notifyListeners();
      }
    });
    
    // Store subscription for cleanup
    this.appearanceSubscription = subscription;
  }

  async setTheme(theme) {
    this.currentTheme = theme;
    await AsyncStorage.setItem('selectedTheme', theme);
    this.updateTheme();
  }

  updateTheme() {
    if (this.currentTheme === 'auto') {
      this.isDarkMode = Appearance.getColorScheme() === 'dark';
    } else {
      this.isDarkMode = this.currentTheme === 'dark';
    }
    
    this.notifyListeners();
  }

  async loadThemePreference() {
    try {
      const stored = await AsyncStorage.getItem('selectedTheme');
      if (stored) {
        this.currentTheme = stored;
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
  }

  // Get complete theme object
  getTheme() {
    const accessibleColors = AccessibilityService.getAccessibleColors();
    const baseTheme = this.isDarkMode ? this.getDarkTheme() : this.getLightTheme();
    
    // Apply accessibility overrides if high contrast is enabled
    if (AccessibilityService.isHighContrastEnabled) {
      return {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          ...accessibleColors
        }
      };
    }
    
    return baseTheme;
  }

  getLightTheme() {
    return {
      dark: false,
      colors: {
        // Primary colors
        primary: '#4CAF50',
        primaryLight: '#81C784',
        primaryDark: '#388E3C',
        
        // Secondary colors
        secondary: '#2196F3',
        secondaryLight: '#64B5F6',
        secondaryDark: '#1976D2',
        
        // Accent
        accent: '#FF9800',
        accentLight: '#FFB74D',
        accentDark: '#F57C00',
        
        // Background
        background: '#FFFFFF',
        backgroundSecondary: '#F8F9FA',
        backgroundTertiary: '#E9ECEF',
        
        // Surface
        surface: '#FFFFFF',
        surfaceSecondary: '#F5F5F5',
        surfaceDisabled: '#FAFAFA',
        
        // Text
        text: '#212529',
        textSecondary: '#6C757D',
        textDisabled: '#ADB5BD',
        textInverse: '#FFFFFF',
        
        // Status colors
        success: '#28A745',
        successLight: '#D4EDDA',
        warning: '#FFC107',
        warningLight: '#FFF3CD',
        error: '#DC3545',
        errorLight: '#F8D7DA',
        info: '#17A2B8',
        infoLight: '#D1ECF1',
        
        // Border and dividers
        border: '#DEE2E6',
        borderLight: '#F8F9FA',
        divider: '#E9ECEF',
        
        // Interactive elements
        buttonPrimary: '#4CAF50',
        buttonSecondary: '#6C757D',
        buttonDisabled: '#E9ECEF',
        
        // Input fields
        inputBackground: '#FFFFFF',
        inputBorder: '#CED4DA',
        inputBorderFocus: '#4CAF50',
        
        // Navigation
        tabBarBackground: '#FFFFFF',
        tabBarActive: '#4CAF50',
        tabBarInactive: '#6C757D',
        
        // Cards and containers
        cardBackground: '#FFFFFF',
        cardBorder: '#E9ECEF',
        cardShadow: 'rgba(0, 0, 0, 0.1)',
        
        // Overlays
        overlay: 'rgba(0, 0, 0, 0.5)',
        overlayLight: 'rgba(0, 0, 0, 0.2)'
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48
      },
      typography: {
        h1: {
          fontSize: AccessibilityService.getScaledSize(32),
          fontWeight: '700',
          lineHeight: AccessibilityService.getScaledSize(40)
        },
        h2: {
          fontSize: AccessibilityService.getScaledSize(28),
          fontWeight: '600',
          lineHeight: AccessibilityService.getScaledSize(36)
        },
        h3: {
          fontSize: AccessibilityService.getScaledSize(24),
          fontWeight: '600',
          lineHeight: AccessibilityService.getScaledSize(32)
        },
        h4: {
          fontSize: AccessibilityService.getScaledSize(20),
          fontWeight: '600',
          lineHeight: AccessibilityService.getScaledSize(28)
        },
        body1: {
          fontSize: AccessibilityService.getScaledSize(16),
          fontWeight: '400',
          lineHeight: AccessibilityService.getScaledSize(24)
        },
        body2: {
          fontSize: AccessibilityService.getScaledSize(14),
          fontWeight: '400',
          lineHeight: AccessibilityService.getScaledSize(20)
        },
        caption: {
          fontSize: AccessibilityService.getScaledSize(12),
          fontWeight: '400',
          lineHeight: AccessibilityService.getScaledSize(16)
        },
        button: {
          fontSize: AccessibilityService.getScaledSize(16),
          fontWeight: '600',
          lineHeight: AccessibilityService.getScaledSize(24)
        }
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 16,
        xl: 24,
        full: 9999
      },
      shadows: {
        small: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1
        },
        medium: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        },
        large: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5
        }
      }
    };
  }

  getDarkTheme() {
    const lightTheme = this.getLightTheme();
    
    return {
      ...lightTheme,
      dark: true,
      colors: {
        // Primary colors (adjusted for dark mode)
        primary: '#66BB6A',
        primaryLight: '#A5D6A7',
        primaryDark: '#4CAF50',
        
        // Secondary colors
        secondary: '#42A5F5',
        secondaryLight: '#90CAF9',
        secondaryDark: '#2196F3',
        
        // Accent
        accent: '#FFB74D',
        accentLight: '#FFCC02',
        accentDark: '#FF9800',
        
        // Background
        background: '#121212',
        backgroundSecondary: '#1E1E1E',
        backgroundTertiary: '#2D2D2D',
        
        // Surface
        surface: '#1E1E1E',
        surfaceSecondary: '#2D2D2D',
        surfaceDisabled: '#3A3A3A',
        
        // Text
        text: '#FFFFFF',
        textSecondary: '#B3B3B3',
        textDisabled: '#666666',
        textInverse: '#000000',
        
        // Status colors (adjusted for dark mode)
        success: '#4CAF50',
        successLight: '#1B5E20',
        warning: '#FF9800',
        warningLight: '#E65100',
        error: '#F44336',
        errorLight: '#B71C1C',
        info: '#2196F3',
        infoLight: '#0D47A1',
        
        // Border and dividers
        border: '#3A3A3A',
        borderLight: '#2D2D2D',
        divider: '#3A3A3A',
        
        // Interactive elements
        buttonPrimary: '#66BB6A',
        buttonSecondary: '#666666',
        buttonDisabled: '#3A3A3A',
        
        // Input fields
        inputBackground: '#2D2D2D',
        inputBorder: '#3A3A3A',
        inputBorderFocus: '#66BB6A',
        
        // Navigation
        tabBarBackground: '#1E1E1E',
        tabBarActive: '#66BB6A',
        tabBarInactive: '#B3B3B3',
        
        // Cards and containers
        cardBackground: '#1E1E1E',
        cardBorder: '#3A3A3A',
        cardShadow: 'rgba(0, 0, 0, 0.3)',
        
        // Overlays
        overlay: 'rgba(0, 0, 0, 0.7)',
        overlayLight: 'rgba(0, 0, 0, 0.4)'
      }
    };
  }

  // Custom theme creation
  createCustomTheme(name, baseTheme, overrides) {
    const base = baseTheme === 'dark' ? this.getDarkTheme() : this.getLightTheme();
    
    this.customThemes[name] = {
      ...base,
      colors: {
        ...base.colors,
        ...overrides.colors
      },
      typography: {
        ...base.typography,
        ...overrides.typography
      },
      spacing: {
        ...base.spacing,
        ...overrides.spacing
      }
    };
  }

  getCustomTheme(name) {
    return this.customThemes[name];
  }

  // Event system
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getTheme());
      } catch (error) {
        console.warn('Theme listener error:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    if (this.appearanceSubscription) {
      this.appearanceSubscription.remove();
    }
  }
}

export default new ThemeManager();