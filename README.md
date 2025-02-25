# Job Application Tracker

A Python application with a Gradio interface that helps you track job applications, customize resumes, and generate cover letters based on job descriptions.

## Features

- **Job Application Tracking**: Store and manage all your job applications in one place
- **Status Updates**: Track the status of each application (Applied, Interviewing, Rejected, etc.)
- **Resume Customization**: Tailor your resume to specific job descriptions using AI
- **Cover Letter Generation**: Create customized cover letters for each job application
- **Local AI Integration**: Uses Ollama for AI-powered text generation, keeping your data private

## Requirements

- Python 3.8+
- Ollama (for AI-powered resume customization and cover letter generation)
- A base resume in DOCX format

## Installation

1. Clone this repository or download the files
2. Install the required Python packages:

```bash
pip install gradio python-docx pandas requests
```

3. Install and set up Ollama:
   - Visit [Ollama's website](https://ollama.ai/) to download and install
   - Run Ollama and pull the llama3 model:
   ```bash
   ollama pull llama3
   ```

## Usage

1. Run the application:

```bash
python main.py
```

2. Open your web browser and navigate to http://127.0.0.1:7860

3. Use the different tabs to:
   - Add new job applications
   - View and edit existing applications
   - Customize your resume for specific job descriptions
   - Generate cover letters

## Tabs and Features

### Add Application

- Enter job details including company name, position, date applied, etc.
- Upload your base resume (DOCX format)
- Add job description and any notes

### View Applications

- See all your job applications in a table
- Edit application details
- Update application status
- Delete applications

### Customize Resume

- Select a job from your applications or enter a new job description
- Upload your resume (or use the one you've already uploaded)
- Get AI-powered suggestions for tailoring your resume to the job
- Download the customized resume

### Generate Cover Letter

- Select a job from your applications or enter new job details
- Generate a professional cover letter tailored to the job description
- Preview the cover letter text
- Download the cover letter as a DOCX file

## Data Storage

- All job application data is stored in a local SQLite database (`job_applications.db`)
- Resumes and cover letters are saved in the `resumes` and `cover_letters` folders

## Troubleshooting

- **Ollama Connection Issues**: Make sure Ollama is running before using the resume customization or cover letter generation features
- **File Upload Problems**: Ensure your resume is in DOCX format
- **Database Errors**: If you encounter database issues, try restarting the application

## License

This project is open source and available under the MIT License.
