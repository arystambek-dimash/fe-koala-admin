import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, HelpCircle, Pencil, Trash2, ChevronDown, Play, X, ChevronLeft, ChevronRight, RotateCcw, Smartphone, GripVertical, ChevronUp, Copy } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { questionsApi } from '@/api/questions';
import { QuestionFormRenderer, getDefaultContent } from '@/components/question-forms';
import { QuestionPreview } from '@/components/question-previews';
import type { Question, QuestionType, QuestionFormData, SubjectType } from '@/types';
import { QUESTION_TYPE_LABELS, QUESTION_TYPES_BY_SUBJECT, SUBJECT_LABELS, SUBJECTS } from '@/types';
import { cn } from '@/lib/utils';

// Icons for question types
const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
    multiple_choice: 'A/B',
    find_error: '?!',
    strike_out: '~~',
    ordering: '123',
    highlight: '[]',
    swipe_decision: '<>',
    fill_gap: '___',
    matching: '==',
    graph_point: 'xy',
    trend_arrow: '/\\',
    slider_value: '|-|',
};

// Subject colors
const SUBJECT_COLORS: Record<SubjectType, { bg: string; text: string; border: string }> = {
    english: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    reading: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    math: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    science: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
};

// Batch question item type
interface BatchQuestionItem {
    id: string; // temp id for UI
    type: QuestionType;
    content: Record<string, unknown>;
    isExpanded: boolean;
}

export function QuestionsPage() {
    const { nodeId, bossId } = useParams<{ nodeId?: string; bossId?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const subject = (searchParams.get('subject') || 'english') as SubjectType;
    const villageId = searchParams.get('villageId');
    const passageTitle = searchParams.get('passageTitle');
    const isBossMode = !!bossId;
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

    // Preview state
    const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
    const [previewKey, setPreviewKey] = useState(0);

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<Question | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Batch creation state
    const [batchQuestions, setBatchQuestions] = useState<BatchQuestionItem[]>([]);

    // Edit mode state (single question)
    const [editType, setEditType] = useState<QuestionType>(QUESTION_TYPES_BY_SUBJECT[subject][0]);
    const [editContent, setEditContent] = useState<Record<string, unknown>>({});
    const [editTypeDropdownOpen, setEditTypeDropdownOpen] = useState(false);

    const nodeIdNum = parseInt(bossId || nodeId || '0', 10);

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const data = await questionsApi.getQuestions(nodeIdNum);
            setQuestions(data);
        } catch {
            setQuestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (nodeIdNum) fetchQuestions();
    }, [nodeIdNum]);

    // Create a new batch question item
    const createBatchItem = (type?: QuestionType): BatchQuestionItem => {
        const questionType = type || QUESTION_TYPES_BY_SUBJECT[subject][0];
        return {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: questionType,
            content: getDefaultContent(questionType),
            isExpanded: true,
        };
    };

    const openCreateDialog = () => {
        setEditingQuestion(null);
        // Start with one empty question
        setBatchQuestions([createBatchItem()]);
        setDialogOpen(true);
    };

    const openEditDialog = (question: Question) => {
        setEditingQuestion(question);
        setEditType(question.type);
        setEditContent(question.content);
        setBatchQuestions([]);
        setDialogOpen(true);
    };

    // Batch operations
    const addBatchQuestion = () => {
        setBatchQuestions(prev => {
            // Collapse all existing, add new expanded
            const collapsed = prev.map(q => ({ ...q, isExpanded: false }));
            return [...collapsed, createBatchItem()];
        });
    };

    const duplicateBatchQuestion = (index: number) => {
        setBatchQuestions(prev => {
            const source = prev[index];
            const newItem: BatchQuestionItem = {
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: source.type,
                content: JSON.parse(JSON.stringify(source.content)), // deep clone
                isExpanded: true,
            };
            // Collapse all, insert duplicate after source
            const collapsed = prev.map(q => ({ ...q, isExpanded: false }));
            return [...collapsed.slice(0, index + 1), newItem, ...collapsed.slice(index + 1)];
        });
    };

    const removeBatchQuestion = (index: number) => {
        setBatchQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const updateBatchQuestion = (index: number, updates: Partial<BatchQuestionItem>) => {
        setBatchQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
    };

    const toggleBatchExpanded = (index: number) => {
        setBatchQuestions(prev => prev.map((q, i) => ({
            ...q,
            isExpanded: i === index ? !q.isExpanded : false, // only one expanded at a time
        })));
    };

    const handleBatchTypeChange = (index: number, type: QuestionType) => {
        updateBatchQuestion(index, {
            type,
            content: getDefaultContent(type),
        });
    };

    const handleEditTypeChange = (type: QuestionType) => {
        setEditType(type);
        setEditTypeDropdownOpen(false);
    };

    // Submit handlers
    const handleBatchSubmit = async () => {
        if (batchQuestions.length === 0) return;

        setIsSubmitting(true);
        try {
            // Create all questions sequentially
            for (const item of batchQuestions) {
                const data: QuestionFormData = {
                    type: item.type,
                    content: item.content,
                };
                await questionsApi.createQuestion(nodeIdNum, data);
            }
            await fetchQuestions();
            setDialogOpen(false);
            setBatchQuestions([]);
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async () => {
        if (!editingQuestion) return;

        setIsSubmitting(true);
        try {
            const data: QuestionFormData = {
                type: editType,
                content: editContent,
            };
            await questionsApi.updateQuestion(editingQuestion.id, data);
            await fetchQuestions();
            setDialogOpen(false);
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingQuestion) return;
        setIsSubmitting(true);
        try {
            await questionsApi.deleteQuestion(deletingQuestion.id);
            await fetchQuestions();
            setDeleteDialogOpen(false);
            setDeletingQuestion(null);
            if (previewQuestion?.id === deletingQuestion.id) {
                setPreviewQuestion(null);
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, question: Question) => {
        setDraggedItem(question);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', question.id.toString());
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);

        if (!draggedItem) return;

        const dragIndex = questions.findIndex(q => q.id === draggedItem.id);
        if (dragIndex === dropIndex) return;

        setIsSubmitting(true);
        try {
            await questionsApi.reorderQuestion(nodeIdNum, draggedItem.id, dropIndex + 1);
            await fetchQuestions();
        } catch (error) {
            console.error('Failed to reorder:', error);
        } finally {
            setIsSubmitting(false);
            setDraggedItem(null);
        }
    };

    const getQuestionPreviewText = (question: Question): string => {
        const c = question.content;
        if (c.question) return String(c.question).slice(0, 50);
        if (c.sentence) return String(c.sentence).slice(0, 50);
        if (c.passage) return String(c.passage).slice(0, 50);
        return 'Question content...';
    };

    const getQuestionSubject = (type: QuestionType): SubjectType => {
        return SUBJECTS.find(s => QUESTION_TYPES_BY_SUBJECT[s].includes(type)) || 'english';
    };

    // Preview navigation
    const currentPreviewIndex = previewQuestion ? questions.findIndex(q => q.id === previewQuestion.id) : -1;

    const goToPrevQuestion = () => {
        if (currentPreviewIndex > 0) {
            setPreviewQuestion(questions[currentPreviewIndex - 1]);
            setPreviewKey(k => k + 1);
        }
    };

    const goToNextQuestion = () => {
        if (currentPreviewIndex < questions.length - 1) {
            setPreviewQuestion(questions[currentPreviewIndex + 1]);
            setPreviewKey(k => k + 1);
        }
    };

    const resetPreview = () => {
        setPreviewKey(k => k + 1);
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
            {/* Questions List */}
            <div className={cn(
                'flex-1 space-y-6 overflow-y-auto transition-all duration-300',
                previewQuestion ? 'max-w-[50%]' : 'max-w-full'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <button onClick={() => navigate('/villages')} className="hover:text-gray-700">
                                Villages
                            </button>
                            {isBossMode && villageId && (
                                <>
                                    <span>/</span>
                                    <button onClick={() => navigate(`/villages/${villageId}/passages`)} className="hover:text-gray-700">
                                        {passageTitle ? decodeURIComponent(passageTitle) : 'Passages'}
                                    </button>
                                </>
                            )}
                            {!isBossMode && (
                                <>
                                    <span>/</span>
                                    <button onClick={() => navigate(-1)} className="hover:text-gray-700">
                                        Node {nodeId}
                                    </button>
                                </>
                            )}
                            <span>/</span>
                            <span>{isBossMode ? 'Boss Questions' : 'Questions'}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{isBossMode ? 'Boss Questions' : 'Questions'}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage quiz questions for this {isBossMode ? 'boss challenge' : 'node'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {questions.length > 0 && (
                            <button
                                onClick={() => navigate(isBossMode
                                    ? `/boss/${bossId}/test?subject=${subject}`
                                    : `/nodes/${nodeId}/test?subject=${subject}`
                                )}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                <Play className="h-4 w-4" />
                                Test
                            </button>
                        )}
                        <button
                            onClick={openCreateDialog}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            <Plus className="h-4 w-4" />
                            Add Questions
                        </button>
                    </div>
                </div>

                {/* Questions List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
                        ))}
                    </div>
                ) : questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                        <HelpCircle className="h-12 w-12 text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No questions</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Create your first question for this node
                        </p>
                        <button
                            onClick={openCreateDialog}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            <Plus className="h-4 w-4" />
                            Add Questions
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {questions.map((question, index) => {
                            const questionSubject = getQuestionSubject(question.type);
                            const colors = SUBJECT_COLORS[questionSubject];
                            const isSelected = previewQuestion?.id === question.id;
                            return (
                                <div
                                    key={question.id}
                                    draggable={!isSubmitting}
                                    onDragStart={(e) => handleDragStart(e, question)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={cn(
                                        'flex items-center gap-4 rounded-lg border bg-white p-4 transition-all cursor-grab active:cursor-grabbing',
                                        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                                        draggedItem?.id === question.id && 'opacity-50 border-gray-300',
                                        dragOverIndex === index && draggedItem?.id !== question.id && 'border-2 border-blue-400 bg-blue-50'
                                    )}
                                    onClick={() => {
                                        setPreviewQuestion(question);
                                        setPreviewKey(k => k + 1);
                                    }}
                                >
                                    {/* Drag handle */}
                                    <div
                                        className="flex h-10 w-6 items-center justify-center text-gray-400 hover:text-gray-600"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <GripVertical className="h-5 w-5" />
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-600">
                                        {index + 1}
                                    </div>

                                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold', colors.bg, colors.text)}>
                                        {QUESTION_TYPE_ICONS[question.type]}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('inline-flex items-center rounded-md px-2 py-1 text-xs font-medium', colors.bg, colors.text)}>
                                                {SUBJECT_LABELS[questionSubject]}
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                {QUESTION_TYPE_LABELS[question.type]}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 truncate">
                                            {getQuestionPreviewText(question)}...
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewQuestion(question);
                                                setPreviewKey(k => k + 1);
                                            }}
                                            className={cn(
                                                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                                isSelected ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                            )}
                                            title="Preview"
                                        >
                                            <Play className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditDialog(question);
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingQuestion(question);
                                                setDeleteDialogOpen(true);
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Preview Panel */}
            {previewQuestion && (
                <div className="w-[400px] flex-shrink-0 flex flex-col border-l border-gray-200 bg-gray-50">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-gray-400" />
                            <span className="font-medium text-gray-900">Preview Mode</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={resetPreview}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                title="Reset"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setPreviewQuestion(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Phone Frame */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="mx-auto max-w-[320px]">
                            <div className="rounded-[2.5rem] border-[8px] border-gray-800 bg-white shadow-xl">
                                <div className="mx-auto h-6 w-24 rounded-b-xl bg-gray-800" />
                                <div className="min-h-[500px] p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className={cn(
                                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                                            SUBJECT_COLORS[getQuestionSubject(previewQuestion.type)].bg,
                                            SUBJECT_COLORS[getQuestionSubject(previewQuestion.type)].text
                                        )}>
                                            Question {currentPreviewIndex + 1} of {questions.length}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {QUESTION_TYPE_LABELS[previewQuestion.type]}
                                        </span>
                                    </div>
                                    <QuestionPreview
                                        key={previewKey}
                                        type={previewQuestion.type}
                                        content={previewQuestion.content}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                        <button
                            onClick={goToPrevQuestion}
                            disabled={currentPreviewIndex <= 0}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            {currentPreviewIndex + 1} / {questions.length}
                        </span>
                        <button
                            onClick={goToNextQuestion}
                            disabled={currentPreviewIndex >= questions.length - 1}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {editingQuestion ? 'Edit Question' : `Add Questions (${batchQuestions.length})`}
                        </DialogTitle>
                        <DialogDescription>
                            {editingQuestion
                                ? 'Make changes to the question.'
                                : 'Create multiple questions at once. Click "Add Another" to add more.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
                        {editingQuestion ? (
                            /* Edit Mode - Single Question */
                            <div className="space-y-4">
                                {/* Subject Display */}
                                <div className="grid gap-2">
                                    <Label>Subject</Label>
                                    <div className={cn(
                                        'flex items-center rounded-lg border px-4 py-2.5 text-sm',
                                        SUBJECT_COLORS[subject].border,
                                        SUBJECT_COLORS[subject].bg
                                    )}>
                                        <span className={cn('font-medium', SUBJECT_COLORS[subject].text)}>
                                            {SUBJECT_LABELS[subject]}
                                        </span>
                                    </div>
                                </div>

                                {/* Type Selector */}
                                <div className="grid gap-2">
                                    <Label>Question Type</Label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setEditTypeDropdownOpen(!editTypeDropdownOpen)}
                                            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-left text-sm hover:border-gray-300"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={cn('flex h-8 w-8 items-center justify-center rounded text-xs font-bold', SUBJECT_COLORS[subject].bg, SUBJECT_COLORS[subject].text)}>
                                                    {QUESTION_TYPE_ICONS[editType]}
                                                </span>
                                                <span className="font-medium">{QUESTION_TYPE_LABELS[editType]}</span>
                                            </div>
                                            <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', editTypeDropdownOpen && 'rotate-180')} />
                                        </button>
                                        {editTypeDropdownOpen && (
                                            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                                                <div className="max-h-60 overflow-y-auto p-1">
                                                    {QUESTION_TYPES_BY_SUBJECT[subject].map((type) => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => handleEditTypeChange(type)}
                                                            className={cn(
                                                                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50',
                                                                editType === type && 'bg-gray-50'
                                                            )}
                                                        >
                                                            <span className={cn('flex h-7 w-7 items-center justify-center rounded text-xs font-bold', SUBJECT_COLORS[subject].bg, SUBJECT_COLORS[subject].text)}>
                                                                {QUESTION_TYPE_ICONS[type]}
                                                            </span>
                                                            <span>{QUESTION_TYPE_LABELS[type]}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <QuestionFormRenderer
                                        type={editType}
                                        content={editContent}
                                        onChange={setEditContent}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Batch Creation Mode */
                            <div className="space-y-4">
                                {batchQuestions.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            'rounded-lg border transition-all',
                                            item.isExpanded ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'
                                        )}
                                    >
                                        {/* Question Header */}
                                        <div
                                            className={cn(
                                                'flex items-center gap-3 p-4 cursor-pointer',
                                                item.isExpanded ? 'border-b border-blue-200' : ''
                                            )}
                                            onClick={() => toggleBatchExpanded(index)}
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
                                                {index + 1}
                                            </div>
                                            <div className={cn('flex h-8 w-8 items-center justify-center rounded text-xs font-bold', SUBJECT_COLORS[subject].bg, SUBJECT_COLORS[subject].text)}>
                                                {QUESTION_TYPE_ICONS[item.type]}
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-900">
                                                    {QUESTION_TYPE_LABELS[item.type]}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        duplicateBatchQuestion(index);
                                                    }}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                {batchQuestions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeBatchQuestion(index);
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {item.isExpanded ? (
                                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {item.isExpanded && (
                                            <div className="p-4 space-y-4">
                                                {/* Type Selector */}
                                                <div className="grid gap-2">
                                                    <Label>Question Type</Label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {QUESTION_TYPES_BY_SUBJECT[subject].map((type) => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => handleBatchTypeChange(index, type)}
                                                                className={cn(
                                                                    'flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all',
                                                                    item.type === type
                                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                                )}
                                                            >
                                                                <span className={cn('flex h-7 w-7 items-center justify-center rounded text-xs font-bold', SUBJECT_COLORS[subject].bg, SUBJECT_COLORS[subject].text)}>
                                                                    {QUESTION_TYPE_ICONS[type]}
                                                                </span>
                                                                <span className="font-medium truncate">{QUESTION_TYPE_LABELS[type]}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-200 pt-4">
                                                    <QuestionFormRenderer
                                                        type={item.type}
                                                        content={item.content}
                                                        onChange={(content) => updateBatchQuestion(index, { content })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add Another Button */}
                                <button
                                    type="button"
                                    onClick={addBatchQuestion}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <Plus className="h-5 w-5" />
                                    Add Another Question
                                </button>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t border-gray-200 pt-4">
                        <button
                            type="button"
                            onClick={() => setDialogOpen(false)}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={editingQuestion ? handleEditSubmit : handleBatchSubmit}
                            disabled={isSubmitting || (!editingQuestion && batchQuestions.length === 0)}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isSubmitting
                                ? 'Saving...'
                                : editingQuestion
                                    ? 'Save Changes'
                                    : `Create ${batchQuestions.length} Question${batchQuestions.length > 1 ? 's' : ''}`}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete question</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            onClick={() => setDeleteDialogOpen(false)}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default QuestionsPage;
