# AI Trip Planner

An intelligent trip planning application that helps users create personalized travel itineraries using AI. The application features predefined trips for popular destinations and allows users to create custom plans based on their preferences.

## Features

- **AI-Powered Trip Planning**: Generate personalized travel itineraries based on user preferences
- **Predefined Trips**: Access curated travel plans for popular destinations:
  - Paris Adventure (5 days)
  - Tokyo Explorer (7 days)
  - Bali Paradise (5 days)
- **Smart Itinerary Generation**: Get detailed day-by-day plans with:
  - Morning, afternoon, and evening activities
  - Restaurant recommendations
  - Hotel suggestions
  - Transportation options
  - Local tips and insights
- **User Authentication**: Secure login and registration system
- **Trip Management**: Save, view, and manage multiple trip plans
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- React.js
- Material-UI
- Redux for state management
- Axios for API calls
- React Router for navigation

### Backend
- Node.js
- Express.js
- MongoDB
- OpenAI API integration
- JWT authentication

## Project Structure

```
aitripplanner/
├── frontend/                 # React frontend application
│   ├── public/              # Static files
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── store/          # Redux store
│       └── utils/          # Utility functions
│
├── backend/                 # Node.js backend server
│   ├── src/
│       ├── config/         # Configuration files
│       ├── controllers/    # Route controllers
│       ├── middleware/     # Custom middleware
│       ├── models/         # Database models
│       ├── routes/         # API routes
│       └── utils/          # Utility functions
│
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/aitripplanner.git
cd aitripplanner
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Create a `.env` file in the backend directory:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **Create a New Account**
   - Register with your email and password
   - Log in to access the trip planner

2. **Choose a Trip Type**
   - Select from predefined trips (Paris, Tokyo, Bali)
   - Or create a custom trip plan

3. **For Predefined Trips**
   - Select your preferred start date
   - View the complete itinerary including:
     - Flight details
     - Daily activities
     - Hotel recommendations
     - Local tips

4. **For Custom Trips**
   - Enter your destination
   - Specify trip duration
   - Select your interests
   - Choose your budget and travel style
   - Add any specific requirements

5. **View and Manage Trips**
   - Access your saved trips
   - View detailed itineraries
   - Make modifications as needed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- Material-UI for the component library
- All contributors who have helped shape this project
