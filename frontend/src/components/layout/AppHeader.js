import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon, Work as WorkIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const AppHeader = ({ drawerOpen, toggleDrawer }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: theme.zIndex.drawer + 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                backgroundColor: 'white',
                color: theme.palette.text.primary
            }}
        >
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="open drawer"
                    onClick={toggleDrawer}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <WorkIcon sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 28 }} />
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600, flexGrow: 1, color: theme.palette.primary.main }}>
                        {isMobile ? 'Job Tracker' : 'Job Application Tracker'}
                    </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => navigate('/applications/add')}
                        sx={{
                            fontWeight: 600,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                            }
                        }}
                    >
                        Add Application
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default AppHeader;
