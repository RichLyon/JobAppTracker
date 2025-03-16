# Job Application Tracker

A comprehensive web application for tracking job applications, customizing resumes, and generating cover letters with AI assistance. This application helps job seekers manage their job search process more efficiently.

## Project Overview

The Job Application Tracker allows users to:

- Track job applications with detailed information (company, position, status, etc.)
- Customize resumes based on job descriptions using AI
- Generate cover letters tailored to specific jobs
- Visualize job search progress with dashboard analytics
- Manage user profile information for documents

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
- Integration with Ollama for AI-powered resume customization and cover letter generation

## Project Structure

```
├── backend/               # FastAPI backend
│   ├── app/               # Application code
│   │   ├── ai_integration.py   # AI service integration (Ollama)
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
│   └── package.json       # JavaScript dependencies
├── resumes/               # Directory for stored resumes
├── cover_letters/         # Directory for generated cover letters
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- Ollama (optional, for AI features)

### Installation

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment (recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the FastAPI server:
   ```
   uvicorn app.main:app --reload
   ```

The backend will start on http://localhost:8000 with API documentation available at http://localhost:8000/docs

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The React app will start on http://localhost:3000

## API Endpoints

The application exposes the following key API endpoints:

- `GET /api/health` - API health check
- `GET/POST /api/user` - Manage user information
- `GET/POST/PUT/DELETE /api/applications` - Manage job applications
- `POST /api/resumes/customize` - Customize a resume for a job
- `POST /api/cover-letters/generate` - Generate a cover letter

## Refactoring from Gradio to React

This application was originally built using Gradio, a Python library for creating simple web interfaces. The refactoring to React + FastAPI provides several advantages:

1. **Improved User Experience**: Better UI/UX with Material UI components and responsive design
2. **Enhanced Performance**: Client-side rendering for smoother interactions
3. **Better State Management**: More sophisticated state management with React hooks and React Query
4. **Scalability**: Separated frontend and backend architecture allows for independent scaling
5. **Maintainability**: Better code organization with component-based architecture

The refactoring involved:

1. Creating a FastAPI backend with endpoints corresponding to the original Gradio functionality
2. Developing a React frontend with Material UI for a more polished interface
3. Implementing client-side routing for better navigation
4. Adding data visualization for analytics on the dashboard
5. Enhancing the resume and cover letter generation features

## License

This project is licensed under the terms of the LICENSE file included in the repository.
