import { createTheme } from "@mui/material/styles";

// Create a modern, vibrant theme with beautiful gradients and animations
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6366f1", // Vibrant indigo
      light: "#8b5cf6", // Purple accent
      dark: "#4338ca",
    },
    secondary: {
      main: "#06b6d4", // Vibrant cyan
      light: "#22d3ee",
      dark: "#0891b2",
    },
    tertiary: {
      main: "#f59e0b", // Vibrant amber
      light: "#fbbf24",
      dark: "#d97706",
    },
    background: {
      default: "#fafbfc", // Ultra-light background
      paper: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    info: {
      main: "#06b6d4",
      light: "#22d3ee",
      dark: "#0891b2",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 800,
      letterSpacing: "-0.025em",
      lineHeight: 1.2,
      "@media (min-width:600px)": {
        fontSize: "3rem",
      },
      "@media (min-width:900px)": {
        fontSize: "3.5rem",
      },
      "@media (min-width:1200px)": {
        fontSize: "4rem",
      },
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.3,
      "@media (min-width:600px)": {
        fontSize: "2.25rem",
      },
      "@media (min-width:900px)": {
        fontSize: "2.5rem",
      },
      "@media (min-width:1200px)": {
        fontSize: "3rem",
      },
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.3,
      "@media (min-width:600px)": {
        fontSize: "2rem",
      },
      "@media (min-width:900px)": {
        fontSize: "2.25rem",
      },
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.025em",
      lineHeight: 1.4,
      "@media (min-width:600px)": {
        fontSize: "1.75rem",
      },
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "-0.025em",
      lineHeight: 1.4,
      "@media (min-width:600px)": {
        fontSize: "1.5rem",
      },
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      letterSpacing: "-0.025em",
      lineHeight: 1.4,
      "@media (min-width:600px)": {
        fontSize: "1.25rem",
      },
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.7,
      fontWeight: 400,
      "@media (min-width:900px)": {
        fontSize: "1.125rem",
      },
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      fontWeight: 400,
      "@media (min-width:900px)": {
        fontSize: "1rem",
      },
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.025em",
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 16,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            outline: "none",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 16,
          fontWeight: 600,
          fontSize: "0.95rem",
          padding: "12px 24px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        sizeLarge: {
          borderRadius: 20,
          fontSize: "1.1rem",
          padding: "16px 32px",
        },
        sizeSmall: {
          borderRadius: 12,
          fontSize: "0.875rem",
          padding: "8px 16px",
        },
        contained: {
          background:
            "linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main) 100%)",
          color: "white",
          "&:hover": {
            background:
              "linear-gradient(135deg, var(--mui-palette-secondary-main) 0%, var(--mui-palette-primary-main) 100%)",
          },
        },
        outlined: {
          borderWidth: 2,
          borderColor: "var(--mui-palette-primary-main)",
          color: "var(--mui-palette-primary-main)",
          "&:hover": {
            borderWidth: 2,
            backgroundColor: "rgba(99, 102, 241, 0.04)",
            color: "var(--mui-palette-primary-dark)",
          },
        },
        text: {
          color: "var(--mui-palette-primary-main)",
          "&:hover": {
            backgroundColor: "rgba(99, 102, 241, 0.04)",
            color: "var(--mui-palette-primary-dark)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)",
          "&:hover": {
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          color: "var(--mui-palette-text-primary)",
          borderRadius: "0",
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          "@media (min-width:1200px)": {
            maxWidth: "1400px",
          },
          "@media (min-width:1536px)": {
            maxWidth: "1600px",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          letterSpacing: "0.025em",
        },
        filled: {
          background:
            "linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main) 100%)",
          color: "white",
        },
        outlined: {
          borderWidth: 2,
          "&.MuiChip-colorPrimary": {
            borderColor: "var(--mui-palette-primary-main)",
            color: "var(--mui-palette-primary-main)",
          },
          "&.MuiChip-colorSecondary": {
            borderColor: "var(--mui-palette-secondary-main)",
            color: "var(--mui-palette-secondary-main)",
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "&::-webkit-scrollbar": {
          width: "12px",
          height: "12px",
        },
        "&::-webkit-scrollbar-track": {
          background: "rgba(0,0,0,0.05)",
        },
        "&::-webkit-scrollbar-thumb": {
          background:
            "linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main) 100%)",
          borderRadius: "6px",
          border: "3px solid transparent",
          backgroundClip: "content-box",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background:
            "linear-gradient(135deg, var(--mui-palette-secondary-main) 0%, var(--mui-palette-primary-main) 100%)",
          borderRadius: "6px",
          border: "3px solid transparent",
          backgroundClip: "content-box",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          margin: "4px 0",
          "&:hover": {
            backgroundColor: "rgba(99, 102, 241, 0.04)",
          },
          "&.Mui-selected": {
            background:
              "linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main) 100%)",
            color: "white",
            "&:hover": {
              background:
                "linear-gradient(135deg, var(--mui-palette-secondary-main) 0%, var(--mui-palette-primary-main) 100%)",
            },
            "& .MuiListItemIcon-root": {
              color: "white",
            },
            "& .MuiListItemText-primary": {
              fontWeight: 600,
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: "0.95rem",
          fontWeight: 500,
          letterSpacing: "0.025em",
          textTransform: "none",
          borderRadius: "16px 16px 0 0",
          "&:focus": {
            outline: "none",
          },
          "&:focus-visible": {
            outline: "none",
          },
          "&.Mui-selected": {
            fontWeight: 600,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          color: "white",
          fontSize: "0.875rem",
          padding: "8px 12px",
          borderRadius: 12,
          backdropFilter: "blur(8px)",
        },
        arrow: {
          color: "rgba(15, 23, 42, 0.95)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.15)",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main) 100%)",
          "& .MuiTableCell-head": {
            color: "white",
            fontWeight: 600,
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main) 100%)",
          color: "white",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(99, 102, 241, 0.6)",
            borderWidth: 1,
          },
          "&:focus, &:focus-visible": {
            outline: "none",
          },
        },
      },
    },
  },
});

// Add custom colors to palette type
declare module "@mui/material/styles" {
  interface Palette {
    tertiary: Palette["primary"];
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
  }
}

export default theme;
