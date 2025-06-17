import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Header from './components/Header';
import Home from './pages/Home';
import Itinerary from './pages/Itinerary';
import SavedTrips from './pages/SavedTrips';
import Profile from './pages/Profile';

// Custom theme with modern color palette and typography
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35', // Sunset orange
      light: '#FF8B5E',
      dark: '#E54B1F',
    },
    secondary: {
      main: '#2A9D8F', // Ocean blue
      light: '#4BB3A7',
      dark: '#1A7A6F',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 600,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      letterSpacing: '0.00938em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '0.00938em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02857em',
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
          padding: '10px 24px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
          }}
        >
        <Header />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              py: { xs: 2, md: 4 },
              px: { xs: 2, md: 4 },
            }}
          >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/itinerary" element={<Itinerary />} />
              <Route path="/saved-trips" element={<SavedTrips />} />
              <Route path="/profile" element={<Profile />} />
        </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 