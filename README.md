# Job Application Tracker

A comprehensive web application for tracking job applications, customizing resumes, and generating cover letters with AI assistance. This application helps job seekers manage their job search process more efficiently.

## Project Overview

The Job Application Tracker allows users to:

- Track job applications with detailed information (company, position, status, etc.)
- Customize resumes based on job descriptions using AI
- Generate cover letters tailored to specific jobs
- Visualize job search progress with dashboard analytics
- Manage user profile information for documents
- Configure AI settings with multiple model options

## Architecture

This application uses a modern React frontend with a FastAPI backend architecture:

### Frontend (React)
- Built with React 18 using functional components and hooks
- Material UI for consistent, responsive UI components
- React Query for efficient data fetching and caching
- React Router for navigation
- Chart.js for data visualization

### Backend (FastAPI)
- FastAPI for high-performance API endpoints
- SQLite for database (can be easily scaled to other databases)
- Python libraries for document handling (python-docx)
- Integration with multiple AI providers:
  - Ollama (local AI, default)
  - OpenAI (optional)
  - Anthropic (optional)

## Project Structure

```
├── backend/               # FastAPI backend
│   ├── app/               # Application code
│   │   ├── ai_integration.py   # AI service integration
│   │   ├── database.py    # Database functions
│   │   ├── document_handlers.py # Resume and cover letter generation
│   │   ├── file_handler.py # File upload/download helpers
│   │   ├── main.py        # FastAPI app and routes
│   │   └── models.py      # Pydantic models
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── public/            # Public assets
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   │   └── layout/    # Layout components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── App.js         # Main App component
│   │   ├── index.js       # Entry point
│   │   └── theme.js       # Material UI theming
├── llm_config.yaml        # AI model configuration
├── .env                   # Environment variables for API keys
├── start-app.bat          # Windows startup script
├── resumes/               # Directory for stored resumes
├── cover_letters/         # Directory for generated cover letters
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- One of the following AI providers:
  - Ollama (recommended, free local option)
  - OpenAI API key (optional)
  - Anthropic API key (optional)

### Installation

#### 1. Clone the repository

```
git clone https://github.com/yourusername/job-application-tracker.git
cd job-application-tracker
```

#### 2. Backend Setup

1. Create and activate a virtual environment:
   ```
   cd backend
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

#### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

#### 4. AI Provider Setup

##### Option A: Ollama (Recommended)

1. Download and install Ollama from [ollama.ai](https://ollama.ai)
2. After installation, pull the default model:
   ```
   ollama pull qwen2.5:14b
   ```
   (You can configure different models in llm_config.yaml)

##### Option B: OpenAI or Anthropic

1. Copy the .env.example file to .env:
   ```
   cp .env.example .env
   ```
   
2. Edit the .env file and add your API key(s):
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

3. You can also configure which model to use in the llm_config.yaml file

#### 5. Starting the Application

The easiest way to start the application is using the provided batch script (Windows):

```
start-app.bat
```

This will start both the frontend and backend servers in separate windows.

Alternatively, you can start them manually:

**Backend:**
```
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

**Frontend:**
```
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## AI Configuration

The application supports multiple AI providers which can be configured through the UI or by editing the llm_config.yaml file:

```yaml
# Default providers and models
default_provider: "ollama"

# Models for each provider
models:
  ollama: "qwen2.5:14b"
  openai: "gpt-4o"
  anthropic: "claude-3-5-sonnet-latest"
```

You can switch between providers in the AI Settings page of the application.

## API Endpoints

The application exposes the following key API endpoints:

- `GET /api/health` - API health check
- `GET/POST /api/user` - Manage user information
- `GET/POST/PUT/DELETE /api/applications` - Manage job applications
- `POST /api/resumes/customize` - Customize a resume for a job
- `POST /api/cover-letters/generate` - Generate a cover letter
- `GET/POST /api/ai/settings` - Get or update AI settings

## Refactoring from Gradio to React

This application was originally built using Gradio, a Python library for creating simple web interfaces. The refactoring to React + FastAPI provides several advantages:

1. **Improved User Experience**: Better UI/UX with Material UI components and responsive design
2. **Enhanced Performance**: Client-side rendering for smoother interactions
3. **Better State Management**: More sophisticated state management with React hooks and React Query
4. **Scalability**: Separated frontend and backend architecture allows for independent scaling
5. **Maintainability**: Better code organization with component-based architecture

## License

This project is licensed under the terms of the LICENSE file included in the repository.
