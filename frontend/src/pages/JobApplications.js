import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
    Box,
    Typography,
    Card,
    TextField,
    Button,
    IconButton,
    Chip,
    Tooltip,
    Menu,
    MenuItem,
    Grid,
    InputAdornment,
    LinearProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { getApplications, deleteApplication } from '../services/apiService';
import { format } from 'date-fns';

// Status colors
const statusColors = {
    Applied: '#3b82f6',      // Blue
    Interviewing: '#8b5cf6', // Violet
    Rejected: '#ef4444',     // Red
    Offer: '#10b981',        // Green
    Accepted: '#047857',     // Dark Green
    Declined: '#f59e0b',     // Amber
};

// Status chip component
const StatusChip = ({ status }) => {
    return (
        <Chip
            label={status}
            size="small"
            sx={{
                backgroundColor: statusColors[status] + '20',
                color: statusColors[status],
                fontWeight: 500,
                borderRadius: '4px',
            }}
        />
    );
};

const JobApplications = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);

    // Fetch job applications
    const {
        data: applications,
        isLoading,
        error,
        refetch
    } = useQuery(['applications', { search: searchTerm, status: statusFilter }],
        () => getApplications({ search: searchTerm, status: statusFilter })
    );

    const handleFilterMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleFilterMenuClose = () => {
        setAnchorEl(null);
    };

    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        handleFilterMenuClose();
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
    };

    const handleDeleteClick = (application) => {
        setApplicationToDelete(application);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteApplication(applicationToDelete.id);
            refetch();
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error deleting application:', error);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setApplicationToDelete(null);
    };

    // DataGrid columns
    const columns = [
        {
            field: 'company_name',
            headerName: 'Company',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" fontWeight={500}>
                        {params.value}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'position',
            headerName: 'Position',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'date_applied',
            headerName: 'Date Applied',
            flex: 0.8,
            minWidth: 120,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.value ? format(new Date(params.value), 'MMM d, yyyy') : ''}
                </Typography>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 0.7,
            minWidth: 120,
            renderCell: (params) => <StatusChip status={params.value} />,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.7,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="View">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/applications/${params.row.id}`)}
                        >
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/applications/${params.row.id}`)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(params.row)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    // Loading state
    if (isLoading) {
        return <LinearProgress />;
    }

    // Error state
    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading applications: {error.message}
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    Job Applications
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/applications/add')}
                >
                    Add Application
                </Button>
            </Box>

            {/* Search and filter bar */}
            <Card
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 2
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search applications..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            variant="outlined"
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={handleFilterMenuOpen}
                            endIcon={statusFilter && <Chip label={statusFilter} size="small" onDelete={() => setStatusFilter('')} />}
                            size="medium"
                            sx={{ height: '40px' }}
                        >
                            {statusFilter ? 'Filtered by Status' : 'Filter by Status'}
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={menuOpen}
                            onClose={handleFilterMenuClose}
                        >
                            {['Applied', 'Interviewing', 'Rejected', 'Offer', 'Accepted', 'Declined'].map((status) => (
                                <MenuItem
                                    key={status}
                                    onClick={() => handleStatusFilterChange(status)}
                                    selected={statusFilter === status}
                                >
                                    <StatusChip status={status} />
                                </MenuItem>
                            ))}
                            <MenuItem onClick={() => handleStatusFilterChange('')}>
                                <Typography color="textSecondary">Clear Filter</Typography>
                            </MenuItem>
                        </Menu>
                    </Grid>

                    {(searchTerm || statusFilter) && (
                        <Grid item>
                            <Button
                                variant="text"
                                startIcon={<ClearIcon />}
                                onClick={clearFilters}
                                size="small"
                            >
                                Clear All Filters
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Card>

            {/* Applications table */}
            <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={applications || []}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    checkboxSelection
                    disableSelectionOnClick
                    sx={{
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f9fafb',
                            fontWeight: 600,
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: '#f9fafb',
                        },
                    }}
                />
            </div>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the application for{' '}
                        <strong>
                            {applicationToDelete?.position} at {applicationToDelete?.company_name}
                        </strong>
                        ? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default JobApplications;
