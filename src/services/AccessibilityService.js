import { AccessibilityInfo, Alert, Dimensions } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AccessibilityService {
  constructor() {
    this.isScreenReaderEnabled = false;
    this.isHighContrastEnabled = false;
    this.textScale = 1;
    this.isVoiceGuidanceEnabled = false;
    this.preferredLanguage = 'en';
    this.hapticFeedbackEnabled = true;
    this.listeners = [];
    
    this.init();
  }

  async init() {
    // Load saved preferences
    await this.loadPreferences();
    
    // Set up accessibility listeners
    this.setupAccessibilityListeners();
    
    // Check initial screen reader state
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      this.isScreenReaderEnabled = enabled;
      this.notifyListeners('screenReaderChanged', enabled);
    });
  }

  setupAccessibilityListeners() {
    // Screen reader state changes
    AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      this.isScreenReaderEnabled = enabled;
      this.notifyListeners('screenReaderChanged', enabled);
    });

    // Bold text changes (iOS)
    AccessibilityInfo.addEventListener('boldTextChanged', (enabled) => {
      this.notifyListeners('boldTextChanged', enabled);
    });

    // Reduce motion changes
    AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      this.notifyListeners('reduceMotionChanged', enabled);
    });

    // Gray scale changes (color blindness support)
    AccessibilityInfo.addEventListener('grayscaleChanged', (enabled) => {
      this.notifyListeners('grayscaleChanged', enabled);
    });
  }

  // Voice guidance system
  async speak(text, options = {}) {
    if (!this.isVoiceGuidanceEnabled && !this.isScreenReaderEnabled) return;
    
    const speakOptions = {
      language: this.preferredLanguage,
      pitch: options.pitch || 1.0,
      rate: options.rate || 0.75, // Slightly slower for clarity
      ...options
    };

    try {
      await Speech.speak(text, speakOptions);
    } catch (error) {
      console.warn('Speech synthesis failed:', error);
    }
  }

  // Haptic feedback system
  async provideFeedback(type = 'light', options = {}) {
    if (!this.hapticFeedbackEnabled) return;
    
    try {
      switch (type) {
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Text scaling for dynamic type support
  getScaledSize(baseSize) {
    return Math.round(baseSize * this.textScale);
  }

  // High contrast color system
  getAccessibleColors() {
    if (this.isHighContrastEnabled) {
      return {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#0066CC',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#333333',
        border: '#000000',
        success: '#006600',
        warning: '#CC6600',
        error: '#CC0000',
        info: '#0066CC'
      };
    }
    
    // Standard color palette
    return {
      primary: '#4CAF50',
      secondary: '#2196F3',
      accent: '#FF9800',
      background: '#FFFFFF',
      surface: '#F8F9FA',
      text: '#212529',
      textSecondary: '#6C757D',
      border: '#DEE2E6',
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
      info: '#17A2B8'
    };
  }

  // WCAG AAA compliant touch targets
  getAccessibleTouchTarget() {
    const { width, height } = Dimensions.get('window');
    const minSize = Math.max(44, width * 0.12); // Minimum 44pt or 12% of screen width
    return {
      minWidth: minSize,
      minHeight: minSize,
      paddingHorizontal: 8,
      paddingVertical: 8
    };
  }

  // Accessible announcements
  async announceForScreenReader(message, priority = 'polite') {
    if (!this.isScreenReaderEnabled) return;
    
    try {
      AccessibilityInfo.announceForAccessibility(message);
      
      // Also speak if voice guidance is enabled
      if (this.isVoiceGuidanceEnabled) {
        await this.speak(message, { rate: 0.8 });
      }
    } catch (error) {
      console.warn('Screen reader announcement failed:', error);
    }
  }

  // Voice-guided scanning assistance
  async provideScanningGuidance(step, context = {}) {
    const guidance = {
      start: "Point your camera at the barcode. Keep the item steady and well-lit.",
      detecting: "Barcode detected. Hold steady while we scan.",
      success: `Successfully scanned ${context.itemName || 'item'}. Well done!`,
      retry: "Scanning failed. Try moving closer or improving the lighting.",
      multiple: "Multiple barcodes detected. Focus on one item at a time.",
      help: "For best results, hold the item 6-12 inches from your camera with good lighting."
    };

    const message = guidance[step] || step;
    await this.speak(message);
    
    // Provide appropriate haptic feedback
    switch (step) {
      case 'success':
        await this.provideFeedback('success');
        break;
      case 'retry':
        await this.provideFeedback('warning');
        break;
      case 'detecting':
        await this.provideFeedback('light');
        break;
    }
  }

  // Preference management
  async updatePreference(key, value) {
    const preferences = {
      isHighContrastEnabled: this.isHighContrastEnabled,
      textScale: this.textScale,
      isVoiceGuidanceEnabled: this.isVoiceGuidanceEnabled,
      preferredLanguage: this.preferredLanguage,
      hapticFeedbackEnabled: this.hapticFeedbackEnabled,
      [key]: value
    };

    try {
      await AsyncStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
      this[key] = value;
      this.notifyListeners('preferenceChanged', { key, value });
    } catch (error) {
      console.error('Failed to save accessibility preference:', error);
    }
  }

  async loadPreferences() {
    try {
      const stored = await AsyncStorage.getItem('accessibilityPreferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        this.isHighContrastEnabled = preferences.isHighContrastEnabled || false;
        this.textScale = preferences.textScale || 1;
        this.isVoiceGuidanceEnabled = preferences.isVoiceGuidanceEnabled || false;
        this.preferredLanguage = preferences.preferredLanguage || 'en';
        this.hapticFeedbackEnabled = preferences.hapticFeedbackEnabled !== false;
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
    }
  }

  // Event system for UI updates
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
        console.warn('Accessibility listener error:', error);
      }
    });
  }

  // Color blindness support
  getColorBlindFriendlyPalette(type = 'deuteranopia') {
    const palettes = {
      deuteranopia: { // Most common form
        primary: '#0173B2',
        secondary: '#DE8F05',
        success: '#029E73',
        warning: '#CC78BC',
        error: '#D55E00'
      },
      protanopia: {
        primary: '#0173B2',
        secondary: '#DE8F05',
        success: '#029E73',
        warning: '#CC78BC',
        error: '#D55E00'
      },
      tritanopia: {
        primary: '#0173B2',
        secondary: '#D55E00',
        success: '#029E73',
        warning: '#F0E442',
        error: '#CC78BC'
      }
    };

    return palettes[type] || palettes.deuteranopia;
  }

  // Generate accessible labels
  generateAccessibilityLabel(element, context = {}) {
    const { type, value, state, hint } = context;
    let label = '';

    switch (type) {
      case 'button':
        label = `${value} button`;
        if (state) label += `, ${state}`;
        break;
      case 'input':
        label = `${value} text field`;
        if (state) label += `, ${state}`;
        break;
      case 'scan':
        label = 'Scan barcode button. Double tap to start scanning.';
        break;
      case 'reward':
        label = `${value} reward. ${context.points} points required.`;
        break;
      default:
        label = value || element;
    }

    if (hint) label += `. ${hint}`;
    return label;
  }

  // Screen reader navigation optimization
  getOptimizedTabOrder(elements) {
    // Prioritize interactive elements and logical flow
    return elements.sort((a, b) => {
      const priorityOrder = ['header', 'navigation', 'main', 'button', 'input', 'footer'];
      const aPriority = priorityOrder.indexOf(a.type) !== -1 ? priorityOrder.indexOf(a.type) : 999;
      const bPriority = priorityOrder.indexOf(b.type) !== -1 ? priorityOrder.indexOf(b.type) : 999;
      return aPriority - bPriority;
    });
  }
}

export default new AccessibilityService();