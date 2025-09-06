# MentiQuiz Frontend

A modern, real-time interactive quiz platform built with React and WebSockets.

## Features

### 🎯 **Real-Time Interactive Quizzes**
- Live participant tracking
- Instant answer submission
- Real-time results and statistics
- WebSocket-powered communication

### 👥 **User Management**
- User authentication and authorization
- Admin and participant roles
- Secure JWT-based sessions

### 🎮 **Admin Dashboard**
- Create and manage quizzes
- Real-time quiz control
- Live participant monitoring
- Question progression management

### 📊 **Live Analytics**
- Real-time response tracking
- Live leaderboards
- Instant result visualization
- Export and share results

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend server running on port 6700

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   └── layout/         # Layout components (Navbar, etc.)
├── contexts/           # React contexts (Auth, etc.)
├── pages/              # Main application pages
├── services/           # API and WebSocket services
└── styles/             # Global styles
```

## Key Components

### Authentication
- **Login/Register**: Secure user authentication
- **AuthContext**: Global authentication state management
- **Protected Routes**: Role-based access control

### Quiz Management
- **AdminDashboard**: Create and manage quizzes
- **QuizManagement**: Real-time quiz control interface
- **JoinQuiz**: Participant quiz interface

### Real-Time Features
- **SocketService**: WebSocket communication
- **Live Results**: Real-time answer tracking
- **Participant Tracking**: Live participant count

## WebSocket Events

### Client → Server
- `join-quiz`: Join a quiz room
- `leave-quiz`: Leave a quiz room
- `submit-answer`: Submit an answer
- `start-quiz`: Start a quiz (admin)
- `next-question`: Show next question (admin)
- `end-quiz`: End a quiz (admin)

### Server → Client
- `participant-joined`: New participant joined
- `participant-left`: Participant left
- `quiz-started`: Quiz started
- `next-question`: New question displayed
- `answer-submitted`: Answer submitted with stats
- `quiz-ended`: Quiz completed with results

## API Integration

The frontend integrates with the backend API through:

- **Authentication**: Login, register, profile management
- **Quiz Management**: Create, join, submit answers
- **Real-time Data**: Live statistics and results
- **Admin Functions**: Quiz control and management

## Styling

Built with Tailwind CSS for:
- Responsive design
- Modern UI components
- Consistent color scheme
- Smooth animations and transitions

## Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Environment Variables
The frontend connects to the backend at `http://localhost:6700` by default.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the MentiQuiz platform.