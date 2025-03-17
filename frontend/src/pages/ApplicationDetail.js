import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Tabs,
    Tab,
    TextField,
    Button,
    Grid,
    MenuItem,
    Divider,
    Alert,
    Snackbar,
    CircularProgress,
    Breadcrumbs,
    Link,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    InputLabel,
    Select,
    FormHelperText
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon,
    Description as DescriptionIcon,
    Mail as MailIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import {
    getApplication,
    updateApplication,
    deleteApplication,
    uploadResume,
    getResumes,
    getResumeFilenameFromPath
} from '../services/apiService';

// Application status options
const statusOptions = [
    { value: 'Applied', label: 'Applied' },
    { value: 'Interviewing', label: 'Interviewing' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Offer', label: 'Offer' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Declined', label: 'Declined' },
];

// Status colors
const statusColors = {
    Applied: '#3b82f6',      // Blue
    Interviewing: '#8b5cf6', // Violet
    Rejected: '#ef4444',     // Red
    Offer: '#10b981',        // Green
    Accepted: '#047857',     // Dark Green
    Declined: '#f59e0b',     // Amber
};

const ApplicationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // State for tabs
    const [activeTab, setActiveTab] = useState(0);

    // State for edit mode
    const [isEditing, setIsEditing] = useState(false);

    // State for form values
    const [formValues, setFormValues] = useState({
        company_name: '',
        position: '',
        date_applied: '',
        status: '',
        job_description: '',
        salary_info: '',
        contact_info: '',
        application_url: '',
        notes: '',
        uploaded_resume_path: '',
    });

    // File upload state
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeFileName, setResumeFileName] = useState('');

    // Fetch available resumes
    const { data: resumes, isLoading: loadingResumes } = useQuery('userResumes', getResumes);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Notification state
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Fetch application data
    const {
        data: application,
        isLoading,
        error
    } = useQuery(['application', id], () => getApplication(id), {
        onSuccess: (data) => {
            // Update form values when data is loaded
            setFormValues({
                company_name: data.company_name || '',
                position: data.position || '',
                date_applied: data.date_applied || '',
                status: data.status || '',
                job_description: data.job_description || '',
                salary_info: data.salary_info || '',
                contact_info: data.contact_info || '',
                application_url: data.application_url || '',
                notes: data.notes || '',
                uploaded_resume_path: data.uploaded_resume_path || '',
            });

            // Set resume filename if exists
            if (data.resume_path) {
                const filename = data.resume_path.split('/').pop();
                setResumeFileName(filename);
            }
        }
    });

    // Update application mutation
    const updateMutation = useMutation(
        (data) => updateApplication(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['application', id]);
                setIsEditing(false);
                setNotification({
                    open: true,
                    message: 'Application updated successfully',
                    severity: 'success'
                });
            },
            onError: (error) => {
                setNotification({
                    open: true,
                    message: `Error updating application: ${error.message}`,
                    severity: 'error'
                });
            }
        }
    );

    // Delete application mutation
    const deleteMutation = useMutation(
        () => deleteApplication(id),
        {
            onSuccess: () => {
                setNotification({
                    open: true,
                    message: 'Application deleted successfully',
                    severity: 'success'
                });

                // Navigate back to applications list after a short delay
                setTimeout(() => {
                    navigate('/applications');
                }, 1500);
            },
            onError: (error) => {
                setNotification({
                    open: true,
                    message: `Error deleting application: ${error.message}`,
                    severity: 'error'
                });
            }
        }
    );

    // Resume upload mutation
    const resumeUploadMutation = useMutation(
        uploadResume,
        {
            onSuccess: (data) => {
                updateMutation.mutate({
                    ...formValues,
                    resume_path: data.path
                });
            },
            onError: (error) => {
                setNotification({
                    open: true,
                    message: `Error uploading resume: ${error.message}`,
                    severity: 'error'
                });
            }
        }
    );

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle text input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value
        });
    };

    // Handle date change
    const handleDateChange = (date) => {
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            setFormValues({
                ...formValues,
                date_applied: formattedDate
            });
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

    // Handle save changes
    const handleSave = async () => {
        // If a new resume was uploaded, upload it first
        if (resumeFile) {
            await resumeUploadMutation.mutateAsync(resumeFile);
        } else {
            // Otherwise, just update the application with current values
            updateMutation.mutate(formValues);
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        // Reset form values to current application data
        if (application) {
            setFormValues({
                company_name: application.company_name || '',
                position: application.position || '',
                date_applied: application.date_applied || '',
                status: application.status || '',
                job_description: application.job_description || '',
                salary_info: application.salary_info || '',
                contact_info: application.contact_info || '',
                application_url: application.application_url || '',
                notes: application.notes || '',
                uploaded_resume_path: application.uploaded_resume_path || '',
            });

            // Reset resume file
            setResumeFile(null);
            if (application.resume_path) {
                const filename = application.resume_path.split('/').pop();
                setResumeFileName(filename);
            } else {
                setResumeFileName('');
            }
        }

        setIsEditing(false);
    };

    // Handle delete dialog
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        deleteMutation.mutate();
        setDeleteDialogOpen(false);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    // Handle notification close
    const handleCloseNotification = () => {
        setNotification({
            ...notification,
            open: false
        });
    };

    // Handle resume customizer navigation
    const handleResumeCustomizer = () => {
        navigate(`/resume-builder?job_id=${id}`);
    };

    // Handle cover letter generator navigation
    const handleCoverLetterGenerator = () => {
        navigate(`/cover-letter?job_id=${id}`);
    };

    // Loading state
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading application: {error.message}
            </Alert>
        );
    }

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
                <Link
                    underline="hover"
                    color="inherit"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate('/applications')}
                >
                    Applications
                </Link>
                <Typography color="text.primary">
                    {application?.company_name} - {application?.position}
                </Typography>
            </Breadcrumbs>

            {/* Application header */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {application?.position}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        {application?.company_name}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={application?.status}
                            sx={{
                                backgroundColor: statusColors[application?.status] + '20',
                                color: statusColors[application?.status],
                                fontWeight: 500,
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            Applied: {application?.date_applied ? format(new Date(application.date_applied), 'MMMM d, yyyy') : 'N/A'}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isEditing ? (
                        <>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={updateMutation.isLoading || resumeUploadMutation.isLoading}
                            >
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={() => setIsEditing(true)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleDeleteClick}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Tab navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="application tabs"
                >
                    <Tab label="Details" id="tab-0" />
                    <Tab label="Documents" id="tab-1" />
                    <Tab label="Timeline" id="tab-2" />
                </Tabs>
            </Box>

            {/* Details tab */}
            {activeTab === 0 && (
                <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', mb: 4 }}>
                    <CardContent>
                        <Grid container spacing={3}>
                            {/* Basic Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Job Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Company Name"
                                    name="company_name"
                                    value={formValues.company_name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Position"
                                    name="position"
                                    value={formValues.position}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Date Applied"
                                        value={formValues.date_applied ? new Date(formValues.date_applied) : null}
                                        onChange={handleDateChange}
                                        disabled={!isEditing}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                required
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    name="status"
                                    value={formValues.status}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    required
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
                                    disabled={!isEditing}
                                    placeholder="Paste the job description here..."
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
                                    disabled={!isEditing}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact Information"
                                    name="contact_info"
                                    value={formValues.contact_info}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Application URL"
                                    name="application_url"
                                    value={formValues.application_url}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
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
                                    disabled={!isEditing}
                                    placeholder="Any additional notes about this application..."
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Documents tab */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    {/* Resume section */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Resume
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                {isEditing ? (
                                    <>
                                        <Box sx={{ mb: 3 }}>
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
                                                    Upload New Resume (DOCX)
                                                </Button>
                                            </label>
                                            {resumeFileName && (
                                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                                    Selected file: {resumeFileName}
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Select from existing resumes */}
                                        <FormControl fullWidth sx={{ mb: 3 }}>
                                            <InputLabel id="uploaded-resume-label">Select Existing Resume</InputLabel>
                                            <Select
                                                labelId="uploaded-resume-label"
                                                id="uploaded-resume-select"
                                                value={formValues.uploaded_resume_path || ''}
                                                label="Select Existing Resume"
                                                onChange={(e) => handleInputChange({
                                                    target: { name: 'uploaded_resume_path', value: e.target.value }
                                                })}
                                                disabled={loadingResumes}
                                            >
                                                <MenuItem value="">
                                                    <em>None</em>
                                                </MenuItem>
                                                {resumes && resumes.map((resume, index) => (
                                                    <MenuItem key={index} value={resume.path}>
                                                        {resume.filename}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            <FormHelperText>
                                                Choose which resume you used for this application
                                            </FormHelperText>
                                        </FormControl>
                                    </>
                                ) : (
                                    <Box>
                                        {/* Display the uploaded resume information */}
                                        {application?.uploaded_resume_path ? (
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    Used Resume: {getResumeFilenameFromPath(application.uploaded_resume_path)}
                                                </Typography>
                                                <Button
                                                    variant="outlined"
                                                    href={`/api/resumes/${getResumeFilenameFromPath(application.uploaded_resume_path)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Download Used Resume
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Alert severity="info" sx={{ mb: 3 }}>
                                                No uploaded resume associated with this application.
                                            </Alert>
                                        )}

                                        {/* Display the AI-customized resume information */}
                                        {application?.resume_path ? (
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    Customized Resume: {resumeFileName}
                                                </Typography>
                                                <Button
                                                    variant="outlined"
                                                    href={`/api/resumes/${resumeFileName}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Download Customized Resume
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Alert severity="info" sx={{ mb: 3 }}>
                                                No customized resume attached to this application.
                                            </Alert>
                                        )}
                                    </Box>
                                )}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    startIcon={<DescriptionIcon />}
                                    onClick={handleResumeCustomizer}
                                    sx={{ mt: 2 }}
                                >
                                    Customize Resume for This Job
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Cover letter section */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Cover Letter
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                {application?.cover_letter_path ? (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            Current Cover Letter: {application.cover_letter_path.split('/').pop()}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            href={`/api/cover-letters/${application.cover_letter_path.split('/').pop()}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Download Cover Letter
                                        </Button>
                                    </Box>
                                ) : (
                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        No cover letter attached to this application.
                                    </Alert>
                                )}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    startIcon={<MailIcon />}
                                    onClick={handleCoverLetterGenerator}
                                    sx={{ mt: 2 }}
                                >
                                    Generate Cover Letter for This Job
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Timeline tab */}
            {activeTab === 2 && (
                <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Application Timeline
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Alert severity="info">
                            Timeline feature coming soon!
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this application for{' '}
                        <strong>
                            {application?.position} at {application?.company_name}
                        </strong>
                        ? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleteMutation.isLoading}
                        startIcon={deleteMutation.isLoading ? <CircularProgress size={20} /> : null}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

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

export default ApplicationDetail;
