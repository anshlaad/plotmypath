import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Initial State: localStorage check karo, agar nahi hai toh system setting dekho
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Agar user ne phone/browser mein dark mode rakha hai
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Data-theme update karo
    root.setAttribute('data-theme', theme);
    
    // LocalStorage mein save karo
    localStorage.setItem('theme', theme);
    
    // Tailwind ke liye 'dark' class handle karo (agar Tailwind use kr rahe ho future mein)
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);