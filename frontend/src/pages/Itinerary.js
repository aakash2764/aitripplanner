import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Paper,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Rating,
  IconButton,
  useTheme,
  Divider,
  useMediaQuery,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import PlaceholderImage from '../components/PlaceholderImage';

// Create motion components
const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

const interests = [
  'History',
  'Nature',
  'Food',
  'Art',
  'Adventure',
  'Relaxation',
  'Nightlife',
  'Shopping',
];

const foodPreferences = [
  { value: 'veg', label: 'Veg 🌱' },
  { value: 'non-veg', label: 'Non-Veg 🍗' },
  { value: 'vegan', label: 'Vegan 🥗' },
];

const budgetOptions = [
  { value: 'budget-friendly', label: 'Budget-friendly' },
  { value: 'mid-range', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
];

const travelStyleOptions = [
  { value: 'fast-paced', label: 'Fast-paced' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'family-friendly', label: 'Family-friendly' },
];

const steps = ['Destination', 'Dates & Travelers', 'Preferences', 'Review'];

const getBudgetLevel = (budget) => {
  switch (budget) {
    case 'budget-friendly':
      return 'budget-friendly';
    case 'mid-range':
      return 'mid-range';
    case 'luxury':
      return 'luxury';
    default:
      return 'mid-range';
  }
};

const getPlaceholderDescription = (type, name) => {
  switch (type) {
    case 'hotel':
      return `No image available for ${name}`;
    case 'activity':
      return `No image available for ${name}`;
    default:
      return 'Image not available';
  }
};

const formatRating = (rating) => {
  if (!rating) return 'No ratings';
  return `${rating.toFixed(1)} ⭐ (${rating.toFixed(1)}/5)`;
};

const Itinerary = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: null,
    endDate: null,
    numTravelers: 1,
    interests: [],
    budget: 'mid-range',
    travelStyle: 'relaxed',
    foodPreference: 'not-specified',
    placesToVisit: [],
  });
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [destinationQuery, setDestinationQuery] = useState('');

  // Clear any existing itinerary when component mounts
  useEffect(() => {
    const savedItinerary = localStorage.getItem('currentItinerary');
    if (savedItinerary) {
      const parsedItinerary = JSON.parse(savedItinerary);
      setItinerary(parsedItinerary);
      // If this is a saved trip, populate the form data
      if (parsedItinerary.startDate) {
        setFormData({
          destination: parsedItinerary.destination,
          startDate: new Date(parsedItinerary.startDate),
          endDate: new Date(parsedItinerary.endDate),
          numTravelers: parsedItinerary.numTravelers || 1,
          interests: parsedItinerary.interests || [],
          budget: parsedItinerary.budget || 'mid-range',
          travelStyle: parsedItinerary.travelStyle || 'relaxed',
          foodPreference: parsedItinerary.foodPreference || 'not-specified',
          placesToVisit: parsedItinerary.placesToVisit || []
        });
      }
    } else {
      // Only clear if there's no saved itinerary
      localStorage.removeItem('currentItinerary');
      setItinerary(null);
    }
  }, []);

  const resetForm = () => {
    setActiveStep(0);
    setItinerary(null);
    setFormData({
      destination: '',
      startDate: null,
      endDate: null,
      numTravelers: 1,
      interests: [],
      budget: 'mid-range',
      travelStyle: 'relaxed',
      foodPreference: 'not-specified',
      placesToVisit: [],
    });
    localStorage.removeItem('currentItinerary');
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleDateChange = (field) => (date) => {
    setFormData({
      ...formData,
      [field]: date,
    });
  };

  const handleInterestsChange = (event) => {
    setFormData({
      ...formData,
      interests: event.target.value,
    });
  };

  const handlePlaceSearch = async (query) => {
    if (query.length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3001/api/places/search`, {
        params: { 
          query,
          location: formData.destination,
          type: 'place'
        }
      });
      setPlaceSuggestions(response.data.predictions || []);
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      setPlaceSuggestions([]);
    }
  };

  const handlePlaceSelect = (place) => {
    if (place && !formData.placesToVisit.includes(place.description)) {
      setFormData(prev => ({
        ...prev,
        placesToVisit: [...prev.placesToVisit, place.description]
      }));
    }
    setSearchQuery('');
    setPlaceSuggestions([]);
  };

  const handleDestinationSearch = async (query) => {
    if (query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3001/api/places/search`, {
        params: { 
          query,
          type: 'destination'
        }
      });
      setDestinationSuggestions(response.data.predictions || []);
    } catch (error) {
      console.error('Error fetching destination suggestions:', error);
      setDestinationSuggestions([]);
    }
  };

  const handleDestinationSelect = (place) => {
    if (place) {
      const destination = place.description.split(',')[0].trim();
      setFormData(prev => ({
        ...prev,
        destination: destination
      }));
    }
    setDestinationQuery('');
    setDestinationSuggestions([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.destination || !formData.startDate || !formData.endDate || !formData.numTravelers) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare the request data
      const requestData = {
        ...formData,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0],
        foodPreference: formData.foodPreference || 'not-specified',
        placesToVisit: formData.placesToVisit || [],
      };

      console.log('Sending request with data:', requestData);

      const response = await axios.post('http://localhost:3001/api/plan-trip', requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data) {
        // Store the itinerary in localStorage
        localStorage.setItem('currentItinerary', JSON.stringify(response.data));
        setItinerary(response.data);
      } else {
        throw new Error('No data received from the server');
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      // Show error message to user
      alert(error.response?.data?.error || error.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trip to ${formData.destination}`,
          text: `Check out my trip to ${formData.destination}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleSaveTrip = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      // Show login prompt or redirect to login
      navigate('/');
      return;
    }

    const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    const tripWithUser = {
      ...itinerary,
      userEmail: user.email,
      savedAt: new Date().toISOString()
    };
    savedTrips.push(tripWithUser);
    localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
    navigate('/saved-trips');
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <MotionBox
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Typography variant="h5" gutterBottom>
              Where do you want to go?
            </Typography>
            <Autocomplete
              freeSolo
              options={destinationSuggestions}
              getOptionLabel={(option) => 
                typeof option === 'string' ? option : option.description
              }
              inputValue={destinationQuery}
              onInputChange={(event, newValue) => {
                setDestinationQuery(newValue);
                handleDestinationSearch(newValue);
              }}
              onChange={(event, newValue) => {
                handleDestinationSelect(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search for a city, state, or country"
                  variant="outlined"
                  fullWidth
                  required
                  margin="normal"
                  placeholder="Type to search destinations..."
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">
                      {option.description.split(',')[0]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </MotionBox>
        );
      case 1:
        return (
          <MotionBox
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Typography variant="h5" gutterBottom>
              When are you traveling?
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={handleDateChange('startDate')}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required margin="normal" />
                    )}
                    minDate={new Date()}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={handleDateChange('endDate')}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required margin="normal" />
                    )}
                    minDate={formData.startDate || new Date()}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
            <TextField
              fullWidth
              type="number"
              label="Number of Travelers"
              value={formData.numTravelers}
              onChange={handleChange('numTravelers')}
              required
              margin="normal"
              inputProps={{ min: 1 }}
            />
          </MotionBox>
        );
      case 2:
        return (
          <MotionBox
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Typography variant="h5" gutterBottom>
              What are your preferences?
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
              👉 Food Preference:
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tell us what you wanna eat during your trip
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Food Preference</InputLabel>
              <Select
                value={formData.foodPreference}
                onChange={handleChange('foodPreference')}
                label="Food Preference"
              >
                {foodPreferences.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
              👉 Add Specific Places You Want to Cover:
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Type the name of a place and our search will suggest options (Google Places API) after just 2 letters
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ✅ Add as many spots as you want — we'll make sure they're included in your plan
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ✅ For example: If you add 2 places for a 5-day trip, those 2 will be guaranteed across the 5 days
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Autocomplete
                freeSolo
                options={placeSuggestions}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : option.description
                }
                inputValue={searchQuery}
                onInputChange={(event, newValue) => {
                  setSearchQuery(newValue);
                  handlePlaceSearch(newValue);
                }}
                onChange={(event, newValue) => {
                  handlePlaceSelect(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search for a place"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                  />
                )}
              />
              
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.placesToVisit.map((place, index) => (
                  <Chip
                    key={index}
                    label={place}
                    onDelete={() => {
                      setFormData(prev => ({
                        ...prev,
                        placesToVisit: prev.placesToVisit.filter((_, i) => i !== index)
                      }));
                    }}
                  />
                ))}
              </Box>
            </Box>

            <FormControl fullWidth margin="normal">
              <InputLabel>Interests</InputLabel>
              <Select
                multiple
                value={formData.interests}
                onChange={handleInterestsChange}
                input={<OutlinedInput label="Interests" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {interests.map((interest) => (
                  <MenuItem key={interest} value={interest}>
                    {interest}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Budget</InputLabel>
              <Select
                value={formData.budget}
                onChange={handleChange('budget')}
                label="Budget"
              >
                {budgetOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Travel Style</InputLabel>
              <Select
                value={formData.travelStyle}
                onChange={handleChange('travelStyle')}
                label="Travel Style"
              >
                {travelStyleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MotionBox>
        );
      case 3:
        return (
          <MotionBox
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Typography variant="h5" gutterBottom>
              Review Your Trip Details
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Destination
                  </Typography>
                  <Typography variant="h6">{formData.destination}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Dates
                  </Typography>
                  <Typography variant="body1">
                    {formData.startDate?.toLocaleDateString()} -{' '}
                    {formData.endDate?.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Travelers
                  </Typography>
                  <Typography variant="body1">{formData.numTravelers}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Food Preference
                  </Typography>
                  <Typography variant="body1">
                    {foodPreferences.find(opt => opt.value === formData.foodPreference)?.label || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Places to Visit
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {formData.placesToVisit.length > 0 ? (
                      formData.placesToVisit.map((place, index) => (
                        <Chip key={index} label={place} />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No specific places selected
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Interests
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.interests.map((interest) => (
                      <Chip key={interest} label={interest} />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Budget
                  </Typography>
                  <Typography variant="body1">
                    {budgetOptions.find((opt) => opt.value === formData.budget)?.label}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Travel Style
                  </Typography>
                  <Typography variant="body1">
                    {travelStyleOptions.find(
                      (opt) => opt.value === formData.travelStyle
                    )?.label}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </MotionBox>
        );
      default:
    return null;
  }
  };

  const renderNewPlanButton = () => (
    <Button
      variant="contained"
      onClick={resetForm}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        borderRadius: 8,
        px: 4,
        py: 1.5,
        backgroundColor: 'primary.main',
        '&:hover': {
          backgroundColor: 'primary.dark',
          transform: 'translateY(-2px)',
        },
      }}
    >
      Create New Plan
    </Button>
  );

  if (itinerary) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Your Trip to {itinerary.destination}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
            <IconButton onClick={handleShare}>
              <ShareIcon />
            </IconButton>
            <IconButton onClick={handleSaveTrip}>
              <BookmarkIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {format(new Date(itinerary.startDate), 'MMMM d, yyyy')} - {format(new Date(itinerary.endDate), 'MMMM d, yyyy')}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Hotel Recommendations */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            Recommended Hotels
          </Typography>
          <Grid container spacing={3}>
            {itinerary.hotels.map((hotel, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)'
                    }
                  }}>
                    {hotel.placeDetails?.photoUrl ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={hotel.placeDetails.photoUrl}
                        alt={hotel.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <PlaceholderImage 
                        height={200} 
                        description={getPlaceholderDescription('hotel', hotel.name)}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {hotel.name}
                      </Typography>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        {hotel.priceRange}
                      </Typography>
                    {hotel.placeDetails?.rating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating 
                          value={hotel.placeDetails.rating} 
                          precision={0.5} 
                          readOnly 
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({hotel.placeDetails.stats?.totalRatings || 0} reviews)
                        </Typography>
                      </Box>
                    )}
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {hotel.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
                        <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {hotel.location}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        href={hotel.placeDetails?.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 'bold'
                        }}
                      >
                        Book Now
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>

        {/* Daily Itinerary */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            Daily Itinerary
          </Typography>
          {itinerary.itinerary.map((day, dayIndex) => (
            <Box key={dayIndex} sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                pb: 1,
                mb: 2
              }}>
                Day {day.day} - {format(new Date(day.date), 'MMMM d, yyyy')}
              </Typography>
              <Grid container spacing={2}>
                {day.activities.map((activity, activityIndex) => (
                  <Grid item xs={12} key={activityIndex}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 3,
                        borderRadius: 2,
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.3s ease-in-out'
                        }
                      }}
                    >
                      {activity.placeDetails?.photoUrl && (
                        <Box
                          sx={{
                            width: { xs: '100%', sm: 300 },
                            height: { xs: 200, sm: 250 },
                            flexShrink: 0,
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: 2
                          }}
                        >
                          <img
                            src={activity.placeDetails.photoUrl}
                            alt={activity.location}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          gap: 1
                        }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: 'warning.main',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          >
                            {activity.timeOfDay}
                          </Typography>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: 'text.primary',
                              fontWeight: 700
                            }}
                          >
                            {activity.location}
                          </Typography>
                        </Box>
                        {activity.placeDetails?.rating && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Rating 
                              value={activity.placeDetails.rating} 
                              precision={0.5} 
                              readOnly 
                              size="small"
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              ({activity.placeDetails.stats?.totalRatings || 0} reviews)
                            </Typography>
                          </Box>
                        )}
                        <Typography 
                          variant="body1" 
                          paragraph
                          sx={{ 
                            fontWeight: 500,
                            lineHeight: 1.6
                          }}
                        >
                          {activity.description}
                        </Typography>
                        {activity.notes && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontStyle: 'italic',
                              mt: 1
                            }}
                          >
                            {activity.notes}
                          </Typography>
                        )}
                        {activity.placeDetails?.website && (
                          <Button
                            variant="outlined"
                            size="small"
                            href={activity.placeDetails.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              mt: 2,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Visit Website
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>

        {/* Travel Tips */}
        {itinerary.generalTips && itinerary.generalTips.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" gutterBottom>
              Travel Tips
            </Typography>
            <Grid container spacing={2}>
              {itinerary.generalTips.map((tip, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      height: '100%',
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography variant="body1">{tip}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {renderNewPlanButton()}
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <AnimatePresence mode="wait">
          {renderStepContent(activeStep)}
        </AnimatePresence>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: 8,
              px: 3,
            }}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
              sx={{
                borderRadius: 8,
                px: 4,
                py: 1.5,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {loading ? 'Generating...' : 'Generate Itinerary'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              sx={{
                borderRadius: 8,
                px: 4,
                py: 1.5,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Itinerary; 