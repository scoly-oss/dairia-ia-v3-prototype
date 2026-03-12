import React, { createContext, useContext, useState } from 'react';

interface LayoutContextType {
    mobileOpen: boolean;
    toggleDrawer: () => void;
    closeDrawer: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleDrawer = () => {
        setMobileOpen(!mobileOpen);
    };

    const closeDrawer = () => {
        setMobileOpen(false);
    };

    return (
        <LayoutContext.Provider value={{ mobileOpen, toggleDrawer, closeDrawer }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
