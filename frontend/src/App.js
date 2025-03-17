import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Theme
import theme from './theme';

// Layout components
import AppHeader from './components/layout/AppHeader';
import Sidebar from './components/layout/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import JobApplications from './pages/JobApplications';
import AddApplication from './pages/AddApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import ResumeBuilder from './pages/ResumeBuilder';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import AISettings from './pages/AISettings';

// Create Query Client for React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    // State for controlling sidebar visibility
    const [drawerOpen, setDrawerOpen] = useState(true);

    // Toggle drawer open/closed
    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                        <CssBaseline />

                        {/* App Header */}
                        <AppHeader drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />

                        {/* Sidebar Navigation */}
                        <Sidebar drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />

                        {/* Main Content */}
                        <Box
                            component="main"
                            sx={{
                                flexGrow: 1,
                                p: 3,
                                width: { sm: `calc(100% - ${drawerOpen ? 240 : 0}px)` },
                                ml: { sm: drawerOpen ? '240px' : 0 },
                                mt: '64px', // Account for app bar height
                                transition: (theme) =>
                                    theme.transitions.create(['width', 'margin'], {
                                        easing: theme.transitions.easing.sharp,
                                        duration: theme.transitions.duration.enteringScreen,
                                    }),
                            }}
                        >
                            <Routes>
                                {/* Dashboard */}
                                <Route path="/" element={<Dashboard />} />

                                {/* User Profile */}
                                <Route path="/profile" element={<UserProfile />} />

                                {/* Applications Routes */}
                                <Route path="/applications" element={<JobApplications />} />
                                <Route path="/applications/add" element={<AddApplication />} />
                                <Route path="/applications/:id" element={<ApplicationDetail />} />

                                {/* Tools Routes */}
                                <Route path="/resume-builder" element={<ResumeBuilder />} />
                                <Route path="/cover-letter" element={<CoverLetterGenerator />} />
                                <Route path="/ai-settings" element={<AISettings />} />

                                {/* Redirect for unknown routes */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Box>
                    </Box>
                </LocalizationProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
