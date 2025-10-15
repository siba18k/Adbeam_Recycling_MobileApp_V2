export const colors = {
    // Primary eco-green gradients
    primary: {
        gradient: ['#059669', '#10b981'], // emerald green gradient
        light: '#6ee7b7',
        main: '#059669',
        dark: '#047857'
    },

    // Secondary nature-inspired gradients
    secondary: {
        gradient: ['#065f07', '#047857'], // deep forest green
        light: '#84cc16',
        main: '#065f46',
        dark: '#064e3b'
    },

    // Success/eco gradients
    success: {
        gradient: ['#22c55e', '#16a34a'], // vibrant green
        light: '#86efac',
        main: '#22c55e',
        dark: '#15803d'
    },

    // Accent earth tones
    accent: {
        gradient: ['#84cc16', '#65a30d'], // lime green
        light: '#bef264',
        main: '#84cc16',
        dark: '#65a30d'
    },

    // Background gradients
    background: {
        primary: ['#059669', '#10b981'], // main emerald
        secondary: ['#22c55e', '#16a34a'], // vibrant green
        success: ['#84cc16', '#65a30d'], // lime
        forest: ['#065f46', '#047857'], // deep forest
        neutral: ['#f0fdf4', '#dcfce7'], // very light green
        dark: ['#14532d', '#166534'] // dark green
    },

    // Card & surface colors
    surface: {
        white: '#ffffff',
        light: '#f0fdf4', // very light green tint
        card: '#ffffff',
        overlay: 'rgba(20, 83, 45, 0.6)', // dark green overlay
        glass: 'rgba(255, 255, 255, 0.1)'
    },

    // Text colors
    text: {
        primary: '#14532d', // dark green
        secondary: '#166534', // medium green
        light: '#4ade80', // light green
        inverse: '#ffffff',
        accent: '#059669' // emerald
    },

    // Status colors (eco-themed)
    status: {
        success: '#22c55e', // green success
        warning: '#eab308', // yellow warning
        error: '#dc2626', // red error
        info: '#0ea5e9', // blue info
        recycle: '#10b981' // special recycling color
    },

    // Shadow colors
    shadow: {
        light: 'rgba(5, 150, 105, 0.1)',
        medium: 'rgba(5, 150, 105, 0.2)',
        heavy: 'rgba(20, 83, 45, 0.3)'
    }
};

export const gradients = {
    primary: colors.primary.gradient,
    secondary: colors.secondary.gradient,
    success: colors.success.gradient,
    accent: colors.accent.gradient,
    backgroundPrimary: colors.background.primary,
    backgroundSecondary: colors.background.secondary,
    backgroundSuccess: colors.background.success,
    backgroundForest: colors.background.forest,
    backgroundNeutral: colors.background.neutral,
    backgroundDark: colors.background.dark
};

// Recycling-specific color palette
export const recyclingColors = {
    plastic: '#3b82f6', // blue for plastic
    glass: '#10b981', // green for glass
    metal: '#64748b', // gray for metal
    paper: '#f59e0b', // orange for paper
    organic: '#84cc16', // lime for organic
    electronic: '#8b5cf6' // purple for e-waste
};
