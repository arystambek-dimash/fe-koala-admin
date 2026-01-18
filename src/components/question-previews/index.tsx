import { useState } from 'react';
import type {
    QuestionType,
    MultipleChoiceContent,
    FindErrorContent,
    StrikeOutContent,
    OrderingContent,
    HighlightContent,
    SwipeDecisionContent,
    FillGapContent,
    MatchingContent,
    GraphPointContent,
    TrendArrowContent,
    SliderValueContent,
} from '@/types';
import { cn } from '@/lib/utils';
import { Check, ArrowUp, ArrowDown, Minus, GripVertical } from 'lucide-react';

// Multiple Choice Preview
function MultipleChoicePreview({ content }: { content: MultipleChoiceContent }) {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (selected) setSubmitted(true);
    };

    const isCorrect = content.options.find(o => o.id === selected)?.is_correct;

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">{content.question}</p>
            <div className="space-y-2">
                {content.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => !submitted && setSelected(option.id)}
                        className={cn(
                            'w-full rounded-xl border-2 p-4 text-left transition-all',
                            !submitted && selected === option.id && 'border-blue-500 bg-blue-50',
                            !submitted && selected !== option.id && 'border-gray-200 hover:border-gray-300',
                            submitted && option.is_correct && 'border-green-500 bg-green-50',
                            submitted && selected === option.id && !option.is_correct && 'border-red-500 bg-red-50'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full border-2',
                                !submitted && selected === option.id && 'border-blue-500 bg-blue-500',
                                !submitted && selected !== option.id && 'border-gray-300',
                                submitted && option.is_correct && 'border-green-500 bg-green-500',
                                submitted && selected === option.id && !option.is_correct && 'border-red-500 bg-red-500'
                            )}>
                                {(selected === option.id || (submitted && option.is_correct)) && (
                                    <Check className="h-4 w-4 text-white" />
                                )}
                            </div>
                            <span className="font-medium">{option.text}</span>
                        </div>
                    </button>
                ))}
            </div>
            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={!selected}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Find Error Preview
function FindErrorPreview({ content }: { content: FindErrorContent }) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const words = content.sentence.split(' ');
    const isCorrect = selectedIndex === content.error_index;

    const handleSubmit = () => {
        if (selectedIndex !== null) setSubmitted(true);
    };

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">Tap the word with an error:</p>
            <div className="flex flex-wrap gap-2">
                {words.map((word, index) => (
                    <button
                        key={index}
                        onClick={() => !submitted && setSelectedIndex(index)}
                        className={cn(
                            'rounded-lg px-3 py-2 text-lg font-medium transition-all',
                            !submitted && selectedIndex === index && 'bg-blue-500 text-white',
                            !submitted && selectedIndex !== index && 'bg-gray-100 hover:bg-gray-200',
                            submitted && index === content.error_index && 'bg-green-500 text-white',
                            submitted && selectedIndex === index && index !== content.error_index && 'bg-red-500 text-white'
                        )}
                    >
                        {word}
                    </button>
                ))}
            </div>
            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={selectedIndex === null}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">
                        The correct word is "{words[content.error_index]}" → "{content.correct_word}"
                    </p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Strike Out Preview
function StrikeOutPreview({ content }: { content: StrikeOutContent }) {
    const [strikedIds, setStrikedIds] = useState<Set<number>>(new Set());
    const [submitted, setSubmitted] = useState(false);

    const words = content.sentence.split(' ');

    const toggleStrike = (index: number) => {
        if (submitted) return;
        const newStriked = new Set(strikedIds);
        if (newStriked.has(index)) {
            newStriked.delete(index);
        } else {
            newStriked.add(index);
        }
        setStrikedIds(newStriked);
    };

    const correctSet = new Set(content.correct_ids_to_remove);
    const isCorrect = strikedIds.size === correctSet.size &&
        [...strikedIds].every(id => correctSet.has(id));

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">Strike out the unnecessary words:</p>
            <div className="flex flex-wrap gap-2">
                {words.map((word, index) => (
                    <button
                        key={index}
                        onClick={() => toggleStrike(index)}
                        className={cn(
                            'rounded-lg px-3 py-2 text-lg font-medium transition-all',
                            !submitted && strikedIds.has(index) && 'bg-gray-300 line-through',
                            !submitted && !strikedIds.has(index) && 'bg-gray-100 hover:bg-gray-200',
                            submitted && correctSet.has(index) && 'bg-green-100 line-through text-green-800',
                            submitted && strikedIds.has(index) && !correctSet.has(index) && 'bg-red-100 line-through text-red-800'
                        )}
                    >
                        {word}
                    </button>
                ))}
            </div>
            {!submitted ? (
                <button
                    onClick={() => setSubmitted(true)}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Ordering Preview
function OrderingPreview({ content }: { content: OrderingContent }) {
    const [items, setItems] = useState(() =>
        [...content.items].sort(() => Math.random() - 0.5)
    );
    const [submitted, setSubmitted] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDrop = (dropIndex: number) => {
        if (draggedIndex === null) return;
        const newItems = [...items];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(dropIndex, 0, removed);
        setItems(newItems);
        setDraggedIndex(null);
    };

    const isCorrect = items.every((item, index) => item.id === content.correct_order[index]);

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">Arrange in the correct order:</p>
            <div className="space-y-2">
                {items.map((item, index) => {
                    const correctIndex = content.correct_order.indexOf(item.id);
                    const isInCorrectPosition = submitted && correctIndex === index;
                    const isInWrongPosition = submitted && correctIndex !== index;

                    return (
                        <div
                            key={item.id}
                            draggable={!submitted}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(index)}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border-2 p-4 transition-all',
                                !submitted && 'border-gray-200 cursor-grab active:cursor-grabbing hover:border-gray-300',
                                isInCorrectPosition && 'border-green-500 bg-green-50',
                                isInWrongPosition && 'border-red-500 bg-red-50'
                            )}
                        >
                            <GripVertical className="h-5 w-5 text-gray-400" />
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                                {index + 1}
                            </span>
                            <span className="font-medium">{item.content}</span>
                        </div>
                    );
                })}
            </div>
            {!submitted ? (
                <button
                    onClick={() => setSubmitted(true)}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Highlight Preview
function HighlightPreview({ content }: { content: HighlightContent }) {
    const [selectedText, setSelectedText] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            setSelectedText(selection.toString().trim());
        }
    };

    const isCorrect = selectedText.toLowerCase().includes(content.correct_phrase.toLowerCase()) ||
        content.correct_phrase.toLowerCase().includes(selectedText.toLowerCase());

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">{content.question}</p>
            <div
                onMouseUp={handleSelection}
                className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-gray-700 leading-relaxed select-text cursor-text"
            >
                {content.passage}
            </div>
            {selectedText && !submitted && (
                <div className="rounded-lg bg-blue-50 p-3 text-blue-800">
                    <span className="text-sm font-medium">Selected: </span>
                    <span className="text-sm">"{selectedText}"</span>
                </div>
            )}
            {!submitted ? (
                <button
                    onClick={() => selectedText && setSubmitted(true)}
                    disabled={!selectedText}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">Correct answer: "{content.correct_phrase}"</p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Swipe Decision Preview
function SwipeDecisionPreview({ content }: { content: SwipeDecisionContent }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<boolean[]>([]);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

    const currentCard = content.cards[currentIndex];
    const isComplete = currentIndex >= content.cards.length;

    const handleSwipe = (direction: 'left' | 'right') => {
        if (isComplete) return;
        setSwipeDirection(direction);
        const isCorrect = direction === currentCard.correct_swipe;

        setTimeout(() => {
            setResults([...results, isCorrect]);
            setCurrentIndex(currentIndex + 1);
            setSwipeDirection(null);
        }, 300);
    };

    const correctCount = results.filter(r => r).length;

    return (
        <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500">
                <span>{content.labels.left}</span>
                <span>{currentIndex + 1} / {content.cards.length}</span>
                <span>{content.labels.right}</span>
            </div>

            {!isComplete ? (
                <>
                    <div className={cn(
                        'relative h-48 rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300',
                        swipeDirection === 'left' && '-translate-x-full rotate-[-10deg] opacity-0',
                        swipeDirection === 'right' && 'translate-x-full rotate-[10deg] opacity-0'
                    )}>
                        <p className="text-center text-lg font-medium">{currentCard.content}</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSwipe('left')}
                            className="flex-1 rounded-xl border-2 border-red-200 bg-red-50 py-4 font-medium text-red-600 hover:bg-red-100"
                        >
                            {content.labels.left}
                        </button>
                        <button
                            onClick={() => handleSwipe('right')}
                            className="flex-1 rounded-xl border-2 border-green-200 bg-green-50 py-4 font-medium text-green-600 hover:bg-green-100"
                        >
                            {content.labels.right}
                        </button>
                    </div>
                </>
            ) : (
                <div className={cn(
                    'rounded-xl p-6 text-center',
                    correctCount === content.cards.length ? 'bg-green-50' : 'bg-yellow-50'
                )}>
                    <p className="text-2xl font-bold">
                        {correctCount} / {content.cards.length}
                    </p>
                    <p className="mt-2 text-gray-600">
                        {correctCount === content.cards.length ? 'Perfect!' : 'Keep practicing!'}
                    </p>
                </div>
            )}
        </div>
    );
}

// Fill Gap Preview
function FillGapPreview({ content }: { content: FillGapContent }) {
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const isCorrect = answer.toLowerCase().trim() === content.correct_answer.toLowerCase().trim();

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">{content.question}</p>
            <input
                type="text"
                value={answer}
                onChange={(e) => !submitted && setAnswer(e.target.value)}
                placeholder="Type your answer..."
                className={cn(
                    'w-full rounded-xl border-2 p-4 text-lg outline-none transition-colors',
                    !submitted && 'border-gray-200 focus:border-blue-500',
                    submitted && isCorrect && 'border-green-500 bg-green-50',
                    submitted && !isCorrect && 'border-red-500 bg-red-50'
                )}
            />
            {!submitted ? (
                <button
                    onClick={() => answer && setSubmitted(true)}
                    disabled={!answer}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">Correct answer: {content.correct_answer}</p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Matching Preview
function MatchingPreview({ content }: { content: MatchingContent }) {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matches, setMatches] = useState<Map<string, string>>(new Map());
    const [submitted, setSubmitted] = useState(false);

    const shuffledRight = useState(() =>
        [...content.pairs].sort(() => Math.random() - 0.5).map(p => ({ id: p.id, right: p.right }))
    )[0];

    const handleLeftClick = (id: string) => {
        if (submitted || matches.has(id)) return;
        setSelectedLeft(id);
    };

    const handleRightClick = (rightId: string) => {
        if (submitted || !selectedLeft) return;
        const newMatches = new Map(matches);
        newMatches.set(selectedLeft, rightId);
        setMatches(newMatches);
        setSelectedLeft(null);
    };

    const checkCorrect = () => {
        let correct = 0;
        matches.forEach((rightId, leftId) => {
            const pair = content.pairs.find(p => p.id === leftId);
            if (pair && pair.id === rightId) correct++;
        });
        return correct;
    };

    const isAllCorrect = checkCorrect() === content.pairs.length;

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">Match the pairs:</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    {content.pairs.map((pair) => (
                        <button
                            key={pair.id}
                            onClick={() => handleLeftClick(pair.id)}
                            disabled={matches.has(pair.id)}
                            className={cn(
                                'w-full rounded-xl border-2 p-3 text-left transition-all',
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
                                disabled={isMatched}
                                className={cn(
                                    'w-full rounded-xl border-2 p-3 text-left transition-all',
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
            {!submitted ? (
                <button
                    onClick={() => matches.size === content.pairs.length && setSubmitted(true)}
                    disabled={matches.size !== content.pairs.length}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isAllCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">
                        {isAllCorrect ? 'All correct!' : `${checkCorrect()} / ${content.pairs.length} correct`}
                    </p>
                </div>
            )}
        </div>
    );
}

// Graph Point Preview
function GraphPointPreview({ content }: { content: GraphPointContent }) {
    const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (submitted) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 10);
        const y = Math.round((1 - (e.clientY - rect.top) / rect.height) * 10);
        setPoint({ x, y });
    };

    const distance = point
        ? Math.sqrt(Math.pow(point.x - content.target_x, 2) + Math.pow(point.y - content.target_y, 2))
        : Infinity;
    const isCorrect = distance <= content.radius;

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">{content.graph_description}</p>
            <div
                onClick={handleClick}
                className="relative h-64 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-crosshair"
            >
                {/* Grid lines */}
                {[...Array(11)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: `${i * 10}%` }} />
                ))}
                {[...Array(11)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-gray-200" style={{ left: `${i * 10}%` }} />
                ))}

                {/* Target area (shown after submit) */}
                {submitted && (
                    <div
                        className="absolute rounded-full bg-green-200 opacity-50"
                        style={{
                            left: `${content.target_x * 10}%`,
                            bottom: `${content.target_y * 10}%`,
                            width: `${content.radius * 20}%`,
                            height: `${content.radius * 20}%`,
                            transform: 'translate(-50%, 50%)',
                        }}
                    />
                )}

                {/* User point */}
                {point && (
                    <div
                        className={cn(
                            'absolute h-4 w-4 rounded-full transform -translate-x-1/2 translate-y-1/2',
                            !submitted && 'bg-blue-500',
                            submitted && isCorrect && 'bg-green-500',
                            submitted && !isCorrect && 'bg-red-500'
                        )}
                        style={{
                            left: `${point.x * 10}%`,
                            bottom: `${point.y * 10}%`,
                        }}
                    />
                )}
            </div>
            {point && (
                <p className="text-center text-sm text-gray-500">
                    Selected point: ({point.x}, {point.y})
                </p>
            )}
            {!submitted ? (
                <button
                    onClick={() => point && setSubmitted(true)}
                    disabled={!point}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">Target: ({content.target_x}, {content.target_y})</p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Trend Arrow Preview
function TrendArrowPreview({ content }: { content: TrendArrowContent }) {
    const [selected, setSelected] = useState<'increase' | 'decrease' | 'no_change' | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const isCorrect = selected === content.correct_trend;

    const options = [
        { value: 'increase' as const, label: 'Increase', icon: ArrowUp, color: 'text-green-600 bg-green-50 border-green-200' },
        { value: 'no_change' as const, label: 'No Change', icon: Minus, color: 'text-gray-600 bg-gray-50 border-gray-200' },
        { value: 'decrease' as const, label: 'Decrease', icon: ArrowDown, color: 'text-red-600 bg-red-50 border-red-200' },
    ];

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">{content.question}</p>
            <div className="grid grid-cols-3 gap-3">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selected === option.value;
                    const isCorrectAnswer = submitted && option.value === content.correct_trend;
                    const isWrongAnswer = submitted && isSelected && !isCorrect;

                    return (
                        <button
                            key={option.value}
                            onClick={() => !submitted && setSelected(option.value)}
                            className={cn(
                                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                                !submitted && isSelected && 'border-blue-500 bg-blue-50',
                                !submitted && !isSelected && 'border-gray-200 hover:border-gray-300',
                                isCorrectAnswer && 'border-green-500 bg-green-50',
                                isWrongAnswer && 'border-red-500 bg-red-50'
                            )}
                        >
                            <Icon className={cn('h-8 w-8', option.color.split(' ')[0])} />
                            <span className="font-medium">{option.label}</span>
                        </button>
                    );
                })}
            </div>
            {!submitted ? (
                <button
                    onClick={() => selected && setSubmitted(true)}
                    disabled={!selected}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Slider Value Preview
function SliderValuePreview({ content }: { content: SliderValueContent }) {
    const [value, setValue] = useState((content.min_value + content.max_value) / 2);
    const [submitted, setSubmitted] = useState(false);

    const isCorrect = Math.abs(value - content.correct_value) <= content.tolerance;
    const percentage = ((value - content.min_value) / (content.max_value - content.min_value)) * 100;

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">{content.question}</p>
            {content.image_description && (
                <div className="rounded-xl bg-gray-100 p-4 text-center text-gray-500">
                    [Image: {content.image_description}]
                </div>
            )}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>{content.min_value} {content.unit}</span>
                    <span className="text-lg font-bold text-gray-900">{value} {content.unit}</span>
                    <span>{content.max_value} {content.unit}</span>
                </div>
                <div className="relative h-8">
                    <div className="absolute inset-y-0 left-0 right-0 my-auto h-2 rounded-full bg-gray-200" />
                    <div
                        className="absolute inset-y-0 left-0 my-auto h-2 rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                    />
                    <input
                        type="range"
                        min={content.min_value}
                        max={content.max_value}
                        value={value}
                        onChange={(e) => !submitted && setValue(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                        className={cn(
                            'absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 shadow',
                            !submitted && 'bg-white border-blue-500',
                            submitted && isCorrect && 'bg-green-500 border-green-500',
                            submitted && !isCorrect && 'bg-red-500 border-red-500'
                        )}
                        style={{ left: `calc(${percentage}% - 12px)` }}
                    />
                </div>
            </div>
            {!submitted ? (
                <button
                    onClick={() => setSubmitted(true)}
                    className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={cn(
                    'rounded-xl p-4',
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="mt-1 text-sm">
                        Correct answer: {content.correct_value} {content.unit} (±{content.tolerance})
                    </p>
                    <p className="mt-1 text-sm">{content.explanation}</p>
                </div>
            )}
        </div>
    );
}

// Main Preview Renderer
interface QuestionPreviewProps {
    type: QuestionType;
    content: Record<string, unknown>;
}

export function QuestionPreview({ type, content }: QuestionPreviewProps) {
    const key = JSON.stringify(content); // Reset state when content changes

    switch (type) {
        case 'multiple_choice':
            return <MultipleChoicePreview key={key} content={content as unknown as MultipleChoiceContent} />;
        case 'find_error':
            return <FindErrorPreview key={key} content={content as unknown as FindErrorContent} />;
        case 'strike_out':
            return <StrikeOutPreview key={key} content={content as unknown as StrikeOutContent} />;
        case 'ordering':
            return <OrderingPreview key={key} content={content as unknown as OrderingContent} />;
        case 'highlight':
            return <HighlightPreview key={key} content={content as unknown as HighlightContent} />;
        case 'swipe_decision':
            return <SwipeDecisionPreview key={key} content={content as unknown as SwipeDecisionContent} />;
        case 'fill_gap':
            return <FillGapPreview key={key} content={content as unknown as FillGapContent} />;
        case 'matching':
            return <MatchingPreview key={key} content={content as unknown as MatchingContent} />;
        case 'graph_point':
            return <GraphPointPreview key={key} content={content as unknown as GraphPointContent} />;
        case 'trend_arrow':
            return <TrendArrowPreview key={key} content={content as unknown as TrendArrowContent} />;
        case 'slider_value':
            return <SliderValuePreview key={key} content={content as unknown as SliderValueContent} />;
        default:
            return <div className="text-gray-500">Unknown question type</div>;
    }
}
