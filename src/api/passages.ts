import apiClient from './client';

// Passage type for API responses
export interface Passage {
  id: number;
  title: string;
  order_index: number;
}

// Create passage request body
export interface CreatePassageData {
  village_id: number;
  title: string;
}

// Update passage request body
export interface UpdatePassageData {
  title?: string;
}

// Create a new passage
export const createPassage = async (data: CreatePassageData): Promise<Passage> => {
  const response = await apiClient.post<Passage>('/passages', data);
  return response.data;
};

// Update an existing passage
export const updatePassage = async (passageId: number, data: UpdatePassageData): Promise<Passage> => {
  const response = await apiClient.patch<Passage>(`/passages/${passageId}`, data);
  return response.data;
};

// Delete a passage
export const deletePassage = async (passageId: number): Promise<void> => {
  await apiClient.delete(`/passages/${passageId}`);
};

// Reorder a passage within a village
export const reorderPassage = async (
  villageId: number,
  passageId: number,
  newIndex: number
): Promise<Passage[]> => {
  const response = await apiClient.patch<Passage[]>(`/passages/order/${villageId}`, {
    passage_id: passageId,
    new_index: newIndex,
  });
  return response.data;
};

export const passagesApi = {
  createPassage,
  updatePassage,
  deletePassage,
  reorderPassage,
};

export default passagesApi;
