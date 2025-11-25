import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ThemeState {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
}

const initialState: ThemeState = {
  colors: {
    primary: "#2563eb", // Blue
    secondary: "#64748b", // Slate
    accent: "#f59e0b", // Amber
    background: "#ffffff",
    text: "#1e293b",
    border: "#e2e8f0",
  },
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.colors.primary = action.payload;
    },
    setSecondaryColor: (state, action: PayloadAction<string>) => {
      state.colors.secondary = action.payload;
    },
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.colors.accent = action.payload;
    },
    setBackgroundColor: (state, action: PayloadAction<string>) => {
      state.colors.background = action.payload;
    },
    setTextColor: (state, action: PayloadAction<string>) => {
      state.colors.text = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemeState["colors"]>) => {
      state.colors = action.payload;
    },
  },
});

export const {
  setPrimaryColor,
  setSecondaryColor,
  setAccentColor,
  setBackgroundColor,
  setTextColor,
  setTheme,
} = themeSlice.actions;

export default themeSlice.reducer;
