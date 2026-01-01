# Lead Stitch Frontend

React frontend for Lead Stitch - B2B Lead Generation & Email Marketing Platform

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   - Copy `env.example` to `.env`
   - Update `VITE_API_URL` if your backend runs on a different port

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── store/          # Redux store and slices
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   ├── App.jsx         # Main App component
│   └── main.jsx        # Entry point
├── public/             # Static assets
└── package.json        # Dependencies
```

