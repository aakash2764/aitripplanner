import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlaceholderImage from '../components/PlaceholderImage';

const SavedTrips = () => {
  const navigate = useNavigate();
  const [savedTrips, setSavedTrips] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Get saved trips from localStorage
    const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    // Filter trips for current user
    const userTrips = trips.filter(trip => trip.userEmail === JSON.parse(storedUser)?.email);
    setSavedTrips(userTrips);
  }, []);

  const handleViewTrip = (trip) => {
    // Clear any existing current itinerary first
    localStorage.removeItem('currentItinerary');
    // Then set the new one
    localStorage.setItem('currentItinerary', JSON.stringify(trip));
    navigate('/itinerary');
  };

  const handleDeleteTrip = (tripId) => {
    const allTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    const updatedTrips = allTrips.filter((trip) => trip.tripId !== tripId);
    localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    setSavedTrips(updatedTrips.filter(trip => trip.userEmail === user?.email));
    
    // If the deleted trip was the current itinerary, clear it
    const currentItinerary = JSON.parse(localStorage.getItem('currentItinerary') || 'null');
    if (currentItinerary && currentItinerary.tripId === tripId) {
      localStorage.removeItem('currentItinerary');
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          My Saved Trips
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
            Please log in to view your saved trips
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

  if (savedTrips.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          My Saved Trips
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
            No saved trips yet
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Plan a New Trip
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        My Saved Trips
      </Typography>
      <Grid container spacing={3}>
        {savedTrips.map((trip) => (
          <Grid item xs={12} md={6} lg={4} key={trip.tripId}>
            <Card>
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
              <CardActions>
                <Button
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewTrip(trip)}
                >
                  View Details
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => handleDeleteTrip(trip.tripId)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SavedTrips; 