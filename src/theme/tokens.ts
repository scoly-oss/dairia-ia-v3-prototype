import { PaletteMode } from '@mui/material';

export const tokens = {
    colors: {
        primary: {
            main: '#e8842c', // Orange Dairia
            light: '#F5A623',
            dark: '#C06A1E',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#1e2d3d', // Navy (ancien primary)
            light: '#3E5C8A',
            dark: '#12213A',
        },
        light: {
            background: {
                default: '#f8f8f6', // Off-white chaud
                paper: '#ffffff',
                surface: 'rgba(255, 255, 255, 0.9)',
                surfaceHighlight: 'rgba(232, 132, 44, 0.05)', // Teinte orange subtile
            },
            text: {
                primary: '#1e2d3d', // Navy
                secondary: '#5a6c7d',
            },
            border: 'rgba(0, 0, 0, 0.08)',
            divider: 'rgba(0, 0, 0, 0.06)',
        },
    },
    gradients: {
        primary: 'linear-gradient(135deg, #e8842c 0%, #F5A623 100%)',
        primaryHover: 'linear-gradient(135deg, #F5A623 0%, #e8842c 100%)',
        primarySubtle: 'linear-gradient(to right, rgba(232, 132, 44, 0.1), rgba(245, 166, 35, 0.05))',
        primarySubtleHover: 'linear-gradient(to right, rgba(232, 132, 44, 0.15), rgba(245, 166, 35, 0.1))',
        glass: 'none',
    },
    shadows: {
        light: {
            sm: '0 1px 3px rgba(0, 0, 0, 0.04)',
            md: '0 4px 12px rgba(0, 0, 0, 0.06)',
            lg: '0 10px 24px rgba(0, 0, 0, 0.08)',
            primary: '0 4px 14px rgba(232, 132, 44, 0.25)',
        },
    },
    glass: {
        light: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'none',
            border: '1px solid rgba(0, 0, 0, 0.08)',
        },
    },
};

export const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode: 'light' as PaletteMode,
        primary: tokens.colors.primary,
        secondary: tokens.colors.secondary,
        background: {
            default: tokens.colors.light.background.default,
            paper: tokens.colors.light.background.paper,
        },
        text: tokens.colors.light.text,
        divider: tokens.colors.light.divider,
    },
    custom: {
        gradients: tokens.gradients,
        shadows: tokens.shadows.light,
        glass: tokens.glass.light,
        border: tokens.colors.light.border,
        surface: tokens.colors.light.background.surface,
        surfaceHighlight: tokens.colors.light.background.surfaceHighlight,
    },
});
