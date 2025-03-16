import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    MenuItem,
    FormHelperText,
    Divider,
    Alert,
    Snackbar,
    CircularProgress,
    Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { createApplication, uploadResume } from '../services/apiService';

// Application status options
const statusOptions = [
    { value: 'Applied', label: 'Applied' },
    { value: 'Interviewing', label: 'Interviewing' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Offer', label: 'Offer' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Declined', label: 'Declined' },
];

const AddApplication = () => {
    const navigate = useNavigate();

    // Form state
    const [formValues, setFormValues] = useState({
        company_name: '',
        position: '',
        status: 'Applied',
        date_applied: format(new Date(), 'yyyy-MM-dd'),
        job_description: '',
        salary_info: '',
        contact_info: '',
        application_url: '',
        notes: '',
    });

    // File upload state
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeFileName, setResumeFileName] = useState('');

    // Form validation
    const [errors, setErrors] = useState({});

    // Notification state
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Resume upload mutation
    const resumeUploadMutation = useMutation(uploadResume, {
        onError: (error) => {
            console.error('Resume upload error:', error);
            setNotification({
                open: true,
                message: `Error uploading resume: ${error.message}`,
                severity: 'error'
            });
        }
    });

    // Create application mutation
    const createApplicationMutation = useMutation(createApplication, {
        onSuccess: (data) => {
            setNotification({
                open: true,
                message: 'Job application added successfully!',
                severity: 'success'
            });

            // Navigate to the applications list after a short delay
            setTimeout(() => {
                navigate('/applications');
            }, 1500);
        },
        onError: (error) => {
            setNotification({
                open: true,
                message: `Error creating application: ${error.message}`,
                severity: 'error'
            });
        }
    });

    // Handle text input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });

        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: undefined });
        }
    };

    // Handle date change
    const handleDateChange = (date) => {
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            setFormValues({ ...formValues, date_applied: formattedDate });

            // Clear error for this field
            if (errors.date_applied) {
                setErrors({ ...errors, date_applied: undefined });
            }
        } catch (error) {
            console.error('Date format error:', error);
        }
    };

    // Handle resume file upload
    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setResumeFile(file);
            setResumeFileName(file.name);
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formValues.company_name) {
            newErrors.company_name = 'Company name is required';
        }

        if (!formValues.position) {
            newErrors.position = 'Position is required';
        }

        if (!formValues.date_applied) {
            newErrors.date_applied = 'Application date is required';
        }

        if (!formValues.status) {
            newErrors.status = 'Status is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // First upload resume if provided
        let resumePath = null;

        if (resumeFile) {
            try {
                const resumeData = await resumeUploadMutation.mutateAsync(resumeFile);
                resumePath = resumeData.path;
            } catch (error) {
                // Error already handled in the mutation
                return;
            }
        }

        // Create application with resume path
        const applicationData = {
            ...formValues,
            resume_path: resumePath
        };

        createApplicationMutation.mutate(applicationData);
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                Add Job Application
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Track a new job application by filling out the details below.
            </Typography>

            <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', mb: 4 }}>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Basic Job Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Job Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Company Name"
                                    name="company_name"
                                    value={formValues.company_name}
                                    onChange={handleInputChange}
                                    error={!!errors.company_name}
                                    helperText={errors.company_name}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Position"
                                    name="position"
                                    value={formValues.position}
                                    onChange={handleInputChange}
                                    error={!!errors.position}
                                    helperText={errors.position}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Date Applied"
                                        value={new Date(formValues.date_applied)}
                                        onChange={handleDateChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                required
                                                error={!!errors.date_applied}
                                                helperText={errors.date_applied}
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    label="Application Status"
                                    name="status"
                                    value={formValues.status}
                                    onChange={handleInputChange}
                                    error={!!errors.status}
                                    helperText={errors.status}
                                >
                                    {statusOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="Job Description"
                                    name="job_description"
                                    value={formValues.job_description}
                                    onChange={handleInputChange}
                                    placeholder="Paste the job description here..."
                                    helperText="Used for resume customization and cover letter generation"
                                />
                            </Grid>

                            {/* Additional Information */}
                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Additional Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Salary Information"
                                    name="salary_info"
                                    value={formValues.salary_info}
                                    onChange={handleInputChange}
                                    placeholder="e.g., $80,000 - $100,000 per year"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact Information"
                                    name="contact_info"
                                    value={formValues.contact_info}
                                    onChange={handleInputChange}
                                    placeholder="e.g., John Doe, Hiring Manager, john.doe@company.com"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Application URL"
                                    name="application_url"
                                    value={formValues.application_url}
                                    onChange={handleInputChange}
                                    placeholder="e.g., https://company.com/careers/job-id"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Box>
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
                                            sx={{ mb: 1 }}
                                        >
                                            Upload Resume (DOCX)
                                        </Button>
                                    </label>
                                    {resumeFileName && (
                                        <Typography variant="body2" color="textSecondary">
                                            Selected file: {resumeFileName}
                                        </Typography>
                                    )}
                                    <FormHelperText>
                                        Upload your resume to associate with this application
                                    </FormHelperText>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Notes"
                                    name="notes"
                                    value={formValues.notes}
                                    onChange={handleInputChange}
                                    placeholder="Any additional notes about this application..."
                                />
                            </Grid>

                            {/* Submit Button */}
                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/applications')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={createApplicationMutation.isLoading || resumeUploadMutation.isLoading}
                                        startIcon={
                                            (createApplicationMutation.isLoading || resumeUploadMutation.isLoading) ?
                                                <CircularProgress size={20} /> : null
                                        }
                                    >
                                        Save Application
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>

            {/* Notification Snackbar */}
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

export default AddApplication;
