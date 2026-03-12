import React, { createContext, useContext, useMemo } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mode: ThemeMode = 'light';
    const toggleTheme = () => {}; // No-op, locked to light mode

    const value = useMemo(() => ({ mode, toggleTheme }), []);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeMode must be used within a ThemeContextProvider');
    }
    return context;
};
