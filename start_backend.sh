#!/bin/bash

# ShellHacks 2025 - Backend Startup Script
echo "🚀 Starting ShellHacks 2025 Backend Server..."

# Check if virtual environment exists
if [ ! -d "server/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd server
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Start the backend server
echo "🔧 Starting FastAPI server on http://localhost:8000"
cd server
source venv/bin/activate

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  Warning: GEMINI_API_KEY environment variable not set!"
    echo "   Please set it in your .env file or environment:"
    echo "   export GEMINI_API_KEY=your_api_key_here"
    echo ""
fi

# Start uvicorn server
uvicorn inference:app --host 0.0.0.0 --port 8000 --reload
