// User Profile
export interface UserProfile {
    id: number;
    email: string;
    full_name: string;
    is_admin: boolean;
}

// Subject Types (moved up for use in Building types)
export type SubjectType = 'english' | 'math' | 'reading' | 'science';

export const SUBJECTS: SubjectType[] = ['english', 'math', 'reading', 'science'];

export const SUBJECT_LABELS: Record<SubjectType, string> = {
    english: 'English',
    math: 'Math',
    reading: 'Reading',
    science: 'Science',
};

// Building Types
export type BuildingType = 'village' | 'castle';

export const BUILDING_TYPES: BuildingType[] = ['village', 'castle'];

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
    village: 'Village',
    castle: 'Castle',
};

// Base building interface
export interface BuildingBase {
    id: number;
    title: string;
    svg?: string;
    treasure_capacity: number;
    speed_production_treasure: number;
    cost: number;
    next_building_id?: number | null;
}

// Castle types
export interface Castle extends BuildingBase {
    is_current?: boolean;
}

export interface CastleCreate {
    title: string;
    type: 'castle';
    svg?: string;
    treasure_capacity?: number;
    speed_production_treasure?: number;
    cost?: number;
}

export interface CastleUpdate {
    title?: string;
    svg?: string | null;
    treasure_capacity?: number;
    speed_production_treasure?: number;
    cost?: number;
}

// Village types
export interface Village extends BuildingBase {
    subject: SubjectType;
    is_current?: boolean;
}

export interface VillageCreate {
    title: string;
    type: 'village';
    subject: SubjectType;
    svg?: string;
    treasure_capacity?: number;
    speed_production_treasure?: number;
    cost?: number;
}

export interface VillageUpdate {
    title?: string;
    subject?: SubjectType;
    svg?: string | null;
    treasure_capacity?: number;
    speed_production_treasure?: number;
    cost?: number;
}

// Legacy Building interface (for backward compatibility)
export interface Building {
    id: number;
    title: string;
    type: BuildingType;
    svg: string;
    treasure_capacity: number;
    speed_production_treasure: number;
    cost: number;
    subject?: SubjectType;
    next_building_id?: number | null;
}

export interface BuildingFormData {
    title: string;
    type: BuildingType;
    svg: string;
    treasure_capacity: number;
    speed_production_treasure: number;
    cost: number;
    subject?: SubjectType;
}

// Passage Types
export interface Passage {
    id: number;
    village_id: number;
    subject: SubjectType;
    title: string;
    order_index: number;
}

export interface PassageFormData {
    title: string;
    subject: SubjectType;
    order_index: number;
}

// Passage Node Types
export interface PassageNode {
    id: number;
    passage_id: number;
    title: string;
    content: string;
    order_index: number;
    reward_coins: number;
    reward_xp: number;
    pass_score: number;
    is_boss: boolean;
}

export interface PassageNodeFormData {
    title: string;
    content: string;
    order_index: number;
    reward_coins: number;
    reward_xp: number;
    pass_score: number;
    is_boss?: boolean;
}

// Question Types
export type QuestionType =
    | 'multiple_choice'
    | 'find_error'
    | 'strike_out'
    | 'ordering'
    | 'highlight'
    | 'swipe_decision'
    | 'fill_gap'
    | 'matching'
    | 'graph_point'
    | 'trend_arrow'
    | 'slider_value';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    multiple_choice: 'Multiple Choice',
    find_error: 'Find Error',
    strike_out: 'Strike Out',
    ordering: 'Ordering',
    highlight: 'Highlight',
    swipe_decision: 'Swipe Decision',
    fill_gap: 'Fill Gap',
    matching: 'Matching',
    graph_point: 'Graph Point',
    trend_arrow: 'Trend Arrow',
    slider_value: 'Slider Value',
};

// Question types grouped by subject
export const QUESTION_TYPES_BY_SUBJECT: Record<SubjectType, QuestionType[]> = {
    english: ['multiple_choice', 'find_error', 'strike_out', 'ordering'],
    reading: ['multiple_choice', 'highlight', 'swipe_decision'],
    math: ['multiple_choice', 'fill_gap', 'matching', 'graph_point', 'ordering'],
    science: ['multiple_choice', 'trend_arrow', 'slider_value', 'swipe_decision', 'graph_point'],
};

export interface Question {
    id: number;
    node_id: number;
    type: QuestionType;
    content: Record<string, unknown>;
}

export interface QuestionFormData {
    type: QuestionType;
    content: Record<string, unknown>;
}

// Content interfaces for each question type
export interface MultipleChoiceOption {
    id: string;
    text: string;
    is_correct: boolean;
}

export interface MultipleChoiceContent {
    question: string;
    options: MultipleChoiceOption[];
    explanation: string;
}

export interface FindErrorContent {
    sentence: string;
    error_index: number;
    correct_word: string;
    explanation: string;
}

export interface StrikeOutContent {
    sentence: string;
    correct_ids_to_remove: number[];
    explanation: string;
}

export interface OrderingItem {
    id: string;
    content: string;
}

export interface OrderingContent {
    items: OrderingItem[];
    correct_order: string[];
    explanation: string;
}

export interface HighlightContent {
    passage: string;
    question: string;
    correct_phrase: string;
    explanation: string;
}

export interface SwipeDecisionContent {
    content: string;
    correct_swipe: 'left' | 'right';
    explanation: string;
    labels: { left: string; right: string };
}

export interface FillGapContent {
    question: string;
    correct_answer: string;
    explanation: string;
}

export interface MatchingPair {
    id: string;
    left: string;
    right: string;
}

export interface MatchingContent {
    pairs: MatchingPair[];
}

export interface GraphPointContent {
    graph_description: string;
    target_x: number;
    target_y: number;
    radius: number;
    explanation: string;
}

export interface TrendArrowContent {
    question: string;
    correct_trend: 'increase' | 'decrease' | 'no_change';
    explanation: string;
}

export interface SliderValueContent {
    image_description: string;
    question: string;
    min_value: number;
    max_value: number;
    correct_value: number;
    tolerance: number;
    unit: string;
    explanation: string;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
}
