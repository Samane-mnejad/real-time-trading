# Submission Details

**Project Name:** Real-Time Trading Dashboard

**Submitted By:** Samane Motaharinejad

**Date of Submission:** Thu - 7 Aug 2025

## Tech Stack

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts

**Backend:** Node.js, Express, WebSocket (ws), TypeScript

**Others:** Jest (Testing), Docker (Containerization), Mock Data Generator

## Key Features Implemented

- REST API endpoints for fetching live and historical price data
- Real-time price updates using WebSocket
- Interactive and responsive dashboard with dynamic charts
- Mock data generation for multiple ticker symbols (AAPL, TSLA, BTC-USD)
- Modular and scalable codebase structure
- Comprehensive unit testing and documentation
- Docker containerization for easy deployment

## Bonus Features Implemented

- **User authentication system** with session management (mocked)

## Deployment
[Optional: add GitHub repo link or deployed URL]

## How to Run

1. Clone the repository
2. **Set up Environment Variables:**
   ```bash
   # Copy the example environment file for local development
   cp .env.example .env.local
   ```
   Or manually create `.env.local` with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   ```
3. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```
4. **Install Frontend Dependencies:**
   ```bash
   cd ..
   npm install
   ```
5. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will be available at `http://localhost:3001`

6. **Start Frontend:**
   ```bash
   # In the root directory
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

6. Visit `http://localhost:3000` in your browser

## Testing

Run backend tests:
```bash
cd backend
npm test
```

## Demo User Accounts

| Email | Name |
|-------|------|
| frank-amankwah@demo.com | Frank Amankwah |

*Note: Use any password for demo accounts*

## Environment Variables

The application uses environment variables for configuration. Available variables:

| Variable | Description | Default (Development) |
|----------|-------------|----------------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `ws://localhost:3001` |

### For Different Environments:

- **Development**: Use `.env.local` (already configured if you followed setup steps)
- **Docker**: Environment variables are set in `docker-compose.yml`
- **Production**: Set these variables in your deployment environment

## Docker Deployment (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

## Note

The project uses mock data to simulate live price updates for demonstration purposes. The system includes user authentication, real-time WebSocket connections, and interactive charts with 30 days of historical data simulation.
