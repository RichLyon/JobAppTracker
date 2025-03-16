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

// Check if Ollama is available
export const checkOllamaStatus = async () => {
    try {
        const response = await api.get('/ai/status');
        return response.data;
    } catch (error) {
        console.error('Ollama status check failed:', error);
        return { status: 'unavailable' };
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
    const response = await api.get('/applications/statistics');
    return response.data;
};

// File upload operations
export const uploadResume = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/resumes/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

// Document URL helper
export const getDocumentUrl = (type, filename) => {
    return `${api.defaults.baseURL}/${type}/${filename}`;
};

// Resume customization
export const customizeResume = async ({ data, file }) => {
    // If file is provided, first upload it
    let resumePath = null;

    if (file) {
        const uploadResponse = await uploadResume(file);
        resumePath = uploadResponse.path;
    }

    // Add resume path to the request if available
    const requestData = {
        ...data,
        ...(resumePath && { resume_path: resumePath }),
    };

    const response = await api.post('/resumes/customize', requestData);
    return response.data;
};

// Cover letter generation
export const generateCoverLetter = async ({ data, file }) => {
    // If file is provided, first upload it
    let resumePath = null;

    if (file) {
        const uploadResponse = await uploadResume(file);
        resumePath = uploadResponse.path;
    }

    // Add resume path to the request if available
    const requestData = {
        ...data,
        ...(resumePath && { resume_path: resumePath }),
    };

    const response = await api.post('/cover-letters/generate', requestData);
    return response.data;
};

export default {
    checkApiHealth,
    checkOllamaStatus,
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
    customizeResume,
    generateCoverLetter,
};
