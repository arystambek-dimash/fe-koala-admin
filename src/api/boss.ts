import apiClient from './client';

// Boss node type
export interface Boss {
  id: number;
  passage_id: number;
  title: string;
  content?: string | null;
  is_boss: true;
  pass_score: number;
  reward_coins: number;
  reward_xp: number;
}

// Create boss request
export interface CreateBossData {
  title: string;
  passage_id: number;
  pass_score: number;
  reward_coins: number;
  reward_xp: number;
  content?: string;
}

// Update boss request
export interface UpdateBossData {
  title?: string;
  content?: string;
  pass_score?: number;
  reward_coins?: number;
  reward_xp?: number;
}

// Get boss for a passage (returns null if no boss)
export const getBoss = async (passageId: number): Promise<Boss | null> => {
  try {
    const response = await apiClient.get<Boss>(`/boss/passage/${passageId}`);
    return response.data;
  } catch (error: unknown) {
    // Return null if boss not found (404)
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
};

// Create boss for a passage
export const createBoss = async (passageId: number, data: Omit<CreateBossData, 'passage_id'>): Promise<Boss> => {
  const response = await apiClient.post<Boss>('/boss', {
    ...data,
    passage_id: passageId,
  }, {
    params: { passage_id: passageId },
  });
  return response.data;
};

// Update boss
export const updateBoss = async (nodeId: number, data: UpdateBossData): Promise<Boss> => {
  const response = await apiClient.patch<Boss>(`/boss/${nodeId}`, data);
  return response.data;
};

// Delete boss
export const deleteBoss = async (nodeId: number): Promise<void> => {
  await apiClient.delete(`/boss/${nodeId}`);
};

export const bossApi = {
  getBoss,
  createBoss,
  updateBoss,
  deleteBoss,
};

export default bossApi;
