import axios, { AxiosError } from 'axios';
import { getToastHandler } from '@/contexts/ToastContext';

// Use relative URL - Vite proxy forwards to backend
const API_BASE_URL = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies
});

// Extract error message from API response
function getErrorMessage(error: AxiosError): { title: string; message?: string } {
  const status = error.response?.status;
  const data = error.response?.data as Record<string, unknown> | undefined;

  // Try to get message from response
  const apiMessage = data?.detail || data?.message || data?.error;

  // Handle common HTTP status codes
  switch (status) {
    case 400:
      return {
        title: 'Bad Request',
        message: typeof apiMessage === 'string' ? apiMessage : 'The request was invalid.',
      };
    case 401:
      return {
        title: 'Unauthorized',
        message: 'Please log in to continue.',
      };
    case 403:
      return {
        title: 'Forbidden',
        message: 'You do not have permission to perform this action.',
      };
    case 404:
      return {
        title: 'Not Found',
        message: typeof apiMessage === 'string' ? apiMessage : 'The requested resource was not found.',
      };
    case 409:
      return {
        title: 'Conflict',
        message: typeof apiMessage === 'string' ? apiMessage : 'A conflict occurred with the current state.',
      };
    case 422:
      return {
        title: 'Validation Error',
        message: typeof apiMessage === 'string' ? apiMessage : 'The provided data is invalid.',
      };
    case 429:
      return {
        title: 'Too Many Requests',
        message: 'Please slow down and try again later.',
      };
    case 500:
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again.',
      };
    case 502:
    case 503:
    case 504:
      return {
        title: 'Service Unavailable',
        message: 'The server is temporarily unavailable. Please try again later.',
      };
    default:
      if (error.code === 'ERR_NETWORK') {
        return {
          title: 'Network Error',
          message: 'Unable to connect to the server. Please check your internet connection.',
        };
      }
      return {
        title: 'Error',
        message: typeof apiMessage === 'string' ? apiMessage : 'An unexpected error occurred.',
      };
  }
}

// Response interceptor - handle auth errors and show toasts
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // Handle 401 - redirect to login
    if (status === 401) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    // Show error toast for all errors except 401 (handled by redirect)
    if (status !== 401) {
      const toastHandler = getToastHandler();
      if (toastHandler) {
        const { title, message } = getErrorMessage(error);
        toastHandler.showError(title, message);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
