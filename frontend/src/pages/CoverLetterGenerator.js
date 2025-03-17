import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
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
} from '@mui/material';
import {
    Description as DescriptionIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    ArrowBack as ArrowBackIcon,
    Mail as MailIcon,
} from '@mui/icons-material';
import {
    getApplication,
    generateCoverLetter,
    uploadResume,
    getDocumentUrl
} from '../services/apiService';

const CoverLetterGenerator = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const jobId = queryParams.get('job_id');

    // State for form values
    const [jobDescription, setJobDescription] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [position, setPosition] = useState('');

    // File upload state
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeFileName, setResumeFileName] = useState('');

    // Results state
    const [coverLetterPath, setCoverLetterPath] = useState('');
    const [coverLetterText, setCoverLetterText] = useState('');

    // Notification state
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Fetch job application data if job_id is provided
    const {
        data: application,
        isLoading: isLoadingApplication
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
                }
            }
        }
    );

    // Resume upload mutation
    const resumeUploadMutation = useMutation(uploadResume, {
        onError: (error) => {
            setNotification({
                open: true,
                message: `Error uploading resume: ${error.message}`,
                severity: 'error'
            });
        }
    });

    // Cover letter generation mutation
    const generateMutation = useMutation(generateCoverLetter, {
        onSuccess: (data) => {
            setCoverLetterPath(data.document_path);
            setCoverLetterText(data.content_preview);
            setNotification({
                open: true,
                message: 'Cover letter generated successfully!',
                severity: 'success'
            });
        },
        onError: (error) => {
            setNotification({
                open: true,
                message: `Error generating cover letter: ${error.message}`,
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
        }
    };

    // Validate form inputs
    const validateForm = () => {
        if (!jobDescription) {
            setNotification({
                open: true,
                message: 'Please provide a job description',
                severity: 'error'
            });
            return false;
        }

        if (!companyName) {
            setNotification({
                open: true,
                message: 'Please provide a company name',
                severity: 'error'
            });
            return false;
        }

        if (!position) {
            setNotification({
                open: true,
                message: 'Please provide a position title',
                severity: 'error'
            });
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
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
        console.log('Cover letter generation form submission:');
        console.log('- Job ID:', jobId);
        console.log('- Company name:', companyName);
        console.log('- Position:', position);
        console.log('- Job description length:', jobDescription?.length);
        console.log('- Resume file:', resumeFile ? resumeFile.name : 'None');
        console.log('- Resume file name:', resumeFileName);
        console.log('- Application resume path:', application?.resume_path);
        console.log('- Request data:', requestData);

        try {
            // If a new resume was uploaded, generate with the new file
            if (resumeFile) {
                console.log('Using newly uploaded resume file');
                await generateMutation.mutateAsync({
                    data: requestData,
                    file: resumeFile
                });
            }
            // Otherwise try to use existing resume if available
            else if (application?.resume_path || resumeFileName) {
                console.log('Using existing resume path from application');
                if (application?.resume_path) {
                    // Add the resume path to the request data
                    requestData.resume_path = application.resume_path;
                }
                await generateMutation.mutateAsync({
                    data: requestData
                });
            }
            // No resume available
            else {
                console.log('No resume available');
                setNotification({
                    open: true,
                    message: 'Please upload a resume',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Cover letter generation error:', error);
            // Error handled in mutation
        }
    };

    // Handle download of cover letter
    const handleDownload = () => {
        if (coverLetterPath) {
            const filename = coverLetterPath.split('/').pop();
            const downloadUrl = getDocumentUrl('cover-letters', filename);

            console.log('Downloading cover letter:');
            console.log('- Cover letter path:', coverLetterPath);
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
            console.error('No cover letter path available for download');
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
                <Typography color="text.primary">Cover Letter Generator</Typography>
            </Breadcrumbs>

            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                Cover Letter Generator
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Generate a targeted cover letter based on your resume and the job description.
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
                                    {/* Resume upload */}
                                    <Grid item xs={12}>
                                        <Box sx={{ mb: 2 }}>
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
                                                        Selected resume: {resumeFileName}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>

                                    {/* Company and position */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Company Name"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            required
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Position"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            required
                                        />
                                    </Grid>

                                    {/* Job description */}
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={10}
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
                                                disabled={generateMutation.isLoading}
                                                startIcon={
                                                    generateMutation.isLoading ?
                                                        <CircularProgress size={20} color="inherit" /> :
                                                        <MailIcon />
                                                }
                                            >
                                                {generateMutation.isLoading ? 'Generating...' : 'Generate Cover Letter'}
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
                                Generated Cover Letter
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {coverLetterPath ? (
                                <>
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Your cover letter has been generated!
                                    </Alert>

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleDownload}
                                        sx={{ mb: 3 }}
                                    >
                                        Download Cover Letter
                                    </Button>

                                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                        Preview
                                    </Typography>

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            maxHeight: 400,
                                            overflow: 'auto',
                                            backgroundColor: '#f5f7fa',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                whiteSpace: 'pre-wrap',
                                                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                                                fontSize: '0.875rem',
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {coverLetterText}
                                        </Typography>
                                    </Paper>
                                </>
                            ) : (
                                <Alert severity="info">
                                    Generate a cover letter by providing job details and clicking the "Generate Cover Letter" button.
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

export default CoverLetterGenerator;
