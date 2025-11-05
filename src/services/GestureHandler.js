import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Dimensions, Vibration } from 'react-native';
import AccessibilityService from './AccessibilityService';
import UserPreferences from './UserPreferences';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

class GestureHandler {
  constructor() {
    this.gestures = {
      swipeToScan: { enabled: true, threshold: 100 },
      pullToRefresh: { enabled: true, threshold: 80 },
      swipeNavigation: { enabled: true, threshold: 50 },
      quickActions: { enabled: true, holdDuration: 500 },
      oneHandedMode: { enabled: false, activationZone: 0.3 }
    };
    
    this.shortcuts = {
      doubleSwipeUp: 'openRewards',
      doubleSwipeDown: 'openProfile',
      swipeRight: 'openScan',
      swipeLeft: 'goBack',
      longPressBottomEdge: 'toggleOneHanded'
    };
    
    this.listeners = [];
    this.activeGestures = new Map();
    
    this.init();
  }

  async init() {
    // Load gesture preferences
    const preferences = UserPreferences.get('interaction');
    if (preferences) {
      this.gestures.swipeNavigation.enabled = preferences.swipeGestures;
      this.gestures.oneHandedMode.enabled = preferences.oneHandedMode;
    }
    
    // Set up user preference listeners
    UserPreferences.addListener((event, data) => {
      if (event === 'preferenceChanged' && data.category === 'interaction') {
        this.updateGestureSettings(data.key, data.value);
      }
    });
  }

  // Update gesture settings based on preferences
  updateGestureSettings(key, value) {
    switch (key) {
      case 'swipeGestures':
        this.gestures.swipeNavigation.enabled = value;
        this.gestures.pullToRefresh.enabled = value;
        break;
      case 'oneHandedMode':
        this.gestures.oneHandedMode.enabled = value;
        this.notifyListeners('oneHandedModeChanged', value);
        break;
    }
  }

  // Create swipe-to-scan gesture
  createSwipeToScanGesture(onScanActivated) {
    return {
      onGestureEvent: (event) => {
        const { translationY, velocityY } = event.nativeEvent;
        
        // Upward swipe to activate scanner
        if (translationY < -this.gestures.swipeToScan.threshold && velocityY < -500) {
          this.handleSwipeToScan(onScanActivated);
        }
      },
      onHandlerStateChange: (event) => {
        if (event.nativeEvent.state === State.END) {
          this.resetGestureState('swipeToScan');
        }
      }
    };
  }

  async handleSwipeToScan(callback) {
    if (!this.gestures.swipeToScan.enabled) return;
    
    try {
      // Provide haptic feedback
      await AccessibilityService.provideFeedback('medium');
      
      // Voice guidance for screen reader users
      if (AccessibilityService.isScreenReaderEnabled) {
        await AccessibilityService.speak('Opening camera for scanning');
      }
      
      // Record usage pattern
      await UserPreferences.recordUsagePattern('swipe_to_scan');
      
      // Execute callback
      if (callback) callback();
      
    } catch (error) {
      console.warn('Swipe to scan gesture failed:', error);
    }
  }

  // Create pull-to-refresh gesture
  createPullToRefreshGesture(onRefresh) {
    let refreshTriggered = false;
    
    return {
      onGestureEvent: (event) => {
        const { translationY, velocityY } = event.nativeEvent;
        
        if (translationY > this.gestures.pullToRefresh.threshold && velocityY > 300 && !refreshTriggered) {
          refreshTriggered = true;
          this.handlePullToRefresh(onRefresh);
        }
      },
      onHandlerStateChange: (event) => {
        if (event.nativeEvent.state === State.END) {
          refreshTriggered = false;
          this.resetGestureState('pullToRefresh');
        }
      }
    };
  }

  async handlePullToRefresh(callback) {
    if (!this.gestures.pullToRefresh.enabled) return;
    
    try {
      // Light haptic feedback
      await AccessibilityService.provideFeedback('light');
      
      // Announce for screen readers
      await AccessibilityService.announceForScreenReader('Refreshing content');
      
      // Record usage
      await UserPreferences.recordUsagePattern('pull_to_refresh');
      
      // Execute refresh
      if (callback) callback();
      
    } catch (error) {
      console.warn('Pull to refresh gesture failed:', error);
    }
  }

  // Create swipe navigation gesture
  createSwipeNavigationGesture(onSwipeLeft, onSwipeRight) {
    return {
      onGestureEvent: (event) => {
        const { translationX, velocityX } = event.nativeEvent;
        const threshold = this.gestures.swipeNavigation.threshold;
        
        if (Math.abs(translationX) > threshold && Math.abs(velocityX) > 300) {
          if (translationX > 0 && onSwipeRight) {
            this.handleSwipeNavigation('right', onSwipeRight);
          } else if (translationX < 0 && onSwipeLeft) {
            this.handleSwipeNavigation('left', onSwipeLeft);
          }
        }
      },
      onHandlerStateChange: (event) => {
        if (event.nativeEvent.state === State.END) {
          this.resetGestureState('swipeNavigation');
        }
      }
    };
  }

  async handleSwipeNavigation(direction, callback) {
    if (!this.gestures.swipeNavigation.enabled) return;
    
    try {
      // Selection haptic feedback
      await AccessibilityService.provideFeedback('selection');
      
      // Voice guidance
      const action = direction === 'left' ? 'Going back' : 'Moving forward';
      if (AccessibilityService.isVoiceGuidanceEnabled) {
        await AccessibilityService.speak(action);
      }
      
      // Record pattern
      await UserPreferences.recordUsagePattern('swipe_navigation', { direction });
      
      // Execute callback
      if (callback) callback();
      
    } catch (error) {
      console.warn('Swipe navigation failed:', error);
    }
  }

  // Create long press gesture for quick actions
  createLongPressGesture(actions) {
    return {
      onHandlerStateChange: async (event) => {
        if (event.nativeEvent.state === State.ACTIVE) {
          await this.handleLongPress(actions, event.nativeEvent);
        }
      }
    };
  }

  async handleLongPress(actions, gestureData) {
    if (!this.gestures.quickActions.enabled) return;
    
    try {
      // Heavy haptic feedback for long press
      await AccessibilityService.provideFeedback('heavy');
      
      // Determine action based on location
      const { x, y } = gestureData;
      const action = this.getQuickActionForLocation(x, y, actions);
      
      if (action) {
        // Announce action
        await AccessibilityService.announceForScreenReader(`Quick action: ${action.label}`);
        
        // Record usage
        await UserPreferences.recordUsagePattern('long_press_action', {
          action: action.id,
          x,
          y
        });
        
        // Execute action
        if (action.callback) action.callback();
      }
      
    } catch (error) {
      console.warn('Long press gesture failed:', error);
    }
  }

  getQuickActionForLocation(x, y, actions) {
    // Determine which action to trigger based on gesture location
    const screenQuadrant = this.getScreenQuadrant(x, y);
    return actions[screenQuadrant] || actions.default;
  }

  getScreenQuadrant(x, y) {
    const midX = SCREEN_WIDTH / 2;
    const midY = SCREEN_HEIGHT / 2;
    
    if (x < midX && y < midY) return 'topLeft';
    if (x >= midX && y < midY) return 'topRight';
    if (x < midX && y >= midY) return 'bottomLeft';
    return 'bottomRight';
  }

  // One-handed mode support
  createOneHandedGesture(onToggle) {
    return {
      onHandlerStateChange: async (event) => {
        const { x, y, state } = event.nativeEvent;
        
        if (state === State.END) {
          // Check if gesture is in one-handed activation zone (bottom edge)
          const activationZone = SCREEN_HEIGHT * (1 - this.gestures.oneHandedMode.activationZone);
          
          if (y > activationZone) {
            await this.toggleOneHandedMode(onToggle);
          }
        }
      }
    };
  }

  async toggleOneHandedMode(callback) {
    const newState = !this.gestures.oneHandedMode.enabled;
    
    // Update preference
    await UserPreferences.set('interaction', 'oneHandedMode', newState);
    
    // Provide feedback
    await AccessibilityService.provideFeedback('success');
    await AccessibilityService.announceForScreenReader(
      `One-handed mode ${newState ? 'enabled' : 'disabled'}`
    );
    
    // Record usage
    await UserPreferences.recordUsagePattern('one_handed_toggle', { enabled: newState });
    
    // Execute callback
    if (callback) callback(newState);
  }

  // Multi-touch gesture support
  createPinchGesture(onPinch) {
    return {
      onGestureEvent: (event) => {
        const { scale, velocity } = event.nativeEvent;
        
        if (onPinch) {
          onPinch(scale, velocity);
        }
      },
      onHandlerStateChange: async (event) => {
        if (event.nativeEvent.state === State.END) {
          // Record pinch usage
          await UserPreferences.recordUsagePattern('pinch_gesture', {
            finalScale: event.nativeEvent.scale
          });
        }
      }
    };
  }

  // Gesture shortcut system
  createGestureShortcuts(handlers) {
    const gestureSequence = [];
    const sequenceTimeout = 1000; // 1 second to complete sequence
    let sequenceTimer;
    
    return {
      onGestureEvent: (event) => {
        const { translationX, translationY, state } = event.nativeEvent;
        
        if (state === State.END) {
          // Determine gesture direction
          const direction = this.getGestureDirection(translationX, translationY);
          
          // Add to sequence
          gestureSequence.push({
            direction,
            timestamp: Date.now()
          });
          
          // Clear previous timer
          if (sequenceTimer) clearTimeout(sequenceTimer);
          
          // Set timer to process sequence
          sequenceTimer = setTimeout(() => {
            this.processGestureSequence(gestureSequence, handlers);
            gestureSequence.length = 0; // Clear sequence
          }, sequenceTimeout);
        }
      }
    };
  }

  getGestureDirection(translationX, translationY) {
    const threshold = 50;
    
    if (Math.abs(translationX) > Math.abs(translationY)) {
      return translationX > threshold ? 'right' : translationX < -threshold ? 'left' : 'tap';
    } else {
      return translationY > threshold ? 'down' : translationY < -threshold ? 'up' : 'tap';
    }
  }

  async processGestureSequence(sequence, handlers) {
    if (sequence.length < 2) return; // Need at least 2 gestures for shortcuts
    
    // Create sequence string
    const sequenceString = sequence.map(g => g.direction).join('-');
    
    // Check for predefined shortcuts
    const shortcutAction = this.shortcuts[sequenceString];
    
    if (shortcutAction && handlers[shortcutAction]) {
      // Provide feedback
      await AccessibilityService.provideFeedback('success');
      await AccessibilityService.announceForScreenReader(`Shortcut activated: ${shortcutAction}`);
      
      // Record usage
      await UserPreferences.recordUsagePattern('gesture_shortcut', {
        sequence: sequenceString,
        action: shortcutAction
      });
      
      // Execute handler
      handlers[shortcutAction]();
    }
  }

  // Gesture learning system
  async learnGesturePattern(gestureType, context) {
    // Record successful gesture usage to improve recognition
    const patterns = await this.getStoredPatterns();
    
    if (!patterns[gestureType]) {
      patterns[gestureType] = {
        usage: 0,
        contexts: {},
        adaptations: {}
      };
    }
    
    patterns[gestureType].usage++;
    
    if (context) {
      const contextKey = JSON.stringify(context);
      patterns[gestureType].contexts[contextKey] = 
        (patterns[gestureType].contexts[contextKey] || 0) + 1;
    }
    
    await this.savePatterns(patterns);
  }

  async getStoredPatterns() {
    try {
      const stored = await AsyncStorage.getItem('gesturePatterns');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load gesture patterns:', error);
      return {};
    }
  }

  async savePatterns(patterns) {
    try {
      await AsyncStorage.setItem('gesturePatterns', JSON.stringify(patterns));
    } catch (error) {
      console.warn('Failed to save gesture patterns:', error);
    }
  }

  // Reset gesture state
  resetGestureState(gestureType) {
    if (this.activeGestures.has(gestureType)) {
      this.activeGestures.delete(gestureType);
    }
  }

  // Accessibility optimizations
  getAccessibleGestureConfig() {
    const config = { ...this.gestures };
    
    // Adjust thresholds for accessibility
    if (AccessibilityService.isScreenReaderEnabled) {
      // Increase thresholds for screen reader users
      config.swipeToScan.threshold *= 1.5;
      config.pullToRefresh.threshold *= 1.3;
      config.swipeNavigation.threshold *= 1.2;
    }
    
    // Adjust for motor impairments
    const motorSupport = UserPreferences.get('accessibility', 'motorSupport');
    if (motorSupport) {
      config.quickActions.holdDuration *= 0.7; // Shorter hold duration
      Object.keys(config).forEach(key => {
        if (config[key].threshold) {
          config[key].threshold *= 0.8; // Lower thresholds
        }
      });
    }
    
    return config;
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
        console.warn('Gesture handler listener error:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    this.listeners = [];
    this.activeGestures.clear();
  }
}

export default new GestureHandler();