import apiClient from './client';
import type {PassageNode, PassageNodeFormData} from '@/types';

// Get all nodes for a passage
export const getNodes = async (passageId: number): Promise<PassageNode[]> => {
    const response = await apiClient.get<PassageNode[]>(`/nodes/passage/${passageId}`);
    return response.data;
};


// Create a new node
export const createNode = async (passageId: number, data: PassageNodeFormData): Promise<PassageNode> => {
    const response = await apiClient.post<PassageNode>(`/nodes/passage/${passageId}`, data);
    return response.data;
};

// Update an existing node
export const updateNode = async (
    nodeId: number,
    data: PassageNodeFormData
): Promise<PassageNode> => {
    const response = await apiClient.patch<PassageNode>(
        `/nodes/${nodeId}`,
        data
    );
    return response.data;
};

// Delete a node
export const deleteNode = async (nodeId: number): Promise<void> => {
    await apiClient.delete(`/nodes/${nodeId}`);
};

// Reorder a node within a passage
export const reorderNode = async (
    passageId: number,
    nodeId: number,
    orderIndex: number
): Promise<PassageNode[]> => {
    const response = await apiClient.patch<PassageNode[]>(`/nodes/order/${passageId}`, {
        node_id: nodeId,
        order_index: orderIndex,
    });
    return response.data;
};

export const nodesApi = {
    getNodes,
    createNode,
    updateNode,
    deleteNode,
    reorderNode,
};

export default nodesApi;
