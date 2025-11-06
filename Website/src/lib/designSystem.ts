/**
 * Design System - Cognivo Platform
 * Central design tokens for consistent styling across the application
 */

export const DESIGN_SYSTEM = {
  // ============================================
  // COLOR PALETTE
  // ============================================
  colors: {
    // Primary - Blues
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main primary
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Secondary - Purples
    secondary: {
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
    },
    
    // Accent Colors
    accent: {
      green: {
        500: '#10b981',
        600: '#059669',
      },
      orange: {
        500: '#f59e0b',
        600: '#d97706',
      },
      cyan: {
        500: '#06b6d4',
        600: '#0891b2',
      },
      pink: {
        500: '#ec4899',
        600: '#db2777',
      },
      red: {
        500: '#ef4444',
        600: '#dc2626',
      },
    },
    
    // Neutrals - Grays
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  
  // ============================================
  // CHART DATA VISUALIZATION COLORS
  // ============================================
  chartColors: {
    // Modern, accessible palette for data visualization
    primary: [
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#10b981', // Green
      '#f59e0b', // Orange
      '#ef4444', // Red
      '#06b6d4', // Cyan
      '#ec4899', // Pink
      '#6366f1', // Indigo
    ],
    
    // Alternative palettes for specific use cases
    cool: ['#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1'],
    warm: ['#f59e0b', '#ef4444', '#ec4899', '#fb923c'],
    earthy: ['#10b981', '#059669', '#84cc16', '#22c55e'],
    
    // Single-color gradients (for monochromatic charts)
    blueGradient: ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'],
    purpleGradient: ['#e9d5ff', '#c084fc', '#8b5cf6', '#6d28d9', '#581c87'],
    greenGradient: ['#d1fae5', '#6ee7b7', '#10b981', '#059669', '#065f46'],
  },
  
  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    fontFamily: "'Poppins', sans-serif",
    
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '28px',
      '4xl': '32px',
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  
  // ============================================
  // SPACING
  // ============================================
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  
  // ============================================
  // BORDERS & RADIUS
  // ============================================
  borders: {
    width: {
      thin: '1px',
      base: '1.5px',
      thick: '2px',
    },
    
    color: {
      light: '#e2e8f0', // neutral-200
      base: '#cbd5e1',  // neutral-300
      dark: '#94a3b8',  // neutral-400
    },
    
    radius: {
      sm: '6px',
      base: '8px',
      md: '10px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
  },
  
  // ============================================
  // SHADOWS
  // ============================================
  shadows: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.06)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    base: '0 2px 6px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.10)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.12)',
  },
  
  // ============================================
  // CHART DEFAULTS
  // ============================================
  chartDefaults: {
    // Default dimensions
    minWidth: 280,
    minHeight: 200,
    defaultWidth: 420,
    defaultHeight: 320,
    
    // Grid styling
    grid: {
      stroke: '#e2e8f0',
      strokeDasharray: '3 3',
      strokeOpacity: 0.6,
    },
    
    // Axis styling
    axis: {
      stroke: '#cbd5e1',
      fontSize: 12,
      fontFamily: "'Poppins', sans-serif",
      fill: '#64748b',
    },
    
    // Tooltip styling
    tooltip: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      padding: '8px 12px',
      fontSize: 12,
    },
    
    // Legend styling
    legend: {
      fontSize: 12,
      fontFamily: "'Poppins', sans-serif",
      fill: '#475569',
    },
    
    // Chart container
    container: {
      background: '#ffffff',
      border: '1.5px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      padding: '16px',
    },
  },
  
  // ============================================
  // ELEMENT NODE DEFAULTS
  // ============================================
  elementDefaults: {
    text: {
      fontSize: 14,
      fontWeight: 400,
      color: '#334155', // neutral-700
      background: '#ffffff',
      padding: '12px 16px',
    },
    
    title: {
      fontSize: 24,
      fontWeight: 700,
      color: '#1e293b', // neutral-800
      background: '#ffffff',
      padding: '16px 20px',
    },
    
    sectionHeader: {
      fontSize: 18,
      fontWeight: 600,
      color: '#1e293b', // neutral-800
      background: '#f8fafc', // neutral-50
      borderBottom: '2px solid #3b82f6', // primary-500
      padding: '10px 16px',
    },
    
    divider: {
      color: '#cbd5e1', // neutral-300
      thickness: 2,
      background: 'transparent',
    },
  },
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get chart color by index (cycles through primary palette)
 */
export function getChartColor(index: number): string {
  return DESIGN_SYSTEM.chartColors.primary[index % DESIGN_SYSTEM.chartColors.primary.length]
}

/**
 * Get color palette for a specific chart style
 */
export function getChartPalette(style: 'primary' | 'cool' | 'warm' | 'earthy' = 'primary'): string[] {
  return DESIGN_SYSTEM.chartColors[style]
}

/**
 * Create gradient colors for monochromatic charts
 */
export function getGradientColors(gradient: 'blue' | 'purple' | 'green'): string[] {
  const key = `${gradient}Gradient` as keyof typeof DESIGN_SYSTEM.chartColors
  return DESIGN_SYSTEM.chartColors[key]
}
