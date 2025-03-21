import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Divider,
    Alert,
    Snackbar,
    CircularProgress,
    Paper,
    Breadcrumbs,
    Link,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Description as DescriptionIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
    getApplication,
    customizeResume,
    uploadResume,
    getDocumentUrl,
    getResumes
} from '../services/apiService';

const ResumeBuilder = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const jobId = queryParams.get('job_id');
    const queryClient = useQueryClient();

    // State for form values
    const [jobDescription, setJobDescription] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [position, setPosition] = useState('');

    // File upload state
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeFileName, setResumeFileName] = useState('');
    const [selectedResumePath, setSelectedResumePath] = useState('');

    // Results state
    const [customizedResumePath, setCustomizedResumePath] = useState('');
    const [suggestions, setSuggestions] = useState('');

    // Notification state
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Fetch job application data if job_id is provided
    const {
        data: application
    } = useQuery(
        ['application', jobId],
        () => getApplication(jobId),
        {
            enabled: !!jobId,
            onSuccess: (data) => {
                // Update form with job details
                setJobDescription(data.job_description || '');
                setCompanyName(data.company_name || '');
                setPosition(data.position || '');

                // If the application has a resume, set the filename
                if (data.resume_path) {
                    const filename = data.resume_path.split('/').pop();
                    setResumeFileName(filename);
                    setSelectedResumePath(data.resume_path);
                }
            }
        }
    );

    // Fetch available resumes
    const {
        data: availableResumes = [],
        isLoading: isLoadingResumes,
        error: resumesError
    } = useQuery(['resumes'], getResumes, {
        onSuccess: (data) => {
            console.log('Available resumes:', data);
        }
    });

    // Resume customization mutation
    const customizeMutation = useMutation(customizeResume, {
        onSuccess: (data) => {
            setCustomizedResumePath(data.document_path);
            setSuggestions(data.content_preview);
            setNotification({
                open: true,
                message: 'Resume customized successfully!',
                severity: 'success'
            });
        },
        onError: (error) => {
            setNotification({
                open: true,
                message: `Error customizing resume: ${error.message}`,
                severity: 'error'
            });
        }
    });

    // Handle resume file upload
    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setResumeFile(file);
            setResumeFileName(file.name);
            setSelectedResumePath('');  // Clear selected resume when uploading new one
        }
    };

    // Handle resume selection from dropdown
    const handleResumeSelection = (e) => {
        const path = e.target.value;
        if (path) {
            setSelectedResumePath(path);
            const filename = path.split('/').pop();
            setResumeFileName(filename);
            setResumeFile(null);  // Clear uploaded file when selecting from dropdown
        } else {
            setSelectedResumePath('');
            setResumeFileName('');
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!jobDescription) {
            setNotification({
                open: true,
                message: 'Please provide a job description',
                severity: 'error'
            });
            return;
        }

        // Prepare request data
        const requestData = {
            job_description: jobDescription,
            company_name: companyName,
            position: position
        };

        // If jobId is provided, use that
        if (jobId) {
            requestData.job_id = parseInt(jobId);
        }

        // Log debugging information
        console.log('Resume customization form submission:');
        console.log('- Job ID:', jobId);
        console.log('- Job description length:', jobDescription?.length);
        console.log('- Resume file:', resumeFile ? resumeFile.name : 'None');
        console.log('- Resume file name:', resumeFileName);
        console.log('- Application resume path:', application?.resume_path);
        console.log('- Request data:', requestData);

        try {
            // If a new resume was uploaded, customize with the new file
            if (resumeFile) {
                console.log('Using newly uploaded resume file');
                await customizeMutation.mutateAsync({
                    data: requestData,
                    file: resumeFile
                });
            }
            // If a resume was selected from the dropdown
            else if (selectedResumePath) {
                console.log('Using selected resume path:', selectedResumePath);
                // Add the resume path to the request data
                requestData.resume_path = selectedResumePath;
                await customizeMutation.mutateAsync({
                    data: requestData
                });
            }
            // Otherwise try to use existing resume if available from application
            else if (application?.resume_path) {
                console.log('Using existing resume path from application');
                // Add the resume path to the request data
                requestData.resume_path = application.resume_path;
                await customizeMutation.mutateAsync({
                    data: requestData
                });
            }
            // No resume available
            else {
                console.log('No resume available');
                setNotification({
                    open: true,
                    message: 'Please upload or select a resume',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Resume customization error:', error);
            // Error handled in mutation
        }
    };

    // Handle download of customized resume
    const handleDownload = () => {
        if (customizedResumePath) {
            const filename = customizedResumePath.split('/').pop();
            const downloadUrl = getDocumentUrl('resumes', filename);

            console.log('Downloading customized resume:');
            console.log('- Resume path:', customizedResumePath);
            console.log('- Extracted filename:', filename);
            console.log('- Download URL:', downloadUrl);

            // Create a temporary link element and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('No resume path available for download');
        }
    };

    // Handle notification close
    const handleCloseNotification = () => {
        setNotification({
            ...notification,
            open: false
        });
    };

    return (
        <Box>
            {/* Breadcrumbs navigation */}
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                <Link
                    underline="hover"
                    color="inherit"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    Dashboard
                </Link>
                {jobId && (
                    <Link
                        underline="hover"
                        color="inherit"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/applications/${jobId}`)}
                    >
                        {companyName ? `${companyName} - ${position}` : 'Application'}
                    </Link>
                )}
                <Typography color="text.primary">Resume Builder</Typography>
            </Breadcrumbs>

            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                Resume Customization
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Customize your resume to match the job description using AI assistance.
            </Typography>

            <Grid container spacing={3}>
                {/* Form section */}
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', mb: 3 }}>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Job Details
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    {/* Resume selection dropdown */}
                                    <Grid item xs={12}>
                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel id="resume-select-label">Select Resume</InputLabel>
                                            <Select
                                                labelId="resume-select-label"
                                                id="resume-select"
                                                value={selectedResumePath}
                                                onChange={handleResumeSelection}
                                                label="Select Resume"
                                                disabled={isLoadingResumes}
                                            >
                                                <MenuItem value=""><em>None</em></MenuItem>
                                                {availableResumes.map((resume) => (
                                                    <MenuItem key={resume.path} value={resume.path}>
                                                        {resume.filename}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Resume upload */}
                                    <Grid item xs={12}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                                Or upload a new resume:
                                            </Typography>
                                            <input
                                                accept=".docx"
                                                style={{ display: 'none' }}
                                                id="resume-file-input"
                                                type="file"
                                                onChange={handleResumeChange}
                                            />
                                            <label htmlFor="resume-file-input">
                                                <Button
                                                    variant="outlined"
                                                    component="span"
                                                    startIcon={<UploadIcon />}
                                                    sx={{ mb: 1 }}
                                                >
                                                    Upload Resume (DOCX)
                                                </Button>
                                            </label>
                                            {resumeFileName && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {resumeFile ? "New resume to upload" : "Selected resume"}: {resumeFileName}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>

                                    {/* Company Name */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Company Name"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Enter the company name"
                                            sx={{ mb: 2 }}
                                        />
                                    </Grid>

                                    {/* Job Title */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Job Title"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            placeholder="Enter the job title/position"
                                            sx={{ mb: 2 }}
                                        />
                                    </Grid>

                                    {/* Job description */}
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={12}
                                            label="Job Description"
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Paste the job description here..."
                                            required
                                        />
                                    </Grid>

                                    {/* Submit button */}
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                type="submit"
                                                disabled={customizeMutation.isLoading}
                                                startIcon={
                                                    customizeMutation.isLoading ?
                                                        <CircularProgress size={20} color="inherit" /> :
                                                        <DescriptionIcon />
                                                }
                                            >
                                                {customizeMutation.isLoading ? 'Customizing...' : 'Customize Resume'}
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Results section */}
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Customization Results
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {customizedResumePath ? (
                                <>
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Your resume has been customized for this job!
                                    </Alert>

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleDownload}
                                        sx={{ mb: 3 }}
                                    >
                                        Download Customized Resume
                                    </Button>

                                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                        AI Suggestions
                                    </Typography>

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            maxHeight: 350,
                                            overflow: 'auto',
                                            backgroundColor: '#f5f7fa',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                whiteSpace: 'pre-wrap',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            {suggestions}
                                        </Typography>
                                    </Paper>
                                </>
                            ) : (
                                <Alert severity="info">
                                    Customize your resume by providing a job description and clicking the "Customize Resume" button.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Back button */}
            <Box sx={{ mt: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => jobId ? navigate(`/applications/${jobId}`) : navigate('/applications')}
                >
                    Back to {jobId ? 'Application' : 'Applications'}
                </Button>
            </Box>

            {/* Notification */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ResumeBuilder;
