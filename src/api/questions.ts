import apiClient from './client';
import type { Question, QuestionFormData } from '@/types';

// Get all questions for a node
export const getQuestions = async (nodeId: number): Promise<Question[]> => {
    const response = await apiClient.get<Question[]>(`/questions/node/${nodeId}`);
    return response.data;
};

// Create a new question
export const createQuestion = async (nodeId: number, data: QuestionFormData): Promise<Question> => {
    const response = await apiClient.post<Question>(`/questions/node/${nodeId}`, data);
    return response.data;
};

// Update an existing question
export const updateQuestion = async (questionId: number, data: QuestionFormData): Promise<Question> => {
    const response = await apiClient.patch<Question>(`/questions/${questionId}`, data);
    return response.data;
};

// Delete a question
export const deleteQuestion = async (questionId: number): Promise<void> => {
    await apiClient.delete(`/questions/${questionId}`);
};

// Reorder a question within a node
export const reorderQuestion = async (
    nodeId: number,
    questionId: number,
    orderIndex: number
): Promise<Question[]> => {
    const response = await apiClient.patch<Question[]>(`/questions/order/${nodeId}`, {
        question_id: questionId,
        order_index: orderIndex,
    });
    return response.data;
};

export const questionsApi = {
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestion,
};

export default questionsApi;
