import apiClient from './client';
import type { UserProfile } from '@/types';

// Full backend URL for OAuth redirect (browser navigation, not proxied)
const BACKEND_URL = 'http://127.0.0.1:8000';

// Get the Google OAuth login URL
export const getGoogleLoginUrl = (): string => {
  return `${BACKEND_URL}/api/v1/auth/google?platform=web`;
};

// Fetch the current user's profile
export const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/users/profile');
  return response.data;
};

export const authApi = {
  getGoogleLoginUrl,
  fetchUserProfile,
};

export default authApi;
