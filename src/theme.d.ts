import '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Theme {
        custom: {
            gradients: {
                primary: string;
                primaryHover: string;
                primarySubtle: string;
                primarySubtleHover: string;
                glass: string;
            };
            shadows: {
                sm: string;
                md: string;
                lg: string;
                primary: string;
            };
            glass: {
                background: string;
                backdropFilter: string;
                border: string;
            };
            border: string;
            surface: string;
            surfaceHighlight: string;
        };
    }
    // Allow configuration using `createTheme`
    interface ThemeOptions {
        custom?: {
            gradients?: {
                primary?: string;
                primaryHover?: string;
                primarySubtle?: string;
                primarySubtleHover?: string;
                glass?: string;
            };
            shadows?: {
                sm?: string;
                md?: string;
                lg?: string;
                primary?: string;
            };
            glass?: {
                background?: string;
                backdropFilter?: string;
                border?: string;
            };
            border?: string;
            surface?: string;
            surfaceHighlight?: string;
        };
    }
}
