import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Explore as ExploreIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const featuredTrips = [
  {
    id: 'paris-adventure',
    title: 'Paris Adventure',
    location: 'Paris, France',
    duration: '5 days',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tokyo-explorer',
    title: 'Tokyo Explorer',
    location: 'Tokyo, Japan',
    duration: '7 days',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bali-paradise',
    title: 'Bali Paradise',
    location: 'Bali, Indonesia',
    duration: '6 days',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);

  const handleFeaturedTripClick = (trip) => {
    setSelectedTrip(trip);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow);
    setOpenDialog(true);
  };

  const handleConfirmTrip = async () => {
    if (!selectedTrip) return;
    
    setLoading(true);
    try {
      const formattedDate = startDate.toISOString().split('T')[0];
      const response = await axios.get(`http://localhost:3001/api/predefined-trips/${selectedTrip.id}`, {
        params: {
          startDate: formattedDate
        }
      });
      if (response.data) {
        localStorage.setItem('currentItinerary', JSON.stringify(response.data));
        navigate('/itinerary');
      }
    } catch (error) {
      console.error('Error fetching predefined trip:', error);
      alert(error.response?.data?.error || 'Failed to load trip details. Please try again.');
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTrip(null);
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '80vh', md: '90vh' },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
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
          alt="Travel"
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 700,
                mb: 2,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              Plan Your Dream Trip
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                maxWidth: '800px',
                mx: 'auto',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              Let AI help you create the perfect itinerary for your next adventure
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<ExploreIcon />}
              onClick={() => {
                localStorage.removeItem('currentItinerary');
                navigate('/itinerary');
              }}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: 8,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Start Planning
            </Button>
          </MotionBox>
        </Container>
      </Box>

      {/* Featured Trips Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            mb: 6,
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          Featured Trips
        </Typography>
        <Grid container spacing={4}>
          {featuredTrips.map((trip, index) => (
            <Grid item xs={12} sm={6} md={4} key={trip.id}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleFeaturedTripClick(trip)}
                  sx={{ height: '100%' }}
                  disabled={loading}
                >
                  <CardMedia
                    component="img"
                    height="240"
                    image={trip.image}
                    alt={trip.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      gutterBottom
                      variant="h5"
                      component="h2"
                      sx={{ fontWeight: 600 }}
                    >
                      {trip.title}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        color: 'text.secondary',
                      }}
                    >
                      <LocationIcon fontSize="small" />
                      <Typography variant="body2">{trip.location}</Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'text.secondary',
                      }}
                    >
                      <TimeIcon fontSize="small" />
                      <Typography variant="body2">{trip.duration}</Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Date Selection Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Select Start Date</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newDate) => setStartDate(newDate)}
              minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
              sx={{ mt: 2, width: '100%' }}
            />
          </LocalizationProvider>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {selectedTrip && `This ${selectedTrip.title} is a ${selectedTrip.duration}-day trip.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleConfirmTrip} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Confirm Trip'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Call to Action Section */}
      <Box
        sx={{
          py: 8,
          backgroundColor: 'primary.main',
          color: 'white',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              mb: 3,
              fontWeight: 700,
            }}
          >
            Ready to Start Your Adventure?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              mb: 4,
              opacity: 0.9,
            }}
          >
            Let our AI create a personalized itinerary just for you
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                localStorage.removeItem('currentItinerary');
                navigate('/itinerary');
              }}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: 8,
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Plan Your Trip Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 