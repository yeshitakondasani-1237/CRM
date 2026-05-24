import { createTheme } from '@mui/material/styles';

export const getCustomTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#0f172a' : '#f8fafc', // Slate 900 vs Slate 50
        contrastText: mode === 'light' ? '#ffffff' : '#0f172a',
      },
      secondary: {
        main: '#2563eb', // Cobalt Blue
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#090d16', // Light gray vs deep dark navy
        paper: mode === 'light' ? '#ffffff' : '#0f172a',  // White vs Slate 900
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f1f5f9',
        secondary: mode === 'light' ? '#475569' : '#94a3b8',
      },
      divider: mode === 'light' ? '#e2e8f0' : '#1e293b',
      success: {
        main: '#10b981', // Emerald
      },
      warning: {
        main: '#f59e0b', // Amber
      },
      error: {
        main: '#ef4444', // Rose
      },
      info: {
        main: '#06b6d4', // Cyan
      },
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.25rem',
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        fontSize: '1.75rem',
        letterSpacing: '-0.02em',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.5rem',
        letterSpacing: '-0.015em',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '0.875rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              transform: 'translateY(-1px)',
            },
          },
          containedSecondary: {
            '&:hover': {
              backgroundColor: '#1d4ed8',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)' 
              : '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
            border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#1e293b'}`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${mode === 'light' ? '#f1f5f9' : '#1e293b'}`,
            padding: '12px 16px',
          },
          head: {
            fontWeight: 600,
            backgroundColor: mode === 'light' ? '#f8fafc' : '#0b0f19',
            color: mode === 'light' ? '#475569' : '#94a3b8',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#1e293b'}`,
            boxShadow: 'none',
          },
        },
      },
    },
  });
};
