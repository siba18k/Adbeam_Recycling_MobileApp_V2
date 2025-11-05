import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccessibilityService from '../services/AccessibilityService';
import UserPreferences from '../services/UserPreferences';
import ThemeManager from '../services/ThemeManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [theme, setTheme] = useState(ThemeManager.getTheme());
  const scrollViewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Onboarding steps configuration
  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Adbeam',
      subtitle: 'Your sustainable campus companion',
      content: 'Transform your campus recycling habits and earn rewards while making a positive environmental impact.',
      image: '♻️',
      accessibilityLabel: 'Welcome screen. Adbeam helps you recycle and earn rewards on campus.',
      voiceGuidance: 'Welcome to Adbeam, your sustainable campus companion. This app helps you recycle items and earn rewards while making a positive environmental impact.'
    },
    {
      id: 'accessibility-setup',
      title: 'Accessibility Preferences',
      subtitle: 'Customize your experience',
      content: 'Let\'s set up accessibility features to ensure the best experience for you.',
      component: 'AccessibilitySetup',
      accessibilityLabel: 'Accessibility setup screen. Configure voice guidance, high contrast, and other accessibility features.',
      voiceGuidance: 'Let\'s customize your accessibility preferences. You can enable voice guidance, high contrast mode, and other features to improve your experience.'
    },
    {
      id: 'scanning-tutorial',
      title: 'Learn to Scan',
      subtitle: 'Master the barcode scanner',
      content: 'Practice scanning with our interactive tutorial. Point your camera at barcodes and earn points!',
      component: 'ScanningTutorial',
      accessibilityLabel: 'Scanning tutorial. Learn how to scan barcodes with guided practice.',
      voiceGuidance: 'Now let\'s learn how to scan barcodes. Point your camera at any barcode and hold steady. The app will guide you through the process.'
    },
    {
      id: 'goals-setup',
      title: 'Set Your Goals',
      subtitle: 'Track your impact',
      content: 'Set daily and weekly recycling goals to stay motivated and track your environmental impact.',
      component: 'GoalsSetup',
      accessibilityLabel: 'Goals setup screen. Set your daily and weekly recycling targets.',
      voiceGuidance: 'Set your recycling goals to stay motivated. Choose daily and weekly targets that work for your lifestyle.'
    },
    {
      id: 'campus-integration',
      title: 'Connect Your Campus',
      subtitle: 'Verify your student status',
      content: 'Link your student ID to access campus-specific rewards and connect with fellow recyclers.',
      component: 'CampusIntegration',
      accessibilityLabel: 'Campus integration screen. Connect your student ID for campus rewards.',
      voiceGuidance: 'Connect your student ID to access campus-specific rewards and join your school\'s recycling community.'
    },
    {
      id: 'privacy-permissions',
      title: 'Privacy & Permissions',
      subtitle: 'Your data, your choice',
      content: 'We respect your privacy. Choose what data to share and manage your permissions.',
      component: 'PrivacySetup',
      accessibilityLabel: 'Privacy and permissions screen. Manage data sharing and app permissions.',
      voiceGuidance: 'Review privacy settings and app permissions. You can control what data is shared and change these settings anytime.'
    },
    {
      id: 'social-connections',
      title: 'Find Your Community',
      subtitle: 'Connect with fellow recyclers',
      content: 'Discover other eco-conscious students in your dorm and join recycling challenges.',
      component: 'SocialSetup',
      accessibilityLabel: 'Social connections screen. Find and connect with other recyclers.',
      voiceGuidance: 'Connect with other students who share your commitment to sustainability. Join dorm competitions and group challenges.'
    },
    {
      id: 'rewards-preview',
      title: 'Explore Rewards',
      subtitle: 'See what you can earn',
      content: 'Browse available rewards and learn how to redeem your recycling points.',
      component: 'RewardsPreview',
      accessibilityLabel: 'Rewards preview screen. Explore available rewards and redemption process.',
      voiceGuidance: 'Explore the rewards you can earn through recycling. See coffee vouchers, campus store discounts, and more.'
    },
    {
      id: 'completion',
      title: 'You\'re All Set!',
      subtitle: 'Start recycling and earning',
      content: 'You\'re ready to begin your sustainable journey. Start scanning items and making a difference!',
      image: '🎉',
      accessibilityLabel: 'Onboarding complete. Ready to start recycling and earning rewards.',
      voiceGuidance: 'Congratulations! You\'re all set up and ready to start your recycling journey. Begin scanning items and earning rewards today.'
    }
  ];

  useEffect(() => {
    const unsubscribe = ThemeManager.addListener(setTheme);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Announce current step for screen readers
    const step = onboardingSteps[currentStep];
    if (step) {
      AccessibilityService.announceForScreenReader(step.accessibilityLabel);
      
      // Provide voice guidance if enabled
      if (AccessibilityService.isVoiceGuidanceEnabled) {
        setTimeout(() => {
          AccessibilityService.speak(step.voiceGuidance);
        }, 1000);
      }
    }
  }, [currentStep]);

  const handleNext = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      // Provide haptic feedback
      await AccessibilityService.provideFeedback('light');
      
      // Animate transition
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: -(currentStep + 1) * SCREEN_WIDTH,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
      });
      
      // Record usage pattern
      await UserPreferences.recordUsagePattern('onboarding_next', {
        step: currentStep,
        stepId: onboardingSteps[currentStep].id
      });
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 0) {
      await AccessibilityService.provideFeedback('light');
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: -(currentStep - 1) * SCREEN_WIDTH,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        setCurrentStep(currentStep - 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
      });
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Onboarding?',
      'You can always access these features later in Settings. Are you sure you want to skip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => handleComplete(true)
        }
      ],
      { cancelable: true }
    );
  };

  const handleComplete = async (skipped = false) => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboardingCompleted', JSON.stringify({
        completed: true,
        completedAt: new Date().toISOString(),
        skipped
      }));
      
      // Provide completion feedback
      await AccessibilityService.provideFeedback('success');
      await AccessibilityService.speak('Onboarding completed successfully. Welcome to Adbeam!');
      
      // Record completion
      await UserPreferences.recordUsagePattern('onboarding_complete', {
        totalSteps: onboardingSteps.length,
        completedSteps: currentStep + 1,
        skipped
      });
      
      // Trigger completion callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Error', 'Failed to save onboarding progress. Please try again.');
    }
  };

  const renderProgressIndicator = () => {
    return (
      <View style={[styles.progressContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.progressBar}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep 
                    ? theme.colors.primary 
                    : theme.colors.border
                }
              ]}
              accessible={true}
              accessibilityLabel={`Step ${index + 1} of ${onboardingSteps.length}${index <= currentStep ? ', completed' : ''}`}
            />
          ))}
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {currentStep + 1} of {onboardingSteps.length}
        </Text>
      </View>
    );
  };

  const renderStepContent = (step) => {
    const commonProps = {
      step,
      theme,
      onNext: handleNext,
      onPrevious: handlePrevious
    };

    switch (step.component) {
      case 'AccessibilitySetup':
        return <AccessibilitySetup {...commonProps} />;
      case 'ScanningTutorial':
        return <ScanningTutorial {...commonProps} />;
      case 'GoalsSetup':
        return <GoalsSetup {...commonProps} />;
      case 'CampusIntegration':
        return <CampusIntegration {...commonProps} />;
      case 'PrivacySetup':
        return <PrivacySetup {...commonProps} />;
      case 'SocialSetup':
        return <SocialSetup {...commonProps} />;
      case 'RewardsPreview':
        return <RewardsPreview {...commonProps} />;
      default:
        return (
          <View style={styles.defaultStepContent}>
            {step.image && (
              <Text style={styles.stepEmoji} accessible={false}>
                {step.image}
              </Text>
            )}
            <Text 
              style={[styles.stepTitle, { color: theme.colors.text }]}
              accessible={true}
              accessibilityRole="header"
            >
              {step.title}
            </Text>
            <Text 
              style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}
              accessible={true}
            >
              {step.subtitle}
            </Text>
            <Text 
              style={[styles.stepContent, { color: theme.colors.text }]}
              accessible={true}
            >
              {step.content}
            </Text>
          </View>
        );
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderProgressIndicator()}
      
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          accessible={true}
          accessibilityLabel={`Onboarding step ${currentStep + 1}: ${currentStepData?.title}`}
        >
          {renderStepContent(currentStepData)}
        </ScrollView>
      </Animated.View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navigationButton,
            styles.skipButton,
            { backgroundColor: theme.colors.surface }
          ]}
          onPress={handleSkip}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          accessibilityHint="Skip the remaining onboarding steps"
        >
          <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>

        <View style={styles.navigationActions}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[
                styles.navigationButton,
                styles.secondaryButton,
                { backgroundColor: theme.colors.surface, marginRight: theme.spacing.sm }
              ]}
              onPress={handlePrevious}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Previous step"
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                Previous
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.navigationButton,
              styles.primaryButton,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handleNext}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={currentStep === onboardingSteps.length - 1 ? 'Complete onboarding' : 'Next step'}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.textInverse }]}>
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Accessibility Setup Component
const AccessibilitySetup = ({ theme, onNext }) => {
  const [preferences, setPreferences] = useState({
    voiceGuidance: false,
    highContrast: false,
    largeText: false,
    hapticFeedback: true,
    simplifiedUI: false
  });

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    // Apply changes immediately for preview
    await UserPreferences.set('accessibility', key, value);
    await AccessibilityService.provideFeedback('selection');
  };

  return (
    <View style={styles.setupContainer}>
      <Text style={[styles.setupTitle, { color: theme.colors.text }]}>
        Accessibility Preferences
      </Text>
      <Text style={[styles.setupDescription, { color: theme.colors.textSecondary }]}>
        Enable features that make the app easier to use
      </Text>

      {Object.entries({
        voiceGuidance: 'Voice Guidance',
        highContrast: 'High Contrast',
        largeText: 'Large Text',
        hapticFeedback: 'Haptic Feedback',
        simplifiedUI: 'Simplified Interface'
      }).map(([key, label]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.preferenceItem,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: preferences[key] ? theme.colors.primary : theme.colors.border
            }
          ]}
          onPress={() => handlePreferenceChange(key, !preferences[key])}
          accessible={true}
          accessibilityRole="switch"
          accessibilityState={{ checked: preferences[key] }}
          accessibilityLabel={`${label} ${preferences[key] ? 'enabled' : 'disabled'}`}
        >
          <Text style={[styles.preferenceLabel, { color: theme.colors.text }]}>
            {label}
          </Text>
          <View style={[
            styles.toggle,
            {
              backgroundColor: preferences[key] ? theme.colors.primary : theme.colors.border
            }
          ]}>
            <View style={[
              styles.toggleHandle,
              {
                backgroundColor: theme.colors.background,
                transform: [{ translateX: preferences[key] ? 20 : 0 }]
              }
            ]} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Additional setup components would be implemented similarly...
// For brevity, I'll include placeholders for the other components

const ScanningTutorial = ({ theme }) => (
  <View style={styles.setupContainer}>
    <Text style={[styles.setupTitle, { color: theme.colors.text }]}>Practice Scanning</Text>
    <Text style={[styles.setupDescription, { color: theme.colors.textSecondary }]}>
      Try scanning the practice barcode below
    </Text>
    {/* Interactive scanning tutorial would go here */}
  </View>
);

const GoalsSetup = ({ theme }) => (
  <View style={styles.setupContainer}>
    <Text style={[styles.setupTitle, { color: theme.colors.text }]}>Set Your Goals</Text>
    {/* Goals setup form would go here */}
  </View>
);

const CampusIntegration = ({ theme }) => (
  <View style={styles.setupContainer}>
    <Text style={[styles.setupTitle, { color: theme.colors.text }]}>Campus Integration</Text>
    {/* Campus integration form would go here */}
  </View>
);

const PrivacySetup = ({ theme }) => (
  <View style={styles.setupContainer}>
    <Text style={[styles.setupTitle, { color: theme.colors.text }]}>Privacy Settings</Text>
    {/* Privacy settings would go here */}
  </View>
);

const SocialSetup = ({ theme }) => (
  <View style={styles.setupContainer}>
    <Text style={[styles.setupTitle, { color: theme.colors.text }]}>Social Connections</Text>
    {/* Social setup would go here */}
  </View>
);

const RewardsPreview = ({ theme }) => (
  <View style={styles.setupContainer}>
    <Text style={[styles.setupTitle, { color: theme.colors.text }]}>Available Rewards</Text>
    {/* Rewards preview would go here */}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  progressContainer: {
    padding: 20,
    alignItems: 'center'
  },
  progressBar: {
    flexDirection: 'row',
    marginBottom: 8
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500'
  },
  contentContainer: {
    flex: 1,
    width: SCREEN_WIDTH
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  defaultStepContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  stepEmoji: {
    fontSize: 64,
    marginBottom: 24
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12
  },
  stepSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20
  },
  stepContent: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 34 // Account for safe area
  },
  navigationActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  navigationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  skipButton: {
    backgroundColor: 'transparent'
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500'
  },
  primaryButton: {
    paddingHorizontal: 24
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    borderWidth: 1
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500'
  },
  setupContainer: {
    flex: 1,
    padding: 20
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  setupDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500'
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center'
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 2
  }
});

export default OnboardingFlow;