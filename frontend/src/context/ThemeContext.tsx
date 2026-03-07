'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Force light mode and clear stale dark preference.
        setIsDark(false);
        localStorage.setItem('theme', 'light');
        document.documentElement.classList.remove('dark');
    }, []);

    const toggleTheme = () => {
        setIsDark(false);
        localStorage.setItem('theme', 'light');
        document.documentElement.classList.remove('dark');
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
