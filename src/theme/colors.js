// Primary Brand Colors
export const colors = {
    primary: {
        main: '#059669',      // Main green
        light: '#10b981',     // Light green
        dark: '#047857',      // Dark green
    },
    secondary: {
        main: '#0ea5e9',      // Sky blue
        light: '#38bdf8',     // Light blue
        dark: '#0284c7',      // Dark blue
    },
    accent: {
        main: '#f59e0b',      // Amber/Orange
        light: '#fbbf24',     // Light amber
        dark: '#d97706',      // Dark amber
    },
    success: {
        main: '#22c55e',      // Success green
        light: '#4ade80',     // Light success
        dark: '#16a34a',      // Dark success
    },
    status: {
        error: '#ef4444',     // Error red
        warning: '#f59e0b',   // Warning orange
        info: '#3b82f6',      // Info blue
        success: '#10b981',   // Success green
    },
    text: {
        primary: '#111827',   // Main text
        secondary: '#6b7280', // Secondary text
        light: '#9ca3af',     // Light text
        white: '#ffffff',     // White text
    },
    surface: {
        white: '#ffffff',     // Pure white
        light: '#f9fafb',     // Light gray
        medium: '#e5e7eb',    // Medium gray
        dark: '#374151',      // Dark gray
        overlay: 'rgba(0, 0, 0, 0.5)', // Overlay
    },
    shadow: {
        light: '#000000',     // Light shadow
        medium: '#000000',    // Medium shadow
        heavy: '#000000',     // Heavy shadow
    }
};

// Gradient Combinations
export const gradients = {
    primary: [colors.primary.main, colors.primary.light],
    secondary: [colors.secondary.main, colors.secondary.light],
    accent: [colors.accent.main, colors.accent.light],
    success: [colors.success.main, colors.success.light],
    backgroundPrimary: ['#059669', '#10b981', '#22c55e'],
    backgroundSecondary: ['#0ea5e9', '#38bdf8'],
    backgroundNeutral: ['#f8fafc', '#f1f5f9', '#e2e8f0'],
    backgroundDark: ['#1e293b', '#334155'],
    warning: ['#f59e0b', '#fbbf24'],
    error: ['#ef4444', '#f87171'],
    info: ['#3b82f6', '#60a5fa']
};

// Recycling Material Colors
export const recyclingColors = {
    plastic: '#3b82f6',    // Blue for plastic
    glass: '#10b981',      // Green for glass
    aluminum: '#f59e0b',   // Orange for aluminum
    metal: '#f59e0b',      // Orange for metal
    paper: '#8b5cf6',      // Purple for paper
    cardboard: '#8b5cf6',  // Purple for cardboard
    organic: '#22c55e',    // Green for organic
    electronic: '#ef4444', // Red for e-waste
};

// Status Colors for UI Components
export const statusColors = {
    online: '#22c55e',     // Green for online
    offline: '#ef4444',    // Red for offline
    pending: '#f59e0b',    // Orange for pending
    processing: '#3b82f6', // Blue for processing
    completed: '#10b981',  // Success green for completed
    failed: '#ef4444',     // Red for failed
    queued: '#8b5cf6',     // Purple for queued
};

// Theme Variations
export const lightTheme = {
    background: colors.surface.white,
    surface: colors.surface.light,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    border: colors.surface.medium,
    card: colors.surface.white,
};

export const darkTheme = {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    border: '#334155',
    card: '#1e293b',
};

// Component-specific Color Schemes
export const componentColors = {
    scanner: {
        frame: colors.success.main,
        overlay: 'rgba(0, 0, 0, 0.7)',
        scanLine: colors.success.main,
        instruction: 'rgba(5, 150, 105, 0.8)',
    },
    dashboard: {
        headerGradient: gradients.backgroundPrimary,
        cardBackground: colors.surface.white,
        statCard1: gradients.success,
        statCard2: gradients.primary,
        statCard3: gradients.accent,
        statCard4: gradients.secondary,
    },
    rewards: {
        headerGradient: gradients.backgroundPrimary,
        cardBackground: colors.surface.white,
        redeemButton: gradients.success,
        disabledButton: [colors.text.light, colors.text.light],
    },
    profile: {
        headerGradient: gradients.backgroundPrimary,
        editButton: gradients.primary,
        saveButton: gradients.success,
        avatarOverlay: 'rgba(255,255,255,0.2)',
    },
    leaderboard: {
        headerGradient: gradients.backgroundPrimary,
        podiumGold: ['#FFD700', '#FFA500'],
        podiumSilver: ['#C0C0C0', '#A8A8A8'],
        podiumBronze: ['#CD7F32', '#B8860B'],
        currentUser: colors.primary.light + '20',
    },
    vouchers: {
        headerGradient: gradients.backgroundPrimary,
        activeVoucher: gradients.success,
        redeemedVoucher: [colors.text.secondary, colors.text.light],
        expiredVoucher: ['#ef4444', '#dc2626'],
        qrBackground: [colors.surface.white, colors.surface.light],
    }
};

// Semantic Color Names for Better Code Readability
export const semanticColors = {
    // States
    active: colors.success.main,
    inactive: colors.text.light,
    disabled: colors.surface.medium,

    // Actions
    destructive: colors.status.error,
    constructive: colors.success.main,
    neutral: colors.text.secondary,

    // Feedback
    positive: colors.success.main,
    negative: colors.status.error,
    caution: colors.status.warning,
    information: colors.status.info,

    // Eco-themed
    leafGreen: '#22c55e',
    earthBrown: '#92400e',
    skyBlue: '#0ea5e9',
    sunYellow: '#fbbf24',
    waterBlue: '#06b6d4',

    // Material-specific (expanded)
    plasticBlue: '#3b82f6',
    glassGreen: '#10b981',
    metalOrange: '#f59e0b',
    paperPurple: '#8b5cf6',
    organicGreen: '#22c55e',
    electronicRed: '#ef4444',
};

// Export all color schemes
export default {
    colors,
    gradients,
    recyclingColors,
    statusColors,
    lightTheme,
    darkTheme,
    componentColors,
    semanticColors
};

// Utility Functions for Color Manipulation
export const colorUtils = {
    // Add transparency to hex color
    addAlpha: (hexColor, alpha) => {
        const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
        return hexColor + alphaHex;
    },

    // Get contrasting text color for background
    getContrastColor: (backgroundColor) => {
        // Simple light/dark detection
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? colors.text.primary : colors.text.white;
    },

    // Create a lighter version of a color
    lighten: (hexColor, percent) => {
        const num = parseInt(hexColor.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    },

    // Create a darker version of a color
    darken: (hexColor, percent) => {
        const num = parseInt(hexColor.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
};
