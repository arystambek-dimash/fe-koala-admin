import apiClient from './client';
import type {
  Village,
  VillageCreate,
  VillageUpdate,
  Castle,
  CastleCreate,
  CastleUpdate,
  SubjectType,
} from '@/types';

// Village with passages response type
export interface VillageWithPassages extends Village {
  passages: {
    id: number;
    title: string;
    content: string;
    order_index: number;
    is_boss: boolean;
  }[];
}

// ============ VILLAGES ============

// Get all villages (admin)
export const getVillages = async (subject: SubjectType): Promise<Village[]> => {
  const response = await apiClient.get<Village[]>('/buildings/admin/villages', {
    params: { subject },
  });
  return response.data;
};

// Get a village with its passages
export const getVillage = async (villageId: number): Promise<VillageWithPassages> => {
  const response = await apiClient.get<VillageWithPassages>(`/buildings/village/${villageId}`);
  return response.data;
};

// Create a new village
export const createVillage = async (data: VillageCreate): Promise<Village> => {
  const response = await apiClient.post<Village>('/buildings/villages', data);
  return response.data;
};

// Update an existing village
export const updateVillage = async (id: number, data: VillageUpdate): Promise<Village> => {
  const response = await apiClient.put<Village>(`/buildings/villages/${id}`, data);
  return response.data;
};

// ============ CASTLES ============

// Get all castles (admin)
export const getCastles = async (): Promise<Castle[]> => {
  const response = await apiClient.get<Castle[]>('/buildings/admin/castles');
  return response.data;
};

// Create a new castle
export const createCastle = async (data: CastleCreate): Promise<Castle> => {
  const response = await apiClient.post<Castle>('/buildings/castles', data);
  return response.data;
};

// Update an existing castle
export const updateCastle = async (id: number, data: CastleUpdate): Promise<Castle> => {
  const response = await apiClient.put<Castle>(`/buildings/castles/${id}`, data);
  return response.data;
};

// ============ SHARED ============

// Delete a building (works for both villages and castles)
export const deleteBuilding = async (id: number): Promise<void> => {
  await apiClient.delete(`/buildings/${id}`);
};

export const buildingsApi = {
  // Villages
  getVillages,
  getVillage,
  createVillage,
  updateVillage,
  // Castles
  getCastles,
  createCastle,
  updateCastle,
  // Shared
  deleteBuilding,
};

export default buildingsApi;
