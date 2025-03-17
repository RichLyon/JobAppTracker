import axios from 'axios';

// Create axios instance with base URL and default headers
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// API health check
export const checkApiHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error('API health check failed:', error);
        throw error;
    }
};

// LLM Service endpoints
export const checkOllamaStatus = async () => {
    try {
        const response = await api.get('/ollama/status');
        return response.data;
    } catch (error) {
        console.error('Ollama status check failed:', error);
        return { status: 'unavailable' };
    }
};

export const getLLMSettings = async () => {
    try {
        const response = await api.get('/llm/settings');
        return response.data;
    } catch (error) {
        console.error('Error fetching LLM settings:', error);
        throw error;
    }
};

export const updateLLMSettings = async (settings) => {
    try {
        const response = await api.post('/llm/settings', settings);
        return response.data;
    } catch (error) {
        console.error('Error updating LLM settings:', error);
        throw error;
    }
};

export const checkLLMAvailability = async (provider) => {
    try {
        const response = await api.post('/llm/check-availability', { provider });
        return response.data;
    } catch (error) {
        console.error(`Error checking ${provider} availability:`, error);
        return {
            provider: provider,
            available: false,
            error: error.message
        };
    }
};

// User profile operations
export const getUserInfo = async () => {
    const response = await api.get('/user');
    return response.data;
};

export const updateUserInfo = async (userData) => {
    const response = await api.post('/user', userData);
    return response.data;
};

// Job application operations
export const getApplications = async (params) => {
    const response = await api.get('/applications', { params });
    return response.data;
};

export const getApplication = async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
};

export const createApplication = async (applicationData) => {
    const response = await api.post('/applications', applicationData);
    return response.data;
};

export const updateApplication = async (id, applicationData) => {
    const response = await api.put(`/applications/${id}`, applicationData);
    return response.data;
};

export const deleteApplication = async (id) => {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
};

export const getApplicationStatistics = async () => {
    const response = await api.get('/applications/stats/summary');
    return response.data;
};

// File upload operations
export const uploadResume = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);  // Changed from 'file' to 'resume' to match backend expectation

    const response = await api.post('/resumes/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

// Document URL helper
export const getDocumentUrl = (type, filename) => {
    // URL paths should match the backend endpoints
    // Types: 'resumes' or 'cover-letters'
    return `${api.defaults.baseURL}/${type}/${encodeURIComponent(filename)}`;
};

// Resume operations
export const getResumes = async () => {
    try {
        const response = await api.get('/resumes');
        return response.data.resumes;
    } catch (error) {
        console.error('Error fetching resumes:', error);
        throw error;
    }
};

// Delete a resume by filename
export const deleteResume = async (filename) => {
    try {
        const response = await api.delete(`/resumes/${filename}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting resume:', error);
        throw error;
    }
};

// Get resume filename from path for display
export const getResumeFilenameFromPath = (path) => {
    if (!path) return null;
    return path.split('/').pop();
};

// Resume customization
export const customizeResume = async ({ data, file }) => {
    try {
        // Log the customization request for debugging
        console.log('Resume customization request initiated:', data);

        if (file) {
            // When a file is provided, we need to use FormData
            const formData = new FormData();

            // Add the file with the correct field name that matches backend parameter
            formData.append('resume', file);

            // Add all other data fields to the FormData
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });

            console.log('Sending resume customization with file upload');

            const response = await api.post('/resumes/customize', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } else {
            // No file, just send the JSON data
            console.log('Sending resume customization without file upload:', data);
            const response = await api.post('/resumes/customize', data);
            return response.data;
        }
    } catch (error) {
        console.error('Customize resume error details:', error.response?.data || error.message);
        throw error;
    }
};

// Cover letter generation
export const generateCoverLetter = async ({ data, file }) => {
    try {
        // Log the generation request for debugging
        console.log('Cover letter generation request initiated:', data);

        if (file) {
            // When a file is provided, we need to use FormData
            const formData = new FormData();

            // Add the file with the correct field name that matches backend parameter
            formData.append('resume', file);

            // Add all other data fields to the FormData
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });

            console.log('Sending cover letter generation with file upload');

            const response = await api.post('/cover-letters/generate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } else {
            // No file, just send the JSON data
            console.log('Sending cover letter generation without file upload:', data);
            const response = await api.post('/cover-letters/generate', data);
            return response.data;
        }
    } catch (error) {
        console.error('Cover letter generation error details:', error.response?.data || error.message);
        throw error;
    }
};

// Create an object with all exported functions
const apiService = {
    checkApiHealth,
    checkOllamaStatus,
    getLLMSettings,
    updateLLMSettings,
    checkLLMAvailability,
    getUserInfo,
    updateUserInfo,
    getApplications,
    getApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    getApplicationStatistics,
    uploadResume,
    getDocumentUrl,
    getResumes,
    customizeResume,
    generateCoverLetter,
};

export default apiService;
