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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    InputAdornment,
    CircularProgress,
    FormHelperText,
    Breadcrumbs,
    Link,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    getLLMSettings,
    updateLLMSettings,
    checkLLMAvailability,
} from '../services/apiService';

const AISettings = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // State for form values
    const [provider, setProvider] = useState('ollama');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [anthropicApiKey, setAnthropicApiKey] = useState('');
    const [openaiModel, setOpenaiModel] = useState('gpt-3.5-turbo');
    const [anthropicModel, setAnthropicModel] = useState('claude-3-haiku-20240307');
    const [ollamaModel, setOllamaModel] = useState('qwen2.5:14b');

    // State for showing/hiding API keys
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [showAnthropicKey, setShowAnthropicKey] = useState(false);

    // State for availability status - include all possible provider types
    const [availabilityStatus, setAvailabilityStatus] = useState({
        ollama: { checked: false, available: false, error: null },
        openai: { checked: false, available: false, error: null },
        anthropic: { checked: false, available: false, error: null },
    });

    // State for notification
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // OpenAI model options
    const openaiModels = [
        'gpt-4o-mini',
        'gpt-4o',
    ];

    // Anthropic model options
    const anthropicModels = [
        'claude-3-5-haiku-latest',
        'claude-3-5-sonnet-latest',
        'claude-3-7-sonnet-latest',
    ];

    // Ollama model options
    const ollamaModels = [
        'qwen2.5:14b',
        'llama3:70b',
        'llama3:8b',
        'mistral:7b',
        'mixtral:8x7b',
        'neural-chat',
    ];

    // State to track if keys were loaded from environment
    const [openaiKeyFromEnv, setOpenaiKeyFromEnv] = useState(false);
    const [anthropicKeyFromEnv, setAnthropicKeyFromEnv] = useState(false);

    // Fetch current LLM settings
    useQuery(
        'llmSettings',
        getLLMSettings,
        {
            onSuccess: (data) => {
                setProvider(data.provider);
                setOpenaiModel(data.models?.openai || 'gpt-3.5-turbo');
                setAnthropicModel(data.models?.anthropic || 'claude-3-haiku-20240307');
                setOllamaModel(data.models?.ollama || 'qwen2.5:14b');

                // Handle API keys - load from backend if they exist
                if (data.api_keys?.openai?.exists) {
                    setOpenaiApiKey(data.api_keys.openai.value);
                    setOpenaiKeyFromEnv(true);
                } else {
                    setOpenaiKeyFromEnv(false);
                }

                if (data.api_keys?.anthropic?.exists) {
                    setAnthropicApiKey(data.api_keys.anthropic.value);
                    setAnthropicKeyFromEnv(true);
                } else {
                    setAnthropicKeyFromEnv(false);
                }
            },
            onError: (error) => {
                setNotification({
                    open: true,
                    message: `Error loading settings: ${error.message}`,
                    severity: 'error'
                });
            }
        }
    );

    // Mutation for updating settings
    const updateSettingsMutation = useMutation(updateLLMSettings, {
        onSuccess: () => {
            setNotification({
                open: true,
                message: 'Settings updated successfully!',
                severity: 'success'
            });
            // Refresh settings data
            queryClient.invalidateQueries('llmSettings');
        },
        onError: (error) => {
            setNotification({
                open: true,
                message: `Error updating settings: ${error.message}`,
                severity: 'error'
            });
        }
    });

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare settings update
        const settingsUpdate = {
            provider,
        };

        // Only include API keys if they're not empty
        if (openaiApiKey) {
            settingsUpdate.openai_api_key = openaiApiKey;
        }

        if (anthropicApiKey) {
            settingsUpdate.anthropic_api_key = anthropicApiKey;
        }

        // Include model selections
        settingsUpdate.openai_model = openaiModel;
        settingsUpdate.anthropic_model = anthropicModel;
        settingsUpdate.ollama_model = ollamaModel;

        // Update settings
        updateSettingsMutation.mutate(settingsUpdate);
    };

    // Check availability of the selected provider
    const checkAvailability = async (providerToCheck) => {
        setAvailabilityStatus(prev => ({
            ...prev,
            [providerToCheck]: {
                ...prev[providerToCheck],
                checked: true,
                available: false,
                error: null
            }
        }));

        try {
            const result = await checkLLMAvailability(providerToCheck);

            setAvailabilityStatus(prev => ({
                ...prev,
                [providerToCheck]: {
                    checked: true,
                    available: result.available,
                    error: result.error
                }
            }));

            // Show notification
            setNotification({
                open: true,
                message: result.available
                    ? `${providerToCheck.charAt(0).toUpperCase() + providerToCheck.slice(1)} is available!`
                    : `${providerToCheck.charAt(0).toUpperCase() + providerToCheck.slice(1)} is not available: ${result.error}`,
                severity: result.available ? 'success' : 'error'
            });
        } catch (error) {
            setAvailabilityStatus(prev => ({
                ...prev,
                [providerToCheck]: {
                    checked: true,
                    available: false,
                    error: error.message
                }
            }));

            setNotification({
                open: true,
                message: `Error checking availability: ${error.message}`,
                severity: 'error'
            });
        }
    };

    // Handle notification close
    const handleCloseNotification = () => {
        setNotification({
            ...notification,
            open: false
        });
    };

    // Toggle password visibility
    const toggleOpenaiKeyVisibility = () => {
        setShowOpenaiKey(!showOpenaiKey);
    };

    const toggleAnthropicKeyVisibility = () => {
        setShowAnthropicKey(!showAnthropicKey);
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
                <Typography color="text.primary">AI Settings</Typography>
            </Breadcrumbs>

            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                AI Model Settings
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Configure the AI models used for resume customization and cover letter generation.
            </Typography>

            <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', mb: 3 }}>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* LLM Provider Selection */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    AI Provider
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <FormControl fullWidth>
                                    <InputLabel id="provider-select-label">AI Provider</InputLabel>
                                    <Select
                                        labelId="provider-select-label"
                                        id="provider-select"
                                        value={provider}
                                        label="AI Provider"
                                        onChange={(e) => setProvider(e.target.value)}
                                    >
                                        <MenuItem value="ollama">Ollama (Local)</MenuItem>
                                        <MenuItem value="openai">OpenAI</MenuItem>
                                        <MenuItem value="anthropic">Anthropic</MenuItem>
                                    </Select>
                                    <FormHelperText>
                                        Select the AI service provider to use for text generation
                                    </FormHelperText>
                                </FormControl>

                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => checkAvailability(provider)}
                                        startIcon={availabilityStatus[provider]?.checked ?
                                            (availabilityStatus[provider]?.available ?
                                                <CheckCircleIcon color="success" /> :
                                                <ErrorIcon color="error" />
                                            ) : null}
                                        color={availabilityStatus[provider]?.checked ?
                                            (availabilityStatus[provider]?.available ? "success" : "error") :
                                            "primary"}
                                        sx={{ mr: 2 }}
                                    >
                                        {availabilityStatus[provider]?.checked ?
                                            (availabilityStatus[provider]?.available ? "Available" : "Not Available") :
                                            "Check Availability"}
                                    </Button>

                                    {availabilityStatus[provider]?.checked && !availabilityStatus[provider]?.available && (
                                        <Typography variant="body2" color="error.main">
                                            {availabilityStatus[provider]?.error}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>

                            {/* Ollama Settings */}
                            {provider === 'ollama' && (
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Ollama Settings
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel id="ollama-model-select-label">Ollama Model</InputLabel>
                                        <Select
                                            labelId="ollama-model-select-label"
                                            id="ollama-model-select"
                                            value={ollamaModel}
                                            label="Ollama Model"
                                            onChange={(e) => setOllamaModel(e.target.value)}
                                        >
                                            {ollamaModels.map((model) => (
                                                <MenuItem key={model} value={model}>{model}</MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText>
                                            Select an Ollama model to use (must be pulled and available locally)
                                        </FormHelperText>
                                    </FormControl>

                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Ollama must be running locally on your computer at http://localhost:11434.
                                        Make sure you've pulled the selected model using <code>ollama pull {ollamaModel}</code>.
                                    </Alert>
                                </Grid>
                            )}

                            {/* OpenAI Settings */}
                            {provider === 'openai' && (
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        OpenAI Settings
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    {openaiKeyFromEnv && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            API key loaded from environment (.env file). You can view or modify it below.
                                        </Alert>
                                    )}

                                    <TextField
                                        fullWidth
                                        label="OpenAI API Key"
                                        variant="outlined"
                                        value={openaiApiKey}
                                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                                        type={showOpenaiKey ? 'text' : 'password'}
                                        placeholder="sk-..."
                                        sx={{ mb: 3 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle api key visibility"
                                                        onClick={toggleOpenaiKeyVisibility}
                                                    >
                                                        {showOpenaiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText={openaiKeyFromEnv
                                            ? "This key was loaded from your .env file. Changes here won't modify the file."
                                            : "Enter your OpenAI API key (starts with 'sk-')"}
                                    />

                                    <FormControl fullWidth>
                                        <InputLabel id="openai-model-select-label">OpenAI Model</InputLabel>
                                        <Select
                                            labelId="openai-model-select-label"
                                            id="openai-model-select"
                                            value={openaiModel}
                                            label="OpenAI Model"
                                            onChange={(e) => setOpenaiModel(e.target.value)}
                                        >
                                            {openaiModels.map((model) => (
                                                <MenuItem key={model} value={model}>{model}</MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText>
                                            Select an OpenAI model to use
                                        </FormHelperText>
                                    </FormControl>
                                </Grid>
                            )}

                            {/* Anthropic Settings */}
                            {provider === 'anthropic' && (
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Anthropic Settings
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    {anthropicKeyFromEnv && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            API key loaded from environment (.env file). You can view or modify it below.
                                        </Alert>
                                    )}

                                    <TextField
                                        fullWidth
                                        label="Anthropic API Key"
                                        variant="outlined"
                                        value={anthropicApiKey}
                                        onChange={(e) => setAnthropicApiKey(e.target.value)}
                                        type={showAnthropicKey ? 'text' : 'password'}
                                        placeholder="sk-ant-..."
                                        sx={{ mb: 3 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle api key visibility"
                                                        onClick={toggleAnthropicKeyVisibility}
                                                    >
                                                        {showAnthropicKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText={anthropicKeyFromEnv
                                            ? "This key was loaded from your .env file. Changes here won't modify the file."
                                            : "Enter your Anthropic API key (starts with 'sk-ant-')"}
                                    />

                                    <FormControl fullWidth>
                                        <InputLabel id="anthropic-model-select-label">Anthropic Model</InputLabel>
                                        <Select
                                            labelId="anthropic-model-select-label"
                                            id="anthropic-model-select"
                                            value={anthropicModel}
                                            label="Anthropic Model"
                                            onChange={(e) => setAnthropicModel(e.target.value)}
                                        >
                                            {anthropicModels.map((model) => (
                                                <MenuItem key={model} value={model}>{model}</MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText>
                                            Select an Anthropic model to use
                                        </FormHelperText>
                                    </FormControl>
                                </Grid>
                            )}

                            {/* Save Button */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        type="submit"
                                        disabled={updateSettingsMutation.isLoading}
                                        startIcon={
                                            updateSettingsMutation.isLoading ?
                                                <CircularProgress size={20} color="inherit" /> :
                                                <SettingsIcon />
                                        }
                                    >
                                        {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>

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

export default AISettings;
