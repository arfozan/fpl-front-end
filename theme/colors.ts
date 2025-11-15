import { useColorScheme } from "react-native";

const lightTheme = {
  background: "#ffffff",
  card: "#f4f4f4",
  text: "#000000",
  textSecondary: "#555555",

  inputBackground: "#ffffff",
  inputBorder: "#cccccc",
  placeholder: "#777777",

  buttonBackground: "#1e90ff",
  buttonText: "#ffffff",
};

const darkTheme = {
  background: "#000000",
  card: "#1a1a1a",
  text: "#ffffff",
  textSecondary: "#aaaaaa",

  inputBackground: "#1e1e1e",
  inputBorder: "#444444",
  placeholder: "#999999",

  buttonBackground: "#3b82f6",
  buttonText: "#ffffff",
};

export const useThemeColors = () => {
  const scheme = useColorScheme(); // 'light' | 'dark'
  return scheme === "dark" ? darkTheme : lightTheme;
};
