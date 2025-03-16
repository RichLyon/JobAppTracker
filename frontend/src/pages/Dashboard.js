import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    LinearProgress,
    Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format } from 'date-fns';
import { getApplicationStatistics, checkOllamaStatus } from '../services/apiService';

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

// Convert data for pie chart
const preparePieChartData = (statusCounts) => {
    return Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
    }));
};

// Convert data for bar chart
const prepareBarChartData = (applicationsByMonth) => {
    return Object.entries(applicationsByMonth)
        .map(([month, count]) => ({
            month: format(new Date(month + '-01'), 'MMM yyyy'),
            applications: count,
        }))
        .sort((a, b) => new Date(a.month) - new Date(b.month))
        .slice(-6); // Show last 6 months
};

const Dashboard = () => {
    const navigate = useNavigate();
    // Check if Ollama is available
    const { data: ollamaStatus, isLoading: ollamaLoading } = useQuery(
        'ollamaStatus',
        checkOllamaStatus,
        { retry: false }
    );

    // Get application statistics
    const {
        data: statistics,
        isLoading: statsLoading,
        error: statsError
    } = useQuery('applicationStatistics', getApplicationStatistics);

    // Prepare chart data
    const pieChartData = statistics ? preparePieChartData(statistics.status_counts) : [];
    const barChartData = statistics ? prepareBarChartData(statistics.applications_by_month) : [];

    if (statsLoading) {
        return <LinearProgress />;
    }

    if (statsError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading dashboard data: {statsError.message}
                </Alert>
                <Button variant="contained" onClick={() => navigate('/applications/add')}>
                    Add Your First Application
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                Dashboard
            </Typography>

            {/* Ollama status alert */}
            {ollamaStatus && ollamaStatus.status !== 'available' && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Ollama AI service is currently unavailable. AI-powered resume customization and cover letter generation might not work properly.
                </Alert>
            )}

            {/* No applications alert */}
            {statistics && statistics.total_applications === 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    You haven't added any job applications yet.
                    <Button
                        color="primary"
                        size="small"
                        onClick={() => navigate('/applications/add')}
                        sx={{ ml: 2 }}
                    >
                        Add Your First Application
                    </Button>
                </Alert>
            )}

            {/* Stats cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom variant="subtitle2">
                                Total Applications
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 600 }}>
                                {statistics ? statistics.total_applications : 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom variant="subtitle2">
                                Active Applications
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 600 }}>
                                {statistics ? (statistics.status_counts.Applied || 0) + (statistics.status_counts.Interviewing || 0) : 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom variant="subtitle2">
                                Interviews
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 600 }}>
                                {statistics ? statistics.status_counts.Interviewing || 0 : 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom variant="subtitle2">
                                Offers
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 600 }}>
                                {statistics ? statistics.status_counts.Offer || 0 : 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            {statistics && statistics.total_applications > 0 && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Pie chart */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Application Status
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#808080'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [value, 'Applications']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Bar chart */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Applications Over Time
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={barChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip formatter={(value) => [value, 'Applications']} />
                                        <Bar dataKey="applications" fill={statusColors.Applied} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Recent applications */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Recent Applications</Typography>
                    <Button variant="outlined" size="small" onClick={() => navigate('/applications')}>
                        View All
                    </Button>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                    <Table sx={{ minWidth: 650 }} aria-label="recent applications table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Company</TableCell>
                                <TableCell>Position</TableCell>
                                <TableCell>Date Applied</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {statistics && statistics.recent_applications.length > 0 ? (
                                statistics.recent_applications.map((application) => (
                                    <TableRow
                                        key={application.id}
                                        hover
                                        onClick={() => navigate(`/applications/${application.id}`)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Typography variant="body2" fontWeight={500}>
                                                {application.company_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{application.position}</TableCell>
                                        <TableCell>{application.date_applied}</TableCell>
                                        <TableCell>
                                            <StatusChip status={application.status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No applications found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default Dashboard;
