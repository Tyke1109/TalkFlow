import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const lightTheme = {
  colors: {
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    border: '#dddddd',
    primary: '#8A2BE2',
    success: '#4CAF50',
    error: '#ff3b30',
    buttonText: '#ffffff'
  }
};

const darkTheme = {
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    border: '#2c2c2c',
    primary: '#8A2BE2',
    success: '#4CAF50',
    error: '#ff3b30',
    buttonText: '#ffffff'
  }
};

export const ThemeContext = createContext(lightTheme);

export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState(colorScheme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 