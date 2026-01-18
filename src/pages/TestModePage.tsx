import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { questionsApi } from '@/api/questions';
import { nodesApi } from '@/api/nodes';
import type { Question, SubjectType, PassageNode } from '@/types';
import { QUESTION_TYPE_LABELS, SUBJECT_LABELS } from '@/types';
import { cn } from '@/lib/utils';

// Subject colors
const SUBJECT_COLORS: Record<SubjectType, { bg: string; text: string; gradient: string }> = {
    english: { bg: 'bg-purple-500', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' },
    reading: { bg: 'bg-blue-500', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
    math: { bg: 'bg-green-500', text: 'text-green-600', gradient: 'from-green-500 to-green-600' },
    science: { bg: 'bg-orange-500', text: 'text-orange-600', gradient: 'from-orange-500 to-orange-600' },
};

interface QuestionResult {
    questionId: number;
    isCorrect: boolean;
    userAnswer: unknown;
}

export function TestModePage() {
    const { nodeId, bossId } = useParams<{ nodeId?: string; bossId?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const subject = (searchParams.get('subject') || 'english') as SubjectType;
    const isBossMode = !!bossId;

    const [node, setNode] = useState<PassageNode | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<QuestionResult[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState<unknown>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);

    const nodeIdNum = parseInt(bossId || nodeId || '0', 10);
    const currentQuestion = questions[currentIndex];
    const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [questionsData, nodesData] = await Promise.all([
                    questionsApi.getQuestions(nodeIdNum),
                    nodesApi.getNodes(nodeIdNum).catch(() => [])
                ]);
                setQuestions(questionsData);
                // Try to get node info from the passage
                if (nodesData.length > 0) {
                    const foundNode = nodesData.find(n => n.id === nodeIdNum);
                    if (foundNode) setNode(foundNode);
                }
            } catch {
                setQuestions([]);
            } finally {
                setIsLoading(false);
            }
        };
        if (nodeIdNum) fetchData();
    }, [nodeIdNum]);

    const checkAnswer = (question: Question, answer: unknown): boolean => {
        const content = question.content;

        switch (question.type) {
            case 'multiple_choice': {
                const options = content.options as Array<{ id: string; is_correct: boolean }>;
                const correctOption = options?.find(o => o.is_correct);
                return answer === correctOption?.id;
            }
            case 'find_error': {
                return answer === content.error_index;
            }
            case 'strike_out': {
                const correctIds = new Set(content.correct_ids_to_remove as number[]);
                const answerSet = answer as Set<number>;
                return answerSet?.size === correctIds.size &&
                    [...answerSet].every(id => correctIds.has(id));
            }
            case 'ordering': {
                const correctOrder = content.correct_order as string[];
                const answerOrder = answer as string[];
                return JSON.stringify(answerOrder) === JSON.stringify(correctOrder);
            }
            case 'highlight': {
                const correctPhrase = (content.correct_phrase as string).toLowerCase();
                const answerText = (answer as string).toLowerCase();
                return answerText.includes(correctPhrase) || correctPhrase.includes(answerText);
            }
            case 'swipe_decision': {
                const cards = content.cards as Array<{ correct_swipe: string }>;
                const answers = answer as string[];
                return cards.every((card, i) => card.correct_swipe === answers[i]);
            }
            case 'fill_gap': {
                const correctAnswer = (content.correct_answer as string).toLowerCase().trim();
                return (answer as string).toLowerCase().trim() === correctAnswer;
            }
            case 'matching': {
                const pairs = content.pairs as Array<{ id: string }>;
                const matches = answer as Map<string, string>;
                return pairs.every(pair => matches.get(pair.id) === pair.id);
            }
            case 'graph_point': {
                const point = answer as { x: number; y: number };
                const targetX = content.target_x as number;
                const targetY = content.target_y as number;
                const radius = content.radius as number;
                const distance = Math.sqrt(Math.pow(point.x - targetX, 2) + Math.pow(point.y - targetY, 2));
                return distance <= radius;
            }
            case 'trend_arrow': {
                return answer === content.correct_trend;
            }
            case 'slider_value': {
                const correctValue = content.correct_value as number;
                const tolerance = content.tolerance as number;
                return Math.abs((answer as number) - correctValue) <= tolerance;
            }
            default:
                return false;
        }
    };

    const handleSubmitAnswer = () => {
        if (currentAnswer === null) return;

        const isCorrect = checkAnswer(currentQuestion, currentAnswer);
        setIsCurrentCorrect(isCorrect);
        setShowFeedback(true);
    };

    const handleNextQuestion = () => {
        // Save result
        setResults([...results, {
            questionId: currentQuestion.id,
            isCorrect: isCurrentCorrect,
            userAnswer: currentAnswer,
        }]);

        // Move to next or complete
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCurrentAnswer(null);
            setShowFeedback(false);
        } else {
            setIsComplete(true);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setResults([]);
        setCurrentAnswer(null);
        setShowFeedback(false);
        setIsComplete(false);
    };

    const handleExit = () => {
        navigate(-1);
    };

    const correctCount = results.filter(r => r.isCorrect).length + (showFeedback && isCurrentCorrect ? 1 : 0);
    const totalAnswered = results.length + (showFeedback ? 1 : 0);
    const finalScore = isComplete ? Math.round((results.filter(r => r.isCorrect).length / questions.length) * 100) : 0;
    const passed = finalScore >= (node?.pass_score || 70);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto" />
                    <p className="mt-4">Loading test...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <AlertCircle className="h-16 w-16 mx-auto text-yellow-400" />
                    <h2 className="mt-4 text-xl font-bold">No Questions</h2>
                    <p className="mt-2 text-gray-400">This {isBossMode ? 'boss' : 'node'} has no questions yet.</p>
                    <button
                        onClick={handleExit}
                        className="mt-6 rounded-xl bg-white px-6 py-3 font-medium text-gray-900"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Completion screen - minimalist design
    if (isComplete) {
        const correctAnswers = results.filter(r => r.isCorrect).length;
        return (
            <div className="fixed inset-0 flex flex-col bg-white">
                {/* Close button */}
                <div className="absolute top-4 right-4">
                    <button
                        onClick={handleExit}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        {/* Score circle */}
                        <div className={cn(
                            'mx-auto h-32 w-32 rounded-full flex items-center justify-center',
                            passed ? 'bg-green-50' : 'bg-orange-50'
                        )}>
                            <span className={cn(
                                'text-4xl font-bold',
                                passed ? 'text-green-600' : 'text-orange-600'
                            )}>
                                {finalScore}%
                            </span>
                        </div>

                        {/* Result text */}
                        <p className="mt-6 text-gray-500">
                            {correctAnswers} of {questions.length} correct
                        </p>

                        {/* Action buttons */}
                        <div className="mt-10 flex gap-3 justify-center">
                            <button
                                onClick={handleRestart}
                                className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={handleExit}
                                className={cn(
                                    'rounded-full px-6 py-2.5 text-sm font-medium text-white',
                                    passed ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-800'
                                )}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={handleExit}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                    <div className="flex-1 mx-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className={cn('font-medium', SUBJECT_COLORS[subject].text)}>
                                {SUBJECT_LABELS[subject]}
                            </span>
                            <span className="text-gray-500">
                                {currentIndex + 1} / {questions.length}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={cn('h-full transition-all duration-300 bg-gradient-to-r', SUBJECT_COLORS[subject].gradient)}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600 font-medium">{correctCount}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{totalAnswered}</span>
                    </div>
                </div>
            </div>

            {/* Question Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto p-6">
                    {/* Question type badge */}
                    <div className="mb-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {QUESTION_TYPE_LABELS[currentQuestion.type]}
                        </span>
                    </div>

                    {/* Question Component */}
                    <QuestionComponent
                        question={currentQuestion}
                        answer={currentAnswer}
                        onAnswerChange={setCurrentAnswer}
                        showFeedback={showFeedback}
                        isCorrect={isCurrentCorrect}
                        subject={subject}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 px-4 py-4">
                <div className="max-w-2xl mx-auto">
                    {!showFeedback ? (
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={currentAnswer === null}
                            className={cn(
                                'w-full rounded-2xl py-4 font-semibold text-white transition-all',
                                currentAnswer !== null
                                    ? `bg-gradient-to-r ${SUBJECT_COLORS[subject].gradient} hover:opacity-90`
                                    : 'bg-gray-300 cursor-not-allowed'
                            )}
                        >
                            Check Answer
                        </button>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className={cn(
                                'w-full rounded-2xl py-4 font-semibold text-white flex items-center justify-center gap-2',
                                isCurrentCorrect
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                            )}
                        >
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Question Component that renders different question types
interface QuestionComponentProps {
    question: Question;
    answer: unknown;
    onAnswerChange: (answer: unknown) => void;
    showFeedback: boolean;
    isCorrect: boolean;
    subject: SubjectType;
}

function QuestionComponent({ question, answer, onAnswerChange, showFeedback, subject }: QuestionComponentProps) {
    const content = question.content;

    switch (question.type) {
        case 'multiple_choice':
            return (
                <MultipleChoiceQuestion
                    content={content}
                    answer={answer as string | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                    subject={subject}
                />
            );
        case 'find_error':
            return (
                <FindErrorQuestion
                    content={content}
                    answer={answer as number | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'strike_out':
            return (
                <StrikeOutQuestion
                    content={content}
                    answer={answer as Set<number> | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'ordering':
            return (
                <OrderingQuestion
                    content={content}
                    answer={answer as string[] | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'fill_gap':
            return (
                <FillGapQuestion
                    content={content}
                    answer={answer as string | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'trend_arrow':
            return (
                <TrendArrowQuestion
                    content={content}
                    answer={answer as string | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'slider_value':
            return (
                <SliderValueQuestion
                    content={content}
                    answer={answer as number | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'highlight':
            return (
                <HighlightQuestion
                    content={content}
                    answer={answer as string | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'swipe_decision':
            return (
                <SwipeDecisionQuestion
                    content={content}
                    answer={answer as string[] | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'matching':
            return (
                <MatchingQuestion
                    content={content}
                    answer={answer as Map<string, string> | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        case 'graph_point':
            return (
                <GraphPointQuestion
                    content={content}
                    answer={answer as { x: number; y: number } | null}
                    onAnswerChange={onAnswerChange}
                    showFeedback={showFeedback}
                />
            );
        default:
            return <div>Unknown question type</div>;
    }
}

// Individual Question Type Components
function MultipleChoiceQuestion({ content, answer, onAnswerChange, showFeedback, subject }: {
    content: Record<string, unknown>;
    answer: string | null;
    onAnswerChange: (answer: string) => void;
    showFeedback: boolean;
    subject: SubjectType;
}) {
    const options = content.options as Array<{ id: string; text: string; is_correct: boolean }>;
    const correctOption = options.find(o => o.is_correct);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{content.question as string}</h2>
            <div className="space-y-3">
                {options.map((option) => {
                    const isSelected = answer === option.id;
                    const isCorrectOption = option.is_correct;
                    const showAsCorrect = showFeedback && isCorrectOption;
                    const showAsWrong = showFeedback && isSelected && !isCorrectOption;

                    return (
                        <button
                            key={option.id}
                            onClick={() => !showFeedback && onAnswerChange(option.id)}
                            disabled={showFeedback}
                            className={cn(
                                'w-full rounded-2xl border-2 p-4 text-left transition-all',
                                !showFeedback && isSelected && `border-${subject === 'english' ? 'purple' : subject === 'reading' ? 'blue' : subject === 'math' ? 'green' : 'orange'}-500 bg-${subject}-50`,
                                !showFeedback && !isSelected && 'border-gray-200 hover:border-gray-300',
                                showAsCorrect && 'border-green-500 bg-green-50',
                                showAsWrong && 'border-red-500 bg-red-50'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full border-2 font-medium',
                                    !showFeedback && isSelected && 'border-gray-900 bg-gray-900 text-white',
                                    !showFeedback && !isSelected && 'border-gray-300',
                                    showAsCorrect && 'border-green-500 bg-green-500 text-white',
                                    showAsWrong && 'border-red-500 bg-red-500 text-white'
                                )}>
                                    {showAsCorrect ? <Check className="h-5 w-5" /> :
                                        showAsWrong ? <X className="h-5 w-5" /> :
                                            option.id.toUpperCase()}
                                </div>
                                <span className="font-medium">{option.text}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    answer === correctOption?.id ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{answer === correctOption?.id ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

function FindErrorQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: number | null;
    onAnswerChange: (answer: number) => void;
    showFeedback: boolean;
}) {
    const sentence = content.sentence as string;
    const words = sentence.split(' ');
    const errorIndex = content.error_index as number;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Tap the word with an error:</h2>
            <div className="flex flex-wrap gap-2">
                {words.map((word, index) => {
                    const isSelected = answer === index;
                    const isError = index === errorIndex;
                    const showAsCorrect = showFeedback && isError;
                    const showAsWrong = showFeedback && isSelected && !isError;

                    return (
                        <button
                            key={index}
                            onClick={() => !showFeedback && onAnswerChange(index)}
                            disabled={showFeedback}
                            className={cn(
                                'rounded-xl px-4 py-3 text-lg font-medium transition-all',
                                !showFeedback && isSelected && 'bg-blue-500 text-white',
                                !showFeedback && !isSelected && 'bg-gray-100 hover:bg-gray-200',
                                showAsCorrect && 'bg-green-500 text-white',
                                showAsWrong && 'bg-red-500 text-white'
                            )}
                        >
                            {word}
                        </button>
                    );
                })}
            </div>
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    answer === errorIndex ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{answer === errorIndex ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">
                        "{words[errorIndex]}" should be "{content.correct_word as string}"
                    </p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

function StrikeOutQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: Set<number> | null;
    onAnswerChange: (answer: Set<number>) => void;
    showFeedback: boolean;
}) {
    const sentence = content.sentence as string;
    const words = sentence.split(' ');
    const correctIds = new Set(content.correct_ids_to_remove as number[]);
    const striked = answer || new Set<number>();

    const toggleStrike = (index: number) => {
        if (showFeedback) return;
        const newStriked = new Set(striked);
        if (newStriked.has(index)) {
            newStriked.delete(index);
        } else {
            newStriked.add(index);
        }
        onAnswerChange(newStriked);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Strike out the unnecessary words:</h2>
            <div className="flex flex-wrap gap-2">
                {words.map((word, index) => {
                    const isStriked = striked.has(index);
                    const shouldBeStriked = correctIds.has(index);
                    const showAsCorrect = showFeedback && shouldBeStriked;
                    const showAsWrong = showFeedback && isStriked && !shouldBeStriked;

                    return (
                        <button
                            key={index}
                            onClick={() => toggleStrike(index)}
                            disabled={showFeedback}
                            className={cn(
                                'rounded-xl px-4 py-3 text-lg font-medium transition-all',
                                !showFeedback && isStriked && 'bg-gray-400 text-white line-through',
                                !showFeedback && !isStriked && 'bg-gray-100 hover:bg-gray-200',
                                showAsCorrect && 'bg-green-500 text-white line-through',
                                showAsWrong && 'bg-red-500 text-white line-through',
                                showFeedback && !shouldBeStriked && !isStriked && 'bg-gray-100'
                            )}
                        >
                            {word}
                        </button>
                    );
                })}
            </div>
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    striked.size === correctIds.size && [...striked].every(id => correctIds.has(id))
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">
                        {striked.size === correctIds.size && [...striked].every(id => correctIds.has(id))
                            ? 'Correct!'
                            : 'Incorrect'}
                    </p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

function OrderingQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: string[] | null;
    onAnswerChange: (answer: string[]) => void;
    showFeedback: boolean;
}) {
    const items = content.items as Array<{ id: string; content: string }>;
    const correctOrder = content.correct_order as string[];

    // Initialize with shuffled order if no answer
    const [orderedIds, setOrderedIds] = useState<string[]>(() => {
        if (answer) return answer;
        return [...items].sort(() => Math.random() - 0.5).map(i => i.id);
    });

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        if (showFeedback) return;
        setDraggedIndex(index);
    };

    const handleDrop = (dropIndex: number) => {
        if (showFeedback || draggedIndex === null) return;
        const newOrder = [...orderedIds];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dropIndex, 0, removed);
        setOrderedIds(newOrder);
        onAnswerChange(newOrder);
        setDraggedIndex(null);
    };

    // Set initial answer
    useEffect(() => {
        if (!answer) {
            onAnswerChange(orderedIds);
        }
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Arrange in the correct order:</h2>
            <div className="space-y-2">
                {orderedIds.map((id, index) => {
                    const item = items.find(i => i.id === id);
                    const correctIndex = correctOrder.indexOf(id);
                    const isInCorrectPosition = showFeedback && correctIndex === index;
                    const isInWrongPosition = showFeedback && correctIndex !== index;

                    return (
                        <div
                            key={id}
                            draggable={!showFeedback}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(index)}
                            className={cn(
                                'flex items-center gap-4 rounded-2xl border-2 p-4 transition-all',
                                !showFeedback && 'border-gray-200 cursor-grab active:cursor-grabbing hover:border-gray-300',
                                isInCorrectPosition && 'border-green-500 bg-green-50',
                                isInWrongPosition && 'border-red-500 bg-red-50'
                            )}
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                                {index + 1}
                            </span>
                            <span className="font-medium">{item?.content}</span>
                        </div>
                    );
                })}
            </div>
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    JSON.stringify(orderedIds) === JSON.stringify(correctOrder)
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">
                        {JSON.stringify(orderedIds) === JSON.stringify(correctOrder) ? 'Correct!' : 'Incorrect'}
                    </p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

function FillGapQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: string | null;
    onAnswerChange: (answer: string) => void;
    showFeedback: boolean;
}) {
    const correctAnswer = content.correct_answer as string;
    const isCorrect = (answer || '').toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{content.question as string}</h2>
            <input
                type="text"
                value={answer || ''}
                onChange={(e) => !showFeedback && onAnswerChange(e.target.value)}
                disabled={showFeedback}
                placeholder="Type your answer..."
                className={cn(
                    'w-full rounded-2xl border-2 p-4 text-lg outline-none transition-colors',
                    !showFeedback && 'border-gray-200 focus:border-blue-500',
                    showFeedback && isCorrect && 'border-green-500 bg-green-50',
                    showFeedback && !isCorrect && 'border-red-500 bg-red-50'
                )}
            />
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">Correct answer: {correctAnswer}</p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

function TrendArrowQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: string | null;
    onAnswerChange: (answer: string) => void;
    showFeedback: boolean;
}) {
    const correctTrend = content.correct_trend as string;
    const options = [
        { value: 'increase', label: 'Increase', icon: '↑', color: 'text-green-600 bg-green-50 border-green-200' },
        { value: 'no_change', label: 'No Change', icon: '→', color: 'text-gray-600 bg-gray-50 border-gray-200' },
        { value: 'decrease', label: 'Decrease', icon: '↓', color: 'text-red-600 bg-red-50 border-red-200' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{content.question as string}</h2>
            <div className="grid grid-cols-3 gap-3">
                {options.map((option) => {
                    const isSelected = answer === option.value;
                    const isCorrectAnswer = showFeedback && option.value === correctTrend;
                    const isWrongAnswer = showFeedback && isSelected && option.value !== correctTrend;

                    return (
                        <button
                            key={option.value}
                            onClick={() => !showFeedback && onAnswerChange(option.value)}
                            disabled={showFeedback}
                            className={cn(
                                'flex flex-col items-center gap-2 rounded-2xl border-2 p-6 transition-all',
                                !showFeedback && isSelected && 'border-blue-500 bg-blue-50',
                                !showFeedback && !isSelected && 'border-gray-200 hover:border-gray-300',
                                isCorrectAnswer && 'border-green-500 bg-green-50',
                                isWrongAnswer && 'border-red-500 bg-red-50'
                            )}
                        >
                            <span className="text-4xl">{option.icon}</span>
                            <span className="font-medium">{option.label}</span>
                        </button>
                    );
                })}
            </div>
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    answer === correctTrend ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{answer === correctTrend ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

function SliderValueQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: number | null;
    onAnswerChange: (answer: number) => void;
    showFeedback: boolean;
}) {
    const minValue = content.min_value as number;
    const maxValue = content.max_value as number;
    const correctValue = content.correct_value as number;
    const tolerance = content.tolerance as number;
    const unit = content.unit as string;
    const currentValue = answer ?? Math.round((minValue + maxValue) / 2);
    const isCorrect = Math.abs(currentValue - correctValue) <= tolerance;
    const percentage = ((currentValue - minValue) / (maxValue - minValue)) * 100;

    useEffect(() => {
        if (answer === null) {
            onAnswerChange(Math.round((minValue + maxValue) / 2));
        }
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{content.question as string}</h2>
            {content.image_description ? (
                <div className="rounded-2xl bg-gray-100 p-8 text-center text-gray-500">
                    [Image: {String(content.image_description)}]
                </div>
            ) : null}
            <div className="space-y-4">
                <div className="text-center">
                    <span className="text-4xl font-bold text-gray-900">{currentValue}</span>
                    <span className="ml-2 text-xl text-gray-500">{unit}</span>
                </div>
                <div className="relative h-12 px-4">
                    <div className="absolute inset-y-0 left-4 right-4 my-auto h-3 rounded-full bg-gray-200" />
                    <div
                        className={cn(
                            'absolute inset-y-0 left-4 my-auto h-3 rounded-full transition-colors',
                            !showFeedback && 'bg-blue-500',
                            showFeedback && isCorrect && 'bg-green-500',
                            showFeedback && !isCorrect && 'bg-red-500'
                        )}
                        style={{ width: `calc(${percentage}% - 16px)` }}
                    />
                    <input
                        type="range"
                        min={minValue}
                        max={maxValue}
                        value={currentValue}
                        onChange={(e) => !showFeedback && onAnswerChange(Number(e.target.value))}
                        disabled={showFeedback}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                        className={cn(
                            'absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-4 shadow-lg transition-colors',
                            !showFeedback && 'bg-white border-blue-500',
                            showFeedback && isCorrect && 'bg-green-500 border-green-600',
                            showFeedback && !isCorrect && 'bg-red-500 border-red-600'
                        )}
                        style={{ left: `calc(${percentage}% - 16px)` }}
                    />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                    <span>{minValue} {unit}</span>
                    <span>{maxValue} {unit}</span>
                </div>
            </div>
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">Correct answer: {correctValue} {unit} (±{tolerance})</p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

function HighlightQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: string | null;
    onAnswerChange: (answer: string) => void;
    showFeedback: boolean;
}) {
    const passage = content.passage as string;
    const correctPhrase = content.correct_phrase as string;
    const isCorrect = answer && (
        answer.toLowerCase().includes(correctPhrase.toLowerCase()) ||
        correctPhrase.toLowerCase().includes(answer.toLowerCase())
    );

    const handleSelection = () => {
        if (showFeedback) return;
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            onAnswerChange(selection.toString().trim());
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{content.question as string}</h2>
            <div
                onMouseUp={handleSelection}
                className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-gray-700 leading-relaxed select-text cursor-text"
            >
                {passage}
            </div>
            {answer && !showFeedback && (
                <div className="rounded-xl bg-blue-50 p-4 text-blue-800">
                    <span className="font-medium">Selected: </span>"{answer}"
                </div>
            )}
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">Correct answer: "{correctPhrase}"</p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

function SwipeDecisionQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: string[] | null;
    onAnswerChange: (answer: string[]) => void;
    showFeedback: boolean;
}) {
    const cards = content.cards as Array<{ content: string; correct_swipe: string; explanation: string }>;
    const labels = content.labels as { left: string; right: string };
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>(answer || []);
    const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

    const isComplete = currentCardIndex >= cards.length;
    const currentCard = cards[currentCardIndex];

    const handleSwipe = (direction: 'left' | 'right') => {
        if (showFeedback || isComplete) return;
        setSwipeDirection(direction);

        setTimeout(() => {
            const newAnswers = [...answers, direction];
            setAnswers(newAnswers);
            onAnswerChange(newAnswers);
            setCurrentCardIndex(currentCardIndex + 1);
            setSwipeDirection(null);
        }, 300);
    };

    const correctCount = answers.filter((a, i) => a === cards[i]?.correct_swipe).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between text-sm text-gray-500">
                <span className="font-medium text-red-600">{labels.left}</span>
                <span>{isComplete ? cards.length : currentCardIndex + 1} / {cards.length}</span>
                <span className="font-medium text-green-600">{labels.right}</span>
            </div>

            {!isComplete ? (
                <>
                    <div className={cn(
                        'relative h-48 rounded-2xl border-2 border-gray-200 bg-white p-6 flex items-center justify-center transition-all duration-300',
                        swipeDirection === 'left' && '-translate-x-full rotate-[-10deg] opacity-0',
                        swipeDirection === 'right' && 'translate-x-full rotate-[10deg] opacity-0'
                    )}>
                        <p className="text-center text-lg font-medium">{currentCard.content}</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSwipe('left')}
                            className="flex-1 rounded-2xl border-2 border-red-200 bg-red-50 py-4 font-medium text-red-600 hover:bg-red-100"
                        >
                            {labels.left}
                        </button>
                        <button
                            onClick={() => handleSwipe('right')}
                            className="flex-1 rounded-2xl border-2 border-green-200 bg-green-50 py-4 font-medium text-green-600 hover:bg-green-100"
                        >
                            {labels.right}
                        </button>
                    </div>
                </>
            ) : (
                <div className={cn(
                    'rounded-2xl p-6 text-center',
                    correctCount === cards.length ? 'bg-green-50' : 'bg-yellow-50'
                )}>
                    <p className="text-3xl font-bold">
                        {correctCount} / {cards.length}
                    </p>
                    <p className="mt-2 text-gray-600">
                        {correctCount === cards.length ? 'Perfect!' : 'Cards completed'}
                    </p>
                </div>
            )}
        </div>
    );
}

function MatchingQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: Map<string, string> | null;
    onAnswerChange: (answer: Map<string, string>) => void;
    showFeedback: boolean;
}) {
    const pairs = content.pairs as Array<{ id: string; left: string; right: string }>;
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matches, setMatches] = useState<Map<string, string>>(answer || new Map());

    const shuffledRight = useState(() =>
        [...pairs].sort(() => Math.random() - 0.5).map(p => ({ id: p.id, right: p.right }))
    )[0];

    const handleLeftClick = (id: string) => {
        if (showFeedback || matches.has(id)) return;
        setSelectedLeft(id);
    };

    const handleRightClick = (rightId: string) => {
        if (showFeedback || !selectedLeft) return;
        const newMatches = new Map(matches);
        newMatches.set(selectedLeft, rightId);
        setMatches(newMatches);
        onAnswerChange(newMatches);
        setSelectedLeft(null);
    };

    const checkCorrect = () => {
        let correct = 0;
        matches.forEach((rightId, leftId) => {
            if (leftId === rightId) correct++;
        });
        return correct;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Match the pairs:</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    {pairs.map((pair) => (
                        <button
                            key={pair.id}
                            onClick={() => handleLeftClick(pair.id)}
                            disabled={matches.has(pair.id) || showFeedback}
                            className={cn(
                                'w-full rounded-xl border-2 p-4 text-left transition-all',
                                selectedLeft === pair.id && 'border-blue-500 bg-blue-50',
                                matches.has(pair.id) && 'border-green-300 bg-green-50 opacity-60',
                                !matches.has(pair.id) && selectedLeft !== pair.id && 'border-gray-200 hover:border-gray-300'
                            )}
                        >
                            {pair.left}
                        </button>
                    ))}
                </div>
                <div className="space-y-2">
                    {shuffledRight.map((item) => {
                        const isMatched = [...matches.values()].includes(item.id);
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleRightClick(item.id)}
                                disabled={isMatched || showFeedback}
                                className={cn(
                                    'w-full rounded-xl border-2 p-4 text-left transition-all',
                                    isMatched && 'border-green-300 bg-green-50 opacity-60',
                                    !isMatched && selectedLeft && 'border-gray-200 hover:border-blue-300 hover:bg-blue-50',
                                    !isMatched && !selectedLeft && 'border-gray-200'
                                )}
                            >
                                {item.right}
                            </button>
                        );
                    })}
                </div>
            </div>
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    checkCorrect() === pairs.length ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">
                        {checkCorrect() === pairs.length ? 'All correct!' : `${checkCorrect()} / ${pairs.length} correct`}
                    </p>
                </div>
            )}
        </div>
    );
}

function GraphPointQuestion({ content, answer, onAnswerChange, showFeedback }: {
    content: Record<string, unknown>;
    answer: { x: number; y: number } | null;
    onAnswerChange: (answer: { x: number; y: number }) => void;
    showFeedback: boolean;
}) {
    const targetX = content.target_x as number;
    const targetY = content.target_y as number;
    const radius = content.radius as number;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (showFeedback) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 10);
        const y = Math.round((1 - (e.clientY - rect.top) / rect.height) * 10);
        onAnswerChange({ x, y });
    };

    const distance = answer
        ? Math.sqrt(Math.pow(answer.x - targetX, 2) + Math.pow(answer.y - targetY, 2))
        : Infinity;
    const isCorrect = distance <= radius;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{content.graph_description as string}</h2>
            <div
                onClick={handleClick}
                className="relative h-64 rounded-2xl border-2 border-gray-200 bg-white cursor-crosshair"
            >
                {/* Grid */}
                {[...Array(11)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${i * 10}%` }} />
                ))}
                {[...Array(11)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-gray-100" style={{ left: `${i * 10}%` }} />
                ))}

                {/* Target area */}
                {showFeedback && (
                    <div
                        className="absolute rounded-full bg-green-200 opacity-50"
                        style={{
                            left: `${targetX * 10}%`,
                            bottom: `${targetY * 10}%`,
                            width: `${radius * 20}%`,
                            height: `${radius * 20}%`,
                            transform: 'translate(-50%, 50%)',
                        }}
                    />
                )}

                {/* User point */}
                {answer && (
                    <div
                        className={cn(
                            'absolute h-5 w-5 rounded-full transform -translate-x-1/2 translate-y-1/2',
                            !showFeedback && 'bg-blue-500',
                            showFeedback && isCorrect && 'bg-green-500',
                            showFeedback && !isCorrect && 'bg-red-500'
                        )}
                        style={{
                            left: `${answer.x * 10}%`,
                            bottom: `${answer.y * 10}%`,
                        }}
                    />
                )}
            </div>
            {answer && (
                <p className="text-center text-sm text-gray-500">
                    Selected: ({answer.x}, {answer.y})
                </p>
            )}
            {showFeedback && (
                <div className={cn(
                    'rounded-2xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">Target: ({targetX}, {targetY})</p>
                    <p className="mt-1 text-sm">{content.explanation as string}</p>
                </div>
            )}
        </div>
    );
}

export default TestModePage;
