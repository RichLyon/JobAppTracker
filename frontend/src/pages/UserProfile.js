import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import {
    PersonOutline as PersonIcon,
    FileUpload as FileUploadIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { getUserInfo, updateUserInfo, uploadResume, getResumes, getDocumentUrl, deleteResume } from '../services/apiService';

const UserProfile = () => {
    const queryClient = useQueryClient();
    const [formValues, setFormValues] = useState({
        full_name: '',
        address: '',
        phone: '',
        email: ''
    });
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [selectedResumeFile, setSelectedResumeFile] = useState(null);

    // Fetch user info
    const { isLoading, error } = useQuery('userInfo', getUserInfo, {
        onSuccess: (data) => {
            // Only update form values if actual data is returned
            if (data && data.full_name !== undefined) {
                setFormValues({
                    full_name: data.full_name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || ''
                });
            }
        }
    });

    // Mutation for updating user info
    const mutation = useMutation(updateUserInfo, {
        onSuccess: () => {
            queryClient.invalidateQueries('userInfo');
            setNotification({
                open: true,
                message: 'Profile updated successfully!',
                severity: 'success'
            });
        },
        onError: (error) => {
            setNotification({
                open: true,
                message: `Error updating profile: ${error.message}`,
                severity: 'error'
            });
        }
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formValues.full_name || !formValues.email) {
            setNotification({
                open: true,
                message: 'Name and email are required',
                severity: 'error'
            });
            return;
        }

        // Submit form
        mutation.mutate(formValues);
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading profile: {error.message}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                User Profile
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Your profile information will be used in cover letters and other application documents.
            </Typography>

            <Grid container spacing={3}>
                {/* Profile form */}
                <Grid item xs={12} md={8}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Personal Information
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Full Name"
                                            name="full_name"
                                            value={formValues.full_name}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            helperText="Your complete name as it should appear on documents"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Address"
                                            name="address"
                                            value={formValues.address}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            multiline
                                            rows={2}
                                            helperText="Your complete address including city, state, and ZIP code"
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone Number"
                                            name="phone"
                                            value={formValues.phone}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Email Address"
                                            name="email"
                                            type="email"
                                            value={formValues.email}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                                size="large"
                                                disabled={mutation.isLoading}
                                                startIcon={mutation.isLoading ? <CircularProgress size={20} /> : null}
                                            >
                                                Save Changes
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Profile information */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            height: '100%'
                        }}
                    >
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.light',
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                }}
                            >
                                <PersonIcon sx={{ fontSize: 40 }} />
                            </Box>

                            <Typography variant="h6">
                                {formValues.full_name || 'Your Name'}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                {formValues.email || 'your.email@example.com'}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            This information will appear on:
                        </Typography>

                        <Box component="ul" sx={{ pl: 2 }}>
                            <Box component="li" sx={{ mb: 0.5 }}>
                                <Typography variant="body2">Cover letters</Typography>
                            </Box>
                            <Box component="li" sx={{ mb: 0.5 }}>
                                <Typography variant="body2">Application documents</Typography>
                            </Box>
                            <Box component="li">
                                <Typography variant="body2">Email templates</Typography>
                            </Box>
                        </Box>

                        <Alert severity="info" sx={{ mt: 3 }}>
                            Keep your contact information up to date to ensure employers can reach you.
                        </Alert>
                    </Paper>
                </Grid>
            </Grid>

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

            {/* Resume Management Section */}
            <Box sx={{ mt: 5 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                    My Resumes
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Upload your resumes to use when applying for jobs. These are separate from the AI-customized resumes.
                </Typography>

                <ResumesManager />
            </Box>
        </Box>
    );
};

// Resume management component
const ResumesManager = () => {
    const queryClient = useQueryClient();
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [resumeToDelete, setResumeToDelete] = useState(null);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Fetch user's uploaded resumes
    const { data: resumes, isLoading, error } = useQuery('userResumes', getResumes);

    // Resume upload mutation
    const uploadMutation = useMutation(uploadResume, {
        onSuccess: () => {
            queryClient.invalidateQueries('userResumes');
            setSelectedFile(null);
            setUploadError(null);
        },
        onError: (error) => {
            setUploadError(`Upload failed: ${error.message}`);
        }
    });

    // Resume delete mutation
    const deleteMutation = useMutation(deleteResume, {
        onSuccess: () => {
            queryClient.invalidateQueries('userResumes');
            setNotification({
                open: true,
                message: 'Resume deleted successfully',
                severity: 'success'
            });
        },
        onError: (error) => {
            setNotification({
                open: true,
                message: `Error deleting resume: ${error.message}`,
                severity: 'error'
            });
        }
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.docx')) {
                setUploadError('Please upload a Word document (.docx)');
                return;
            }
            setSelectedFile(file);
            setUploadError(null);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) {
            setUploadError('Please select a file to upload');
            return;
        }
        uploadMutation.mutate(selectedFile);
    };

    const handleDeleteClick = (resume) => {
        setResumeToDelete(resume);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (resumeToDelete) {
            deleteMutation.mutate(resumeToDelete.filename);
            setDeleteDialogOpen(false);
            setResumeToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setResumeToDelete(null);
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading resumes: {error.message}
            </Alert>
        );
    }

    return (
        <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Upload Resume
                </Typography>

                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<FileUploadIcon />}
                    >
                        Select File
                        <input
                            type="file"
                            hidden
                            accept=".docx"
                            onChange={handleFileChange}
                        />
                    </Button>

                    <Button
                        variant="contained"
                        disabled={!selectedFile || uploadMutation.isLoading}
                        onClick={handleUpload}
                        startIcon={uploadMutation.isLoading ? <CircularProgress size={20} /> : null}
                    >
                        Upload
                    </Button>

                    {selectedFile && (
                        <Typography variant="body2">
                            {selectedFile.name}
                        </Typography>
                    )}
                </Box>

                {uploadError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {uploadError}
                    </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ mb: 2 }}>
                    My Uploaded Resumes
                </Typography>

                {resumes && resumes.length > 0 ? (
                    <List>
                        {resumes.map((resume, index) => (
                            <ListItem key={index} divider={index < resumes.length - 1}>
                                <ListItemText
                                    primary={resume.filename}
                                    secondary={new Date(resume.created_at).toLocaleDateString()}
                                />
                                <ListItemSecondaryAction>
                                    <Box sx={{ display: 'flex' }}>
                                        <Tooltip title="Download">
                                            <IconButton
                                                edge="end"
                                                aria-label="download"
                                                href={getDocumentUrl('resumes', resume.filename)}
                                                target="_blank"
                                            >
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() => handleDeleteClick(resume)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No resumes uploaded yet. Upload your first resume to get started.
                    </Typography>
                )}

                <Alert severity="info" sx={{ mt: 3 }}>
                    Uploaded resumes can be selected when adding or editing job applications.
                </Alert>
            </CardContent>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the resume{' '}
                        <strong>
                            {resumeToDelete?.filename}
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
        </Card>
    );
};

export default UserProfile;
