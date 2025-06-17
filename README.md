# AI Trip Planner

An intelligent trip planning application that uses Google's Gemini API to generate personalized travel itineraries based on user preferences, enhanced with Google Places API for rich place details and images.

## Features

- Interactive trip planning form
- AI-powered itinerary generation using Gemini 2.0 Flash
- Day-by-day activity breakdown with real images and place details
- Hotel recommendations with images, ratings, and direct booking links
- Travel tips and recommendations
- Save and manage your trip plans
- Responsive design with Material-UI
- Rich place information powered by Google Places API

## Tech Stack

### Frontend
- React
- Material-UI
- Axios
- React Router
- Date-fns for date formatting

### Backend
- Node.js
- Express
- Google Gemini API (2.0 Flash)
- Google Places API
- MongoDB (for future user profiles and saved trips)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd aitripplanner
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   
   Create a `.env` file in the backend directory:
   ```
   # API Keys
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

   Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:3001
   ```

5. Start the development servers:

   In one terminal (backend):
   ```bash
   cd backend
   npm run dev
   ```

   In another terminal (frontend):
   ```bash
   cd frontend
   npm start
   ```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   ```bash
   # If you encounter module not found errors, try:
   cd backend
   npm install
   ```

2. **API Key Issues**
   - Ensure your `.env` files are properly set up
   - Verify that your API keys are valid and have the necessary permissions
   - Check the API rate limits for both Gemini and Google Places

3. **CORS Issues**
   - Verify that the backend CORS settings match your frontend URL
   - Check that the frontend is using the correct API URL

4. **Image Loading Issues**
   - Ensure your Google Places API key has access to the Places API
   - Check the network tab in your browser's developer tools for any failed requests

### Development Tips

1. **Backend Development**
   - Use `npm run dev` for development with auto-reload
   - Check the console for detailed error messages
   - Use the morgan logger for request debugging

2. **Frontend Development**
   - Use React Developer Tools for component debugging
   - Check the browser console for any JavaScript errors
   - Use the Network tab to monitor API requests

## Project Structure

```
aitripplanner/
├── frontend/           # React frontend application
│   ├── src/           # Source code
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/     # Page components
│   │   └── App.js     # Main application component
│   ├── public/        # Static files
│   └── package.json   # Frontend dependencies
├── backend/           # Node.js/Express backend server
│   ├── src/          # Source code
│   ├── models/       # Database models and schemas
│   ├── routes/       # API route handlers
│   ├── logs/         # Application logs
│   └── package.json  # Backend dependencies
├── .gitignore        # Git ignore rules
└── README.md         # Project documentation
```

## Backend Organization

The backend is organized into several key directories:

- `src/`: Contains the main application code and server configuration
- `models/`: Contains database models and schemas for data persistence
- `routes/`: Contains API route handlers and controllers
- `logs/`: Stores application logs for debugging and monitoring

## API Documentation

### POST /api/plan-trip

Generates a personalized travel itinerary based on user preferences.

**Request Body:**
```json
{
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "numTravelers": number,
    "interests": ["string"],
    "budget": "string",
    "travelStyle": "string"
}
```

**Response Body:**
```json
{
    "tripId": "string",
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "itinerary": [
        {
            "date": "YYYY-MM-DD",
            "day": number,
            "activities": [
                {
                    "timeOfDay": "string",
                    "description": "string",
                    "location": "string",
                    "notes": "string",
                    "placeDetails": {
                        "name": "string",
                        "address": "string",
                        "photoUrl": "string",
                        "website": "string",
                        "rating": number,
                        "stats": {
                            "totalRatings": number
                        }
                    }
                }
            ]
        }
    ],
    "hotels": [
        {
            "name": "string",
            "priceRange": "string",
            "description": "string",
            "location": "string",
            "placeDetails": {
                "name": "string",
                "address": "string",
                "photoUrl": "string",
                "website": "string",
                "rating": number,
                "stats": {
                    "totalRatings": number
                }
            }
        }
    ],
    "generalTips": ["string"]
}
```

## Features in Detail

### Trip Planning
- AI-powered itinerary generation using Gemini 2.0 Flash
- Customizable trip preferences (budget, travel style, interests)
- Date range selection
- Number of travelers specification

### Place Information
- Real images from Google Places API
- Detailed place information including:
  - Address
  - Ratings
  - Review counts
  - Website links
  - Photos

### Hotel Recommendations
- Three hotel options in different price ranges
- Hotel images and details
- Direct booking links
- Ratings and reviews
- Price level indicators

### Trip Management
- Save trips for future reference
- View saved trips
- Delete saved trips
- Share trip itineraries
- Print trip details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT "# Ai_trip_planner" 
