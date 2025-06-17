import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Avatar,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PlaceholderImage from '../components/PlaceholderImage';

const MotionCard = motion(Card);

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [user, setUser] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    const userTrips = trips.filter(trip => trip.userEmail === JSON.parse(storedUser)?.email);
    setSavedTrips(userTrips);
  }, []);

  const handleShare = async (trip) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trip to ${trip.destination}`,
          text: `Check out my trip to ${trip.destination}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleDelete = (tripId) => {
    const allTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    const updatedTrips = allTrips.filter(trip => trip.tripId !== tripId);
    localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    setSavedTrips(updatedTrips.filter(trip => trip.userEmail === user?.email));
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Profile
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Please log in to view your profile
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Go to Home
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Profile Header */}
      <Box
        sx={{
          position: 'relative',
          mb: 6,
          borderRadius: 4,
          overflow: 'hidden',
          height: { xs: 200, md: 300 },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
            zIndex: 1,
          },
        }}
      >
        <Box
          component="img"
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
          alt="Profile Cover"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 4,
            zIndex: 2,
            color: 'white',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 3,
            }}
          >
            <Avatar
              src={user.picture}
              sx={{
                width: { xs: 100, md: 150 },
                height: { xs: 100, md: 150 },
                border: '4px solid white',
              }}
            />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {user.name}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trips Planned
              </Typography>
              <Typography variant="h3" color="primary">
                {savedTrips.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Days
              </Typography>
              <Typography variant="h3" color="primary">
                {savedTrips.reduce((total, trip) => total + trip.itinerary.length, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Destinations
              </Typography>
              <Typography variant="h3" color="primary">
                {new Set(savedTrips.map(trip => trip.destination)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Saved Trips Section */}
      <Typography variant="h4" gutterBottom>
        My Saved Trips
      </Typography>
      <Grid container spacing={3}>
        {savedTrips.map((trip) => (
          <Grid item xs={12} md={6} lg={4} key={trip.tripId}>
            <MotionCard
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {trip.placeDetails?.photoUrl ? (
                <CardMedia
                  component="img"
                  height="200"
                  image={trip.placeDetails.photoUrl}
                  alt={trip.destination}
                />
              ) : (
                <PlaceholderImage height={200} />
              )}
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {trip.destination}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {format(new Date(trip.startDate), 'MMM d, yyyy')} -{' '}
                  {format(new Date(trip.endDate), 'MMM d, yyyy')}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`${trip.itinerary.length} days`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {trip.budget && (
                    <Chip
                      label={trip.budget}
                      size="small"
                      color={
                        trip.budget === 'luxury'
                          ? 'error'
                          : trip.budget === 'mid-range'
                          ? 'primary'
                          : 'success'
                      }
                    />
                  )}
                </Box>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    localStorage.setItem('currentItinerary', JSON.stringify(trip));
                    navigate('/itinerary');
                  }}
                >
                  View Details
                </Button>
              </Box>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Profile; 