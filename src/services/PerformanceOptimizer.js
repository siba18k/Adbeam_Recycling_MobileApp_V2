import { InteractionManager, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserPreferences from './UserPreferences';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      frameDrops: 0,
      memoryUsage: 0,
      renderTimes: [],
      interactionResponses: [],
      networkRequests: []
    };
    
    this.optimizations = {
      imageQuality: 'medium',
      animationSpeed: 'normal',
      preloadContent: true,
      backgroundRefresh: true,
      lowPowerMode: false,
      reducedMotion: false
    };
    
    this.deviceCapabilities = {
      isLowEndDevice: false,
      supportsSmoothAnimations: true,
      memoryConstraints: false
    };
    
    this.listeners = [];
    this.performanceMonitor = null;
    
    this.init();
  }

  async init() {
    // Analyze device capabilities
    this.analyzeDeviceCapabilities();
    
    // Load saved optimizations
    await this.loadOptimizations();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Apply initial optimizations
    this.applyOptimizations();
    
    // Set up preference listeners
    this.setupPreferenceListeners();
  }

  analyzeDeviceCapabilities() {
    const screenSize = SCREEN_WIDTH * SCREEN_HEIGHT;
    const screenDensity = SCREEN_WIDTH > 1080 ? 'high' : SCREEN_WIDTH > 720 ? 'medium' : 'low';
    
    // Estimate device capabilities based on screen properties
    // This is a simplified heuristic - in production, you might use more sophisticated detection
    this.deviceCapabilities.isLowEndDevice = screenSize < 1000000 || screenDensity === 'low';
    this.deviceCapabilities.supportsSmoothAnimations = !this.deviceCapabilities.isLowEndDevice;
    this.deviceCapabilities.memoryConstraints = this.deviceCapabilities.isLowEndDevice;
    
    console.log('Device capabilities analyzed:', this.deviceCapabilities);
  }

  async loadOptimizations() {
    try {
      const stored = await AsyncStorage.getItem('performanceOptimizations');
      if (stored) {
        this.optimizations = { ...this.optimizations, ...JSON.parse(stored) };
      }
      
      // Load user preferences that affect performance
      const prefs = UserPreferences.get('performance');
      if (prefs) {
        this.optimizations = { ...this.optimizations, ...prefs };
      }
    } catch (error) {
      console.warn('Failed to load performance optimizations:', error);
    }
  }

  async saveOptimizations() {
    try {
      await AsyncStorage.setItem('performanceOptimizations', JSON.stringify(this.optimizations));
    } catch (error) {
      console.warn('Failed to save performance optimizations:', error);
    }
  }

  setupPreferenceListeners() {
    UserPreferences.addListener((event, data) => {
      if (event === 'preferenceChanged' && data.category === 'performance') {
        this.optimizations[data.key] = data.value;
        this.applyOptimizations();
      }
    });
  }

  // Performance monitoring system
  startPerformanceMonitoring() {
    let frameCount = 0;
    let lastFrameTime = Date.now();
    
    this.performanceMonitor = setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastFrameTime;
      
      // Monitor frame rate (target: 60fps = 16.67ms per frame)
      if (deltaTime > 16.67) {
        this.metrics.frameDrops++;
      }
      
      frameCount++;
      lastFrameTime = currentTime;
      
      // Log performance metrics every 1000 frames
      if (frameCount % 1000 === 0) {
        this.analyzePerformanceMetrics();
      }
    }, 16.67); // Target 60fps
  }

  stopPerformanceMonitoring() {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = null;
    }
  }

  // Track render performance
  trackRenderTime(componentName, startTime) {
    const renderTime = Date.now() - startTime;
    
    this.metrics.renderTimes.push({
      component: componentName,
      duration: renderTime,
      timestamp: Date.now()
    });
    
    // Keep only recent render times
    if (this.metrics.renderTimes.length > 100) {
      this.metrics.renderTimes.shift();
    }
    
    // Alert if render time is too high
    if (renderTime > 100) {
      console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
      this.suggestOptimization('slowRender', { component: componentName, duration: renderTime });
    }
  }

  // Track interaction responsiveness
  trackInteractionResponse(interactionType, startTime) {
    const responseTime = Date.now() - startTime;
    
    this.metrics.interactionResponses.push({
      type: interactionType,
      duration: responseTime,
      timestamp: Date.now()
    });
    
    // Keep only recent interactions
    if (this.metrics.interactionResponses.length > 50) {
      this.metrics.interactionResponses.shift();
    }
    
    // Alert if interaction is too slow
    if (responseTime > 100) {
      console.warn(`Slow interaction: ${interactionType} took ${responseTime}ms`);
      this.suggestOptimization('slowInteraction', { type: interactionType, duration: responseTime });
    }
  }

  // Network performance tracking
  trackNetworkRequest(url, startTime, success = true) {
    const duration = Date.now() - startTime;
    
    this.metrics.networkRequests.push({
      url,
      duration,
      success,
      timestamp: Date.now()
    });
    
    // Keep only recent requests
    if (this.metrics.networkRequests.length > 50) {
      this.metrics.networkRequests.shift();
    }
  }

  // Memory usage estimation
  estimateMemoryUsage(component, dataSize = 0) {
    // Simple heuristic for memory usage estimation
    let estimatedUsage = 0;
    
    switch (component) {
      case 'camera':
        estimatedUsage = 50; // MB
        break;
      case 'image':
        estimatedUsage = dataSize / 1024 / 1024; // Convert to MB
        break;
      case 'list':
        estimatedUsage = dataSize * 0.001; // Estimate based on items
        break;
      default:
        estimatedUsage = 1;
    }
    
    this.metrics.memoryUsage += estimatedUsage;
    
    // Trigger memory optimization if usage is high
    if (this.metrics.memoryUsage > 100) {
      this.optimizeMemoryUsage();
    }
  }

  // Analyze performance metrics and adjust optimizations
  analyzePerformanceMetrics() {
    const analysis = {
      avgRenderTime: this.calculateAverageRenderTime(),
      avgInteractionTime: this.calculateAverageInteractionTime(),
      frameDropRate: this.calculateFrameDropRate(),
      networkPerformance: this.calculateNetworkPerformance()
    };
    
    // Suggest automatic optimizations
    if (analysis.avgRenderTime > 50) {
      this.applyOptimization('reduceAnimations');
    }
    
    if (analysis.frameDropRate > 0.1) {
      this.applyOptimization('lowerImageQuality');
    }
    
    if (analysis.avgInteractionTime > 150) {
      this.applyOptimization('enableLowPowerMode');
    }
    
    // Notify listeners of performance status
    this.notifyListeners('performanceAnalysis', analysis);
  }

  calculateAverageRenderTime() {
    if (this.metrics.renderTimes.length === 0) return 0;
    
    const total = this.metrics.renderTimes.reduce((sum, rt) => sum + rt.duration, 0);
    return total / this.metrics.renderTimes.length;
  }

  calculateAverageInteractionTime() {
    if (this.metrics.interactionResponses.length === 0) return 0;
    
    const total = this.metrics.interactionResponses.reduce((sum, ir) => sum + ir.duration, 0);
    return total / this.metrics.interactionResponses.length;
  }

  calculateFrameDropRate() {
    // Simplified frame drop calculation
    return this.metrics.frameDrops / 1000; // Drops per 1000 frames
  }

  calculateNetworkPerformance() {
    if (this.metrics.networkRequests.length === 0) return { avgDuration: 0, successRate: 1 };
    
    const successful = this.metrics.networkRequests.filter(req => req.success);
    const avgDuration = this.metrics.networkRequests.reduce((sum, req) => sum + req.duration, 0) / this.metrics.networkRequests.length;
    const successRate = successful.length / this.metrics.networkRequests.length;
    
    return { avgDuration, successRate };
  }

  // Apply performance optimizations
  applyOptimizations() {
    if (this.deviceCapabilities.isLowEndDevice) {
      this.optimizations.imageQuality = 'low';
      this.optimizations.animationSpeed = 'reduced';
      this.optimizations.preloadContent = false;
    }
    
    if (this.optimizations.lowPowerMode) {
      this.applyLowPowerOptimizations();
    }
    
    this.notifyListeners('optimizationsApplied', this.optimizations);
  }

  applyOptimization(type) {
    switch (type) {
      case 'reduceAnimations':
        this.optimizations.animationSpeed = 'reduced';
        this.optimizations.reducedMotion = true;
        break;
        
      case 'lowerImageQuality':
        if (this.optimizations.imageQuality === 'high') {
          this.optimizations.imageQuality = 'medium';
        } else if (this.optimizations.imageQuality === 'medium') {
          this.optimizations.imageQuality = 'low';
        }
        break;
        
      case 'enableLowPowerMode':
        this.optimizations.lowPowerMode = true;
        this.applyLowPowerOptimizations();
        break;
        
      case 'disablePreloading':
        this.optimizations.preloadContent = false;
        break;
        
      case 'reduceBgRefresh':
        this.optimizations.backgroundRefresh = false;
        break;
    }
    
    this.saveOptimizations();
    this.applyOptimizations();
  }

  applyLowPowerOptimizations() {
    this.optimizations.imageQuality = 'low';
    this.optimizations.animationSpeed = 'reduced';
    this.optimizations.preloadContent = false;
    this.optimizations.backgroundRefresh = false;
    this.optimizations.reducedMotion = true;
  }

  // Memory optimization
  optimizeMemoryUsage() {
    console.log('Optimizing memory usage...');
    
    // Clear old metrics
    if (this.metrics.renderTimes.length > 50) {
      this.metrics.renderTimes = this.metrics.renderTimes.slice(-25);
    }
    
    if (this.metrics.interactionResponses.length > 25) {
      this.metrics.interactionResponses = this.metrics.interactionResponses.slice(-10);
    }
    
    if (this.metrics.networkRequests.length > 25) {
      this.metrics.networkRequests = this.metrics.networkRequests.slice(-10);
    }
    
    // Reset memory counter
    this.metrics.memoryUsage = Math.max(0, this.metrics.memoryUsage - 50);
    
    this.notifyListeners('memoryOptimized');
  }

  // Image optimization
  getOptimizedImageSettings() {
    const settings = {
      quality: 0.8,
      maxWidth: SCREEN_WIDTH,
      maxHeight: SCREEN_HEIGHT,
      format: 'JPEG'
    };
    
    switch (this.optimizations.imageQuality) {
      case 'low':
        settings.quality = 0.5;
        settings.maxWidth = Math.min(SCREEN_WIDTH, 720);
        settings.maxHeight = Math.min(SCREEN_HEIGHT, 1280);
        break;
        
      case 'medium':
        settings.quality = 0.7;
        settings.maxWidth = Math.min(SCREEN_WIDTH, 1080);
        settings.maxHeight = Math.min(SCREEN_HEIGHT, 1920);
        break;
        
      case 'high':
        settings.quality = 0.9;
        // Use full screen resolution
        break;
    }
    
    return settings;
  }

  // Animation optimization
  getOptimizedAnimationSettings() {
    const settings = {
      duration: 300,
      useNativeDriver: true,
      enableGestures: true
    };
    
    if (this.optimizations.reducedMotion || this.optimizations.animationSpeed === 'reduced') {
      settings.duration = 150;
      settings.enableGestures = false;
    } else if (this.optimizations.animationSpeed === 'fast') {
      settings.duration = 200;
    }
    
    // Disable animations on low-end devices
    if (this.deviceCapabilities.isLowEndDevice) {
      settings.duration = 0;
      settings.enableGestures = false;
    }
    
    return settings;
  }

  // Network optimization
  getOptimizedNetworkSettings() {
    return {
      timeout: this.optimizations.lowPowerMode ? 10000 : 5000,
      retry: this.optimizations.lowPowerMode ? 1 : 3,
      compression: this.optimizations.imageQuality !== 'high',
      cacheMaxAge: this.optimizations.preloadContent ? 3600 : 300
    };
  }

  // Lazy loading configuration
  getLazyLoadingConfig() {
    return {
      enabled: this.optimizations.preloadContent,
      threshold: this.deviceCapabilities.isLowEndDevice ? 200 : 100,
      batchSize: this.deviceCapabilities.isLowEndDevice ? 5 : 10
    };
  }

  // Performance-aware component rendering
  shouldRenderComponent(componentName, props = {}) {
    // Skip expensive components on low-end devices
    if (this.deviceCapabilities.isLowEndDevice) {
      const expensiveComponents = ['camera', 'video', 'complexAnimations'];
      if (expensiveComponents.includes(componentName)) {
        return false;
      }
    }
    
    // Skip animations if reduced motion is enabled
    if (this.optimizations.reducedMotion && componentName.includes('animation')) {
      return false;
    }
    
    return true;
  }

  // Batch operations for better performance
  batchOperations(operations, batchSize = 10) {
    return new Promise((resolve) => {
      let currentBatch = 0;
      const totalBatches = Math.ceil(operations.length / batchSize);
      const results = [];
      
      const processBatch = () => {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, operations.length);
        const batch = operations.slice(start, end);
        
        // Process batch operations
        const batchResults = batch.map(op => {
          try {
            return op();
          } catch (error) {
            return { error };
          }
        });
        
        results.push(...batchResults);
        currentBatch++;
        
        if (currentBatch < totalBatches) {
          // Schedule next batch after current interaction completes
          InteractionManager.runAfterInteractions(() => {
            setTimeout(processBatch, 0);
          });
        } else {
          resolve(results);
        }
      };
      
      processBatch();
    });
  }

  // Suggest optimizations to user
  suggestOptimization(type, data) {
    const suggestions = {
      slowRender: {
        title: 'Improve App Performance',
        message: 'We noticed some slow rendering. Would you like to enable performance mode?',
        action: () => this.applyOptimization('enableLowPowerMode')
      },
      slowInteraction: {
        title: 'Optimize Interactions',
        message: 'App interactions seem slow. Try reducing animations for better performance.',
        action: () => this.applyOptimization('reduceAnimations')
      },
      memoryWarning: {
        title: 'Memory Optimization',
        message: 'App is using a lot of memory. Consider lowering image quality.',
        action: () => this.applyOptimization('lowerImageQuality')
      }
    };
    
    const suggestion = suggestions[type];
    if (suggestion) {
      this.notifyListeners('suggestionAvailable', {
        type,
        suggestion,
        data
      });
    }
  }

  // Performance reporting
  getPerformanceReport() {
    return {
      metrics: {
        ...this.metrics,
        avgRenderTime: this.calculateAverageRenderTime(),
        avgInteractionTime: this.calculateAverageInteractionTime(),
        frameDropRate: this.calculateFrameDropRate(),
        networkPerformance: this.calculateNetworkPerformance()
      },
      optimizations: { ...this.optimizations },
      deviceCapabilities: { ...this.deviceCapabilities },
      timestamp: new Date().toISOString()
    };
  }

  // Reset performance metrics
  resetMetrics() {
    this.metrics = {
      frameDrops: 0,
      memoryUsage: 0,
      renderTimes: [],
      interactionResponses: [],
      networkRequests: []
    };
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
        console.warn('Performance optimizer listener error:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    this.stopPerformanceMonitoring();
    this.listeners = [];
  }
}

export default new PerformanceOptimizer();