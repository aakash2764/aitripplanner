const Joi = require('joi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const express = require('express');

const router = express.Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Input validation schema
const tripPlanSchema = Joi.object({
  destination: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  numTravelers: Joi.number().integer().min(1).required(),
  interests: Joi.array().items(Joi.string()).min(1).required(),
  budget: Joi.string().valid('budget-friendly', 'mid-range', 'luxury').optional(),
  travelStyle: Joi.string().valid('fast-paced', 'relaxed', 'family-friendly').optional(),
  foodPreference: Joi.string().valid('veg', 'non-veg', 'vegan', 'not-specified').optional(),
  placesToVisit: Joi.array().items(Joi.string()).optional()
});

// Get place details from Google Places API
const getPlaceDetails = async (placeName, location) => {
  try {
    // Search for the place
    const searchResponse = await axios.get(`${GOOGLE_PLACES_BASE_URL}/textsearch/json`, {
      params: {
        query: `${placeName} ${location}`,
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      const place = searchResponse.data.results[0];
      
      // Get detailed information about the place
      const detailsResponse = await axios.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, {
        params: {
          place_id: place.place_id,
          fields: 'name,formatted_address,photos,website,rating,price_level,user_ratings_total,url,opening_hours,reviews',
          key: GOOGLE_PLACES_API_KEY
        }
      });

      const placeDetails = detailsResponse.data.result;
      
      // Get photo URL if available
      let photoUrl = null;
      if (placeDetails.photos && placeDetails.photos.length > 0) {
        photoUrl = `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=800&photoreference=${placeDetails.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
      }

      // Map price level to our format
      const priceLevel = placeDetails.price_level ? 
        placeDetails.price_level === 1 ? 'budget-friendly' :
        placeDetails.price_level === 2 ? 'mid-range' : 'luxury'
        : null;

      // Get reviews if available
      const reviews = placeDetails.reviews ? placeDetails.reviews.slice(0, 3).map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time
      })) : [];

      return {
        name: placeDetails.name,
        address: placeDetails.formatted_address,
        photoUrl,
        website: placeDetails.website || placeDetails.url,
        rating: placeDetails.rating || 0,
        priceLevel,
        isOpen: placeDetails.opening_hours?.isOpen || null,
        stats: {
          totalRatings: placeDetails.user_ratings_total || 0
        },
        reviews
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

// Generate prompt for Gemini API
const generatePrompt = (tripDetails) => {
  const budgetLevel = tripDetails.budget || 'mid-range';
  return `Generate a detailed, day-by-day travel itinerary for a trip to ${tripDetails.destination} 
  from ${tripDetails.startDate} to ${tripDetails.endDate} for ${tripDetails.numTravelers} people. 
  The travelers are interested in ${tripDetails.interests.join(', ')}. 
  Their budget is ${budgetLevel}. 
  ${tripDetails.travelStyle ? `They prefer a ${tripDetails.travelStyle} travel style.` : ''}
  ${tripDetails.foodPreference ? `They prefer ${tripDetails.foodPreference} food.` : ''}
  ${tripDetails.placesToVisit && tripDetails.placesToVisit.length > 0 ? 
    `They specifically want to visit these places: ${tripDetails.placesToVisit.join(', ')}.` : ''}

  For each day, include morning, lunch, afternoon, and evening activities, including specific locations and brief descriptions.
  Also, provide a few general travel tips for ${tripDetails.destination}.
  
  IMPORTANT: Suggest EXACTLY THREE hotels in the ${budgetLevel} price range. Each hotel MUST be ${budgetLevel} level.
  For each hotel, include:
  - Name
  - Price range (must be ${budgetLevel})
  - Brief description
  - Location
  - Website URL if available

  Format the response as a JSON object with the following structure:
  {
    "tripId": "unique-id",
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "itinerary": [
      {
        "date": "YYYY-MM-DD",
        "day": number,
        "activities": [
          {
            "timeOfDay": "Morning|Lunch|Afternoon|Evening",
            "description": "string",
            "location": "string",
            "notes": "string"
          }
        ]
      }
    ],
    "generalTips": ["string"],
    "hotels": [
      {
        "name": "string",
        "priceRange": "${budgetLevel}",
        "description": "string",
        "location": "string",
        "website": "string (optional)"
      }
    ]
  }`;
};

// Add validation for hotels
const validateHotels = (hotels, budgetLevel) => {
  if (!hotels || !Array.isArray(hotels) || hotels.length !== 3) {
    throw new Error(`Expected exactly 3 hotels for ${budgetLevel} budget level`);
  }

  hotels.forEach((hotel, index) => {
    if (hotel.priceRange !== budgetLevel) {
      throw new Error(`Hotel ${index + 1} price range (${hotel.priceRange}) does not match requested budget level (${budgetLevel})`);
    }
  });

  return hotels;
};

// Route handler
const planTrip = async (req, res) => {
  try {
    // Validate input
    const { error, value } = tripPlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Invalid input', details: error.details[0].message });
    }

    // Generate prompt
    const prompt = generatePrompt(value);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    try {
      const cleanText = text.replace(/```json|```/g, '').trim();
      const itinerary = JSON.parse(cleanText);

      // Validate hotels
      itinerary.hotels = validateHotels(itinerary.hotels, value.budget);

      // Get place details and images for each activity
      for (const day of itinerary.itinerary) {
        for (const activity of day.activities) {
          if (activity.location) {
            try {
              const placeDetails = await getPlaceDetails(activity.location, itinerary.destination);
              if (placeDetails) {
                activity.placeDetails = placeDetails;
              }
            } catch (placeError) {
              console.error(`Error fetching place details for ${activity.location}:`, placeError);
              // Continue with other activities even if one fails
            }
          }
        }
      }

      // Get hotel details and images
      for (const hotel of itinerary.hotels) {
        try {
          const hotelDetails = await getPlaceDetails(hotel.name, itinerary.destination);
          if (hotelDetails) {
            hotel.placeDetails = hotelDetails;
          }
        } catch (hotelError) {
          console.error(`Error fetching hotel details for ${hotel.name}:`, hotelError);
          // Continue with other hotels even if one fails
        }
      }

      // Fetch additional details for places and hotels
      const enhancedItinerary = await Promise.all(
        itinerary.itinerary.map(async (day) => {
          const enhancedActivities = await Promise.all(
            day.activities.map(async (activity) => {
              if (activity.location) {
                const placeDetails = await getPlaceDetails(activity.location, itinerary.destination);
                return { ...activity, placeDetails };
              }
              return activity;
            })
          );
          return { ...day, activities: enhancedActivities };
        })
      );

      // Fetch hotel details
      const enhancedHotels = await Promise.all(
        itinerary.hotels.map(async (hotel) => {
          const placeDetails = await getPlaceDetails(hotel.name, itinerary.destination);
          return { ...hotel, placeDetails };
        })
      );

      res.json({
        ...itinerary,
        itinerary: enhancedItinerary,
        hotels: enhancedHotels
      });
    } catch (parseError) {
      console.error('Error parsing Gemini API response:', parseError);
      console.error('Raw response:', text);
      res.status(500).json({ 
        error: 'Error processing AI response',
        details: parseError.message,
        rawResponse: text
      });
    }
  } catch (error) {
    console.error('Error in planTrip:', error);
    res.status(500).json({ 
      error: 'Failed to generate itinerary',
      details: error.message
    });
  }
};

// Add place search route
router.get('/places/search', async (req, res) => {
  try {
    const { query, location, type } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters long' });
    }

    // Different parameters based on whether it's a destination search or specific place search
    const params = {
      input: query,
      key: GOOGLE_PLACES_API_KEY
    };

    if (type === 'destination') {
      // For destination search, use geocode type
      params.types = 'geocode';
    } else {
      // For specific places search, include establishments
      params.types = 'establishment';
      if (location) {
        params.location = location;
        params.radius = '50000'; // 50km radius
      }
    }

    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/autocomplete/json`, { params });

    // Filter results for destination search to only include cities, countries, and states
    if (type === 'destination') {
      const filteredPredictions = response.data.predictions.filter(prediction => {
        const types = prediction.types || [];
        return types.some(type => 
          type === 'locality' || // cities
          type === 'country' || // countries
          type === 'administrative_area_level_1' // states/provinces
        );
      });
      response.data.predictions = filteredPredictions;
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error searching places:', error);
    res.status(500).json({ error: 'Failed to search places' });
  }
});

// Predefined trips data
const predefinedTrips = {
  'paris-adventure': {
    tripId: 'paris-adventure',
    destination: 'Paris, France',
    duration: 5, // Fixed 5-day duration
    numTravelers: 2,
    interests: ['History', 'Art', 'Food', 'Culture'],
    budget: 'mid-range',
    travelStyle: 'relaxed',
    foodPreference: 'not-specified',
    itinerary: [
      {
        day: 1,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Flight to Paris',
            description: 'Departure flight to Paris Charles de Gaulle Airport (CDG)',
            notes: 'Arrive at the airport 3 hours before departure'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Arrival in Paris',
            description: 'Arrive at Paris Charles de Gaulle Airport (CDG)',
            notes: 'Take the RER B train or taxi to your hotel'
          },
          {
            timeOfDay: 'Evening',
            location: 'Hotel Check-in',
            description: 'Check in to your hotel and rest after the flight',
            notes: 'Consider having dinner at a nearby restaurant'
          }
        ]
      },
      {
        day: 2,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Eiffel Tower',
            description: 'Start your Paris adventure with a visit to the iconic Eiffel Tower. Take in the breathtaking views of the city from the top.',
            notes: 'Book tickets in advance to avoid long queues'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Le Marais',
            description: 'Explore the historic Le Marais district and enjoy lunch at a traditional French bistro.',
            notes: 'Try the local specialties like croque-monsieur or quiche'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Louvre Museum',
            description: 'Visit the world-famous Louvre Museum to see masterpieces like the Mona Lisa and Venus de Milo.',
            notes: 'Free entry on first Sunday of each month'
          },
          {
            timeOfDay: 'Evening',
            location: 'Seine River Cruise',
            description: 'Take a romantic evening cruise along the Seine River, admiring the illuminated monuments.',
            notes: 'Best views during sunset'
          }
        ]
      },
      {
        day: 3,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Notre-Dame Cathedral',
            description: 'Visit the magnificent Notre-Dame Cathedral and explore its stunning architecture.',
            notes: 'Currently under restoration, but still worth visiting'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Latin Quarter',
            description: 'Enjoy lunch in the vibrant Latin Quarter, known for its student life and charming cafes.',
            notes: 'Try the local bistros and patisseries'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Sainte-Chapelle',
            description: 'Admire the stunning stained glass windows of Sainte-Chapelle.',
            notes: 'Combined ticket available with Conciergerie'
          },
          {
            timeOfDay: 'Evening',
            location: 'Montmartre',
            description: 'Explore the artistic neighborhood of Montmartre and enjoy dinner with a view of the city.',
            notes: 'Visit Sacré-Cœur for sunset views'
          }
        ]
      },
      {
        day: 4,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Palace of Versailles',
            description: 'Take a day trip to the magnificent Palace of Versailles.',
            notes: 'Book tickets in advance and arrive early to avoid crowds'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Versailles Gardens',
            description: 'Enjoy a picnic lunch in the beautiful gardens of Versailles.',
            notes: 'Bring your own food or purchase from local vendors'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Grand Trianon',
            description: 'Visit the Grand Trianon and Marie Antoinette\'s Estate.',
            notes: 'Included in the Palace ticket'
          },
          {
            timeOfDay: 'Evening',
            location: 'Return to Paris',
            description: 'Return to Paris and enjoy dinner in a local restaurant.',
            notes: 'Consider dining in the Saint-Germain-des-Prés area'
          }
        ]
      },
      {
        day: 5,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Hotel Check-out',
            description: 'Check out from your hotel and store luggage if needed',
            notes: 'Most hotels offer luggage storage service'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Last-minute Shopping',
            description: 'Visit Galeries Lafayette or other shopping areas for souvenirs',
            notes: 'Don\'t forget to get your VAT refund if eligible'
          },
          {
            timeOfDay: 'Evening',
            location: 'Flight Home',
            description: 'Transfer to Charles de Gaulle Airport (CDG) for your return flight',
            notes: 'Arrive at the airport 3 hours before departure'
          }
        ]
      }
    ],
    hotels: [
      {
        name: 'Hotel Le Bristol Paris',
        priceRange: 'mid-range',
        description: 'Luxury hotel in the heart of Paris, near the Champs-Élysées',
        location: '112 rue du Faubourg Saint Honoré, 75008 Paris',
        website: 'https://www.oetkercollection.com/hotels/le-bristol-paris/'
      },
      {
        name: 'Hotel Lutetia',
        priceRange: 'mid-range',
        description: 'Art Deco hotel in the Saint-Germain-des-Prés district',
        location: '45 Boulevard Raspail, 75006 Paris',
        website: 'https://www.hotellutetia.com/'
      },
      {
        name: 'Hotel Plaza Athénée',
        priceRange: 'mid-range',
        description: 'Iconic luxury hotel with views of the Eiffel Tower',
        location: '25 Avenue Montaigne, 75008 Paris',
        website: 'https://www.dorchestercollection.com/en/paris/hotel-plaza-athenee/'
      }
    ],
    generalTips: [
      'Purchase a Paris Museum Pass for discounted entry to major attractions',
      'Use the Metro for convenient transportation around the city',
      'Book restaurant reservations in advance, especially for popular places',
      'Be aware of pickpockets in tourist areas',
      'Consider purchasing a Paris Visite travel card for unlimited public transport',
      'Book airport transfers in advance for convenience',
      'Check flight schedules and book tickets early for better prices'
    ]
  },
  'tokyo-explorer': {
    tripId: 'tokyo-explorer',
    destination: 'Tokyo, Japan',
    duration: 7, // Fixed 7-day duration
    numTravelers: 2,
    interests: ['Culture', 'Food', 'Technology', 'Shopping'],
    budget: 'mid-range',
    travelStyle: 'fast-paced',
    foodPreference: 'not-specified',
    itinerary: [
      {
        day: 1,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Flight to Tokyo',
            description: 'Departure flight to Tokyo Narita International Airport (NRT)',
            notes: 'Arrive at the airport 3 hours before departure'
          },
          {
            timeOfDay: 'Evening',
            location: 'Arrival in Tokyo',
            description: 'Arrive at Tokyo Narita International Airport (NRT)',
            notes: 'Take the Narita Express or limousine bus to your hotel'
          }
        ]
      },
      {
        day: 2,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Senso-ji Temple',
            description: 'Start your Tokyo adventure at the oldest Buddhist temple in Tokyo.',
            notes: 'Visit early morning to avoid crowds'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Asakusa',
            description: 'Explore the traditional district of Asakusa and enjoy authentic Japanese cuisine.',
            notes: 'Try the local street food and tempura restaurants'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Tokyo Skytree',
            description: 'Visit the tallest structure in Japan for panoramic views of Tokyo.',
            notes: 'Book tickets in advance for better prices'
          },
          {
            timeOfDay: 'Evening',
            location: 'Odaiba',
            description: 'Experience the futuristic entertainment district of Odaiba.',
            notes: 'Great for shopping and dining with a view'
          }
        ]
      },
      {
        day: 3,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Tsukiji Outer Market',
            description: 'Explore the famous fish market and enjoy fresh sushi for breakfast.',
            notes: 'Arrive early for the best selection'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Ginza',
            description: 'Visit Tokyo\'s upscale shopping district and enjoy lunch at a high-end restaurant.',
            notes: 'Many department stores have excellent food halls'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Imperial Palace',
            description: 'Tour the beautiful gardens of the Imperial Palace.',
            notes: 'Book guided tours in advance'
          },
          {
            timeOfDay: 'Evening',
            location: 'Shibuya',
            description: 'Experience the famous Shibuya Crossing and vibrant nightlife.',
            notes: 'Visit the Hachiko statue and enjoy the neon lights'
          }
        ]
      },
      {
        day: 4,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Asakusa',
            description: 'Visit the traditional district of Asakusa and explore its local markets.',
            notes: 'Try the local street food and souvenirs'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Ginza',
            description: 'Visit Tokyo\'s upscale shopping district and enjoy lunch at a high-end restaurant.',
            notes: 'Many department stores have excellent food halls'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Ueno',
            description: 'Visit the Ueno Royal Museum and enjoy the art collections.',
            notes: 'Free entry on weekends'
          },
          {
            timeOfDay: 'Evening',
            location: 'Shinjuku',
            description: 'Explore the vibrant nightlife of Shinjuku and visit a local izakaya.',
            notes: 'Try the local specialties and trendy bars'
          }
        ]
      },
      {
        day: 5,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Akihabara',
            description: 'Visit the electronics and anime district of Akihabara.',
            notes: 'Explore the many shops and arcades'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Kanda',
            description: 'Enjoy lunch in the historic Kanda district and visit the local shrine.',
            notes: 'Try the local specialties and traditional sweets'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Tokyo Station',
            description: 'Visit Tokyo Station and explore its architecture and local markets.',
            notes: 'Try the local food and souvenirs'
          },
          {
            timeOfDay: 'Evening',
            location: 'Shibuya',
            description: 'Experience the famous Shibuya Crossing and vibrant nightlife.',
            notes: 'Visit the Hachiko statue and enjoy the neon lights'
          }
        ]
      },
      {
        day: 6,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Hakone',
            description: 'Take a scenic train ride to Hakone and enjoy the natural beauty.',
            notes: 'Visit the Hakone Shrine and Lake Ashi'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Odawara',
            description: 'Enjoy lunch in the charming town of Odawara and visit the local shrine.',
            notes: 'Try the local specialties and traditional sweets'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Tobu Railway Museum',
            description: 'Visit the Tobu Railway Museum and learn about Japanese railway history.',
            notes: 'Free entry on weekends'
          },
          {
            timeOfDay: 'Evening',
            location: 'Shinkansen',
            description: 'Take a Shinkansen bullet train to Kyoto.',
            notes: 'Enjoy the high-speed train journey'
          }
        ]
      },
      {
        day: 7,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Kyoto',
            description: 'Start your day in Kyoto and visit the famous Fushimi Inari Shrine.',
            notes: 'Try to visit early in the morning to avoid crowds'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Pontocho',
            description: 'Enjoy lunch in the charming Pontocho district and visit the local shrine.',
            notes: 'Try the local specialties and traditional sweets'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Kinkaku-ji',
            description: 'Visit the Golden Pavilion and enjoy its unique architecture.',
            notes: 'Free entry on weekends'
          },
          {
            timeOfDay: 'Evening',
            location: 'Arashiyama',
            description: 'Enjoy a peaceful walk in the Arashiyama district and visit the local temples.',
            notes: 'Try the local specialties and traditional sweets'
          }
        ]
      },
      {
        day: 7,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Hotel Check-out',
            description: 'Check out from your hotel and store luggage if needed',
            notes: 'Most hotels offer luggage storage service'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Last-minute Shopping',
            description: 'Visit Ginza or other shopping areas for souvenirs',
            notes: 'Don\'t forget to get your tax-free shopping documents'
          },
          {
            timeOfDay: 'Evening',
            location: 'Flight Home',
            description: 'Transfer to Narita International Airport (NRT) for your return flight',
            notes: 'Arrive at the airport 3 hours before departure'
          }
        ]
      }
    ],
    hotels: [
      {
        name: 'The Peninsula Tokyo',
        priceRange: 'mid-range',
        description: 'Luxury hotel in the heart of Marunouchi district',
        location: '1-8-1 Yurakucho, Chiyoda-ku, Tokyo 100-0006',
        website: 'https://www.peninsula.com/en/tokyo'
      },
      {
        name: 'Mandarin Oriental Tokyo',
        priceRange: 'mid-range',
        description: 'Five-star hotel in the Nihonbashi district',
        location: '2-1-1 Nihonbashi Muromachi, Chuo-ku, Tokyo 103-8328',
        website: 'https://www.mandarinoriental.com/tokyo'
      },
      {
        name: 'Park Hotel Tokyo',
        priceRange: 'mid-range',
        description: 'Art-focused hotel in the Shiodome district',
        location: '1-7-1 Higashi-Shimbashi, Minato-ku, Tokyo 105-7227',
        website: 'https://www.parkhoteltokyo.com/'
      }
    ],
    generalTips: [
      'Purchase a Japan Rail Pass before arriving in Japan',
      'Get a Suica or Pasmo card for convenient public transportation',
      'Learn basic Japanese phrases for better interaction with locals',
      'Carry cash as many places don\'t accept credit cards',
      'Download offline maps and translation apps'
    ]
  },
  'bali-paradise': {
    tripId: 'bali-paradise',
    destination: 'Bali, Indonesia',
    duration: 5, // Fixed 5-day duration
    numTravelers: 2,
    interests: ['Beach', 'Culture', 'Nature', 'Relaxation'],
    budget: 'mid-range',
    travelStyle: 'relaxed',
    foodPreference: 'not-specified',
    itinerary: [
      {
        day: 1,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Flight to Bali',
            description: 'Departure flight to Ngurah Rai International Airport (DPS)',
            notes: 'Arrive at the airport 3 hours before departure'
          },
          {
            timeOfDay: 'Evening',
            location: 'Arrival in Bali',
            description: 'Arrive at Ngurah Rai International Airport (DPS)',
            notes: 'Take a taxi or arrange hotel transfer to your accommodation'
          }
        ]
      },
      {
        day: 2,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Ubud Monkey Forest',
            description: 'Start your Bali adventure with a visit to the sacred monkey forest sanctuary.',
            notes: 'Keep belongings secure from curious monkeys'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Ubud Palace',
            description: 'Explore the royal palace and enjoy traditional Balinese cuisine.',
            notes: 'Try the local warungs for authentic food'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Tegallalang Rice Terraces',
            description: 'Visit the famous rice terraces and learn about traditional farming methods.',
            notes: 'Best photo opportunities in the morning or late afternoon'
          },
          {
            timeOfDay: 'Evening',
            location: 'Ubud Art Market',
            description: 'Browse local crafts and souvenirs at the traditional market.',
            notes: 'Remember to bargain for better prices'
          }
        ]
      },
      {
        day: 3,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Mount Batur',
            description: 'Early morning hike to watch the sunrise from the volcano.',
            notes: 'Start the hike around 4 AM for sunrise views'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Kintamani',
            description: 'Enjoy lunch with a view of the volcano and Lake Batur.',
            notes: 'Try the local specialty, Babi Guling'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Tirta Empul Temple',
            description: 'Visit the holy water temple and participate in the purification ritual.',
            notes: 'Bring a change of clothes for the water ritual'
          },
          {
            timeOfDay: 'Evening',
            location: 'Ubud',
            description: 'Relax with a traditional Balinese massage and spa treatment.',
            notes: 'Book spa treatments in advance'
          }
        ]
      },
      {
        day: 4,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Sacred Monkey Forest Sanctuary',
            description: 'Visit the Sacred Monkey Forest Sanctuary and see the playful monkeys.',
            notes: 'Keep belongings secure from curious monkeys'
          },
          {
            timeOfDay: 'Lunch',
            location: 'Ubud',
            description: 'Enjoy lunch in Ubud and explore its local markets.',
            notes: 'Try the local specialties and traditional sweets'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Tegallalang Rice Terraces',
            description: 'Visit the famous Tegallalang Rice Terraces and learn about traditional farming methods.',
            notes: 'Best photo opportunities in the morning or late afternoon'
          },
          {
            timeOfDay: 'Evening',
            location: 'Ubud',
            description: 'Enjoy a traditional Balinese dinner and watch a cultural dance performance.',
            notes: 'Try the local specialties and traditional sweets'
          }
        ]
      },
      {
        day: 5,
        activities: [
          {
            timeOfDay: 'Morning',
            location: 'Hotel Check-out',
            description: 'Check out from your hotel and store luggage if needed',
            notes: 'Most hotels offer luggage storage service'
          },
          {
            timeOfDay: 'Afternoon',
            location: 'Last-minute Shopping',
            description: 'Visit local markets for souvenirs and gifts',
            notes: 'Remember to bargain for better prices'
          },
          {
            timeOfDay: 'Evening',
            location: 'Flight Home',
            description: 'Transfer to Ngurah Rai International Airport (DPS) for your return flight',
            notes: 'Arrive at the airport 3 hours before departure'
          }
        ]
      }
    ],
    hotels: [
      {
        name: 'Four Seasons Resort Bali at Sayan',
        priceRange: 'mid-range',
        description: 'Luxury resort in the heart of Ubud',
        location: 'Sayan, Ubud, Bali 80571, Indonesia',
        website: 'https://www.fourseasons.com/sayan/'
      },
      {
        name: 'Hanging Gardens of Bali',
        priceRange: 'mid-range',
        description: 'Unique resort with private infinity pools',
        location: 'Desa Buahan, Payangan, Ubud, Bali 80571, Indonesia',
        website: 'https://www.hanginggardensofbali.com/'
      },
      {
        name: 'Munduk Moding Plantation',
        priceRange: 'mid-range',
        description: 'Boutique resort with stunning views',
        location: 'Banjar Dinas Asah, Desa Gobleg, Kecamatan Banjar, Buleleng, Bali 81152, Indonesia',
        website: 'https://www.mundukmodingplantation.com/'
      }
    ],
    generalTips: [
      'Rent a scooter for convenient transportation',
      'Respect local customs and dress modestly when visiting temples',
      'Carry cash for small purchases and tips',
      'Book popular activities and restaurants in advance',
      'Be prepared for occasional rain showers'
    ]
  }
};

// Add route for predefined trips
router.get('/predefined-trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { startDate } = req.query;
    const trip = predefinedTrips[tripId];

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Calculate end date based on start date and duration
    let tripStartDate;
    if (startDate) {
      tripStartDate = new Date(startDate);
      // Validate the date
      if (isNaN(tripStartDate.getTime())) {
        return res.status(400).json({ error: 'Invalid start date format' });
      }
    } else {
      tripStartDate = new Date();
    }

    // Ensure the start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (tripStartDate < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    const tripEndDate = new Date(tripStartDate);
    tripEndDate.setDate(tripEndDate.getDate() + trip.duration - 1);

    // Update dates in the itinerary
    const updatedItinerary = trip.itinerary.map((day, index) => {
      const dayDate = new Date(tripStartDate);
      dayDate.setDate(dayDate.getDate() + index);
      return {
        ...day,
        date: dayDate.toISOString().split('T')[0]
      };
    });

    // Get place details for activities
    const enhancedItinerary = await Promise.all(
      updatedItinerary.map(async (day) => {
        const enhancedActivities = await Promise.all(
          day.activities.map(async (activity) => {
            if (activity.location) {
              const placeDetails = await getPlaceDetails(activity.location, trip.destination);
              return { ...activity, placeDetails };
            }
            return activity;
          })
        );
        return { ...day, activities: enhancedActivities };
      })
    );

    // Get hotel details
    const enhancedHotels = await Promise.all(
      trip.hotels.map(async (hotel) => {
        const placeDetails = await getPlaceDetails(hotel.name, trip.destination);
        return { ...hotel, placeDetails };
      })
    );

    res.json({
      ...trip,
      startDate: tripStartDate.toISOString().split('T')[0],
      endDate: tripEndDate.toISOString().split('T')[0],
      itinerary: enhancedItinerary,
      hotels: enhancedHotels
    });
  } catch (error) {
    console.error('Error fetching predefined trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
});

// Add trip planning route
router.post('/plan-trip', planTrip);

module.exports = router; 