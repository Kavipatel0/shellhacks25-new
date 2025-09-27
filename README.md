# ShellHacks 2025 - GitHub Repository Visualizer with AI-Powered File Analysis

## 🚀 Overview
A full-stack application that visualizes GitHub repositories as interactive flow graphs and provides AI-powered file summarization using Google's Gemini API. Click on any file node to get an intelligent summary of what the file does and its role in the codebase.

## ✨ Features
- **Interactive Repository Visualization**: Beautiful flow graphs showing repository structure
- **AI-Powered File Analysis**: Click any file to get a concise summary powered by Gemini AI
- **Modern UI/UX**: Dark theme with smooth animations and responsive design
- **Real-time Error Handling**: Graceful handling of API limits and network issues
- **Cross-platform**: Works on desktop and mobile devices

## 🏗️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Google Gemini Pro API**: AI-powered code analysis
- **Uvicorn**: ASGI server for FastAPI
- **Python 3.9+**: Core runtime

### Frontend
- **React 19**: Modern React with hooks
- **ReactFlow**: Interactive node-based graphs
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.9 or higher
- Node.js 16 or higher
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone <repository-url>
cd shellhacks25
```

### 2. Backend Setup
```bash
# Create virtual environment and install dependencies
cd server
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
export GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Frontend Setup
```bash
# Install dependencies
cd ../app
npm install
```

### 4. Quick Start (Using Scripts)
```bash
# Terminal 1: Start backend
./start_backend.sh

# Terminal 2: Start frontend  
./start_frontend.sh
```

### 5. Manual Start
```bash
# Terminal 1: Backend
cd server
source venv/bin/activate
export GEMINI_API_KEY=your_api_key
uvicorn inference:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd app
npm run dev
```

## 🎯 Usage

1. **Start both servers** (backend on port 8000, frontend on port 5173)
2. **Open your browser** to `http://localhost:5173`
3. **Enter a GitHub repository URL** (e.g., `https://github.com/facebook/react`)
4. **Explore the visualization** - drag, zoom, and pan through the repository structure
5. **Click any orange file node** to get an AI-powered summary of what that file does

### Example Repository URLs
- `https://github.com/facebook/react`
- `https://github.com/microsoft/vscode`
- `https://github.com/tensorflow/tensorflow`

## 🔧 API Endpoints

### Backend (Port 8000)
- `GET /` - Health check
- `POST /infer` - Analyze any GitHub file
- `POST /summarize-file` - Detailed file summarization

### Frontend (Port 5173)
- Main React application with interactive repository visualization

## 🎨 UI Components

- **FlowGraph**: Interactive repository tree visualization
- **FileSummaryModal**: Modal displaying AI-generated file summaries
- **CustomNode**: Styled nodes for files (orange) and folders (blue)

## 🚨 Troubleshooting

### Common Issues

1. **"ModuleNotFoundError: No module named 'fastapi'"**
   - Make sure you're in the virtual environment: `source server/venv/bin/activate`

2. **"Failed to summarize file: API error"**
   - Check your Gemini API key is set: `echo $GEMINI_API_KEY`
   - Verify the API key is valid and has sufficient quota

3. **"Repository not found"**
   - Ensure the GitHub URL is correct and the repository is public
   - Check if you've hit GitHub API rate limits

4. **CORS errors**
   - Make sure the backend is running on port 8000
   - Check that CORS is enabled in the FastAPI app

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for higher GitHub API limits)
VITE_GITHUB_TOKEN=your_github_token_here
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License
MIT License - feel free to use this project for your own hackathons and projects!

## 🎉 Team
Built with ❤️ for ShellHacks 2025

---

**Happy coding! 🚀**
