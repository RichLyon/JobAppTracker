import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Box,
    Toolbar,
    useTheme
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    WorkOutline as JobsIcon,
    Add as AddIcon,
    Description as ResumeIcon,
    Mail as MailIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Drawer width
const drawerWidth = 240;

const Sidebar = ({ drawerOpen, toggleDrawer }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
        { text: 'Applications', icon: <JobsIcon />, path: '/applications' },
        { text: 'Add Application', icon: <AddIcon />, path: '/applications/add' },
        { text: 'Resume Builder', icon: <ResumeIcon />, path: '/resume-builder' },
        { text: 'Cover Letter', icon: <MailIcon />, path: '/cover-letter' },
        { text: 'AI Settings', icon: <SettingsIcon />, path: '/ai-settings' },
    ];

    const drawer = (
        <div>
            <Toolbar />
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (window.innerWidth < 900) {
                                    toggleDrawer();
                                }
                            }}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.primary.light + '20',
                                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.light + '30',
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light + '10',
                                },
                                pl: location.pathname === item.path ? 2 : 3,
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    fontWeight: location.pathname === item.path ? 600 : 400,
                                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2, mt: 2 }}>
                <Box
                    sx={{
                        p: 2,
                        backgroundColor: theme.palette.secondary.light + '30',
                        borderRadius: 1,
                        borderLeft: `4px solid ${theme.palette.secondary.main}`,
                    }}
                >
                    <Box sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 0.5, color: theme.palette.secondary.dark }}>
                        Job Tracker
                    </Box>
                    <Box sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                        Track your job applications, customize resumes, and generate cover letters.
                    </Box>
                </Box>
            </Box>
        </div>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="mailbox folders"
        >
            {/* Mobile drawer */}
            <Drawer
                variant="temporary"
                open={drawerOpen}
                onClose={toggleDrawer}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawer}
            </Drawer>

            {/* Desktop drawer */}
            <Drawer
                variant="persistent"
                open={drawerOpen}
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: 'none'
                    },
                }}
            >
                {drawer}
            </Drawer>
        </Box>
    );
};

export default Sidebar;
