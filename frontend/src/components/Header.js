import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExploreIcon from '@mui/icons-material/Explore';
import { motion } from 'framer-motion';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';

const MotionAppBar = motion(AppBar);

const GOOGLE_AUTH_CLIENT_ID = '1036244579284-7q8gh284chl33sml2jot0327qea1pe1c.apps.googleusercontent.com';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    setUser(null);
    googleLogout();
    handleCloseUserMenu();
    navigate('/');
  };

  const handleLoginSuccess = (credentialResponse) => {
    // Decode JWT to get user info
    const base64Url = credentialResponse.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    const profile = JSON.parse(jsonPayload);
    setUser({
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
    });
    handleCloseUserMenu();
  };

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Saved Trips', path: '/saved-trips' },
  ];

  return (
    <GoogleOAuthProvider clientId={GOOGLE_AUTH_CLIENT_ID}>
      <MotionAppBar
        position="sticky"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8B53 100%)',
          boxShadow: '0 4px 20px rgba(255, 107, 53, 0.2)',
        }}
      >
        <Container maxWidth="xl">
        <Toolbar disableGutters>
            {/* Logo for desktop */}
          <Typography
            variant="h6"
              noWrap
            component={RouterLink}
            to="/"
            sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                color: 'white',
              textDecoration: 'none',
                letterSpacing: '.1rem',
              alignItems: 'center',
                gap: 1,
            }}
          >
              <ExploreIcon sx={{ fontSize: 28 }} />
              AI TRIP PLANNER
          </Typography>

            {/* Mobile menu */}
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
              color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: 'block', md: 'none' },
                }}
              >
                {pages.map((page) => (
                  <MenuItem
                    key={page.name}
                    onClick={() => {
                      handleCloseNavMenu();
                      navigate(page.path);
                    }}
                  >
                    <Typography textAlign="center">{page.name}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            {/* Logo for mobile */}
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontWeight: 700,
                color: 'white',
                textDecoration: 'none',
                letterSpacing: '.1rem',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <ExploreIcon sx={{ fontSize: 24 }} />
              AI TRIP PLANNER
            </Typography>

            {/* Desktop menu */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
            <Button
                  key={page.name}
              component={RouterLink}
                  to={page.path}
                  onClick={handleCloseNavMenu}
                  sx={{
                    my: 2,
                    color: 'white',
                    display: 'block',
                    mx: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
            >
                  {page.name}
            </Button>
              ))}
            </Box>

            {/* User menu */}
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Profile">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar
                    alt={user?.name || 'User'}
                    src={user?.picture || undefined}
                    sx={{
                      bgcolor: 'white',
                      color: '#FF6B35',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        transition: 'transform 0.2s',
                      },
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {!user && (
                  <Box sx={{ px: 2, py: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <GoogleLogin
                      onSuccess={handleLoginSuccess}
                      onError={() => alert('Login Failed')}
                      width="100%"
                      shape="pill"
                      text="signin_with"
                    />
                  </Box>
                )}
                {user && (
                  <>
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={user.picture} sx={{ width: 28, height: 28 }} />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                    <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                      <Typography textAlign="center">Profile</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>
                  </>
                )}
              </Menu>
          </Box>
        </Toolbar>
      </Container>
      </MotionAppBar>
    </GoogleOAuthProvider>
  );
};

export default Header; 