#!/bin/bash

# ShellHacks 2025 - Frontend Startup Script
echo "🚀 Starting ShellHacks 2025 Frontend App..."

# Check if node_modules exists
if [ ! -d "app/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd app
    npm install
    cd ..
fi

# Start the frontend development server
echo "🔧 Starting Vite development server on http://localhost:5173"
cd app
npm run dev
