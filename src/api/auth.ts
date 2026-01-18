import apiClient from './client';
import type {UserProfile} from '@/types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getGoogleLoginUrl = (): string => {
    return `${BACKEND_URL}/api/v1/auth/google?platform=web`;
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/profile');
    return response.data;
};

export const authApi = {
    getGoogleLoginUrl,
    fetchUserProfile,
};

export default authApi;
