import { Plus, Trash2, HelpCircle, CheckCircle, AlertCircle, ArrowUpDown, MousePointerClick, Type, ListOrdered, MessageSquare, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
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

// Props for all form components
interface FormProps<T> {
    value: T;
    onChange: (value: T) => void;
}

// Reusable section header component
function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                <Icon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
                <h4 className="font-medium text-gray-900">{title}</h4>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
    );
}

// Reusable field wrapper with label and helper
function FormField({ label, helper, required, children }: { label: string; helper?: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="grid gap-2">
            <Label className="flex items-center gap-1">
                {label}
                {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
            {helper && <p className="text-xs text-gray-500">{helper}</p>}
        </div>
    );
}

// Multiple Choice Form
export function MultipleChoiceForm({ value, onChange }: FormProps<MultipleChoiceContent>) {
    const addOption = () => {
        const newId = String.fromCharCode(65 + value.options.length);
        onChange({
            ...value,
            options: [...value.options, { id: newId, text: '', is_correct: false }],
        });
    };

    const removeOption = (index: number) => {
        onChange({
            ...value,
            options: value.options.filter((_, i) => i !== index),
        });
    };

    const updateOption = (index: number, field: string, val: string | boolean) => {
        const newOptions = [...value.options];
        if (field === 'is_correct' && val === true) {
            newOptions.forEach((opt, i) => {
                opt.is_correct = i === index;
            });
        } else {
            newOptions[index] = { ...newOptions[index], [field]: val };
        }
        onChange({ ...value, options: newOptions });
    };

    const hasCorrectAnswer = value.options.some(opt => opt.is_correct);

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={HelpCircle}
                title="Multiple Choice Question"
                description="Create a question with multiple options. Students select one correct answer."
            />

            {/* Step 1: Question */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Write the Question
                </div>
                <FormField label="Question Text" required>
                    <Textarea
                        value={value.question}
                        onChange={(e) => onChange({ ...value, question: e.target.value })}
                        placeholder="Example: What is the capital of France?"
                        rows={2}
                    />
                </FormField>
            </div>

            {/* Step 2: Options */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                        Add Answer Options
                    </div>
                    <button
                        type="button"
                        onClick={addOption}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Option
                    </button>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                    {!hasCorrectAnswer && (
                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-700">
                            <AlertCircle className="h-4 w-4" />
                            Click the circle to mark the correct answer
                        </div>
                    )}
                    {value.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updateOption(index, 'is_correct', true)}
                                className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
                                    option.is_correct
                                        ? 'border-green-500 bg-green-500 text-white shadow-md'
                                        : 'border-gray-300 text-gray-500 hover:border-green-300 hover:bg-green-50'
                                )}
                                title={option.is_correct ? 'Correct answer' : 'Click to mark as correct'}
                            >
                                {option.is_correct ? <CheckCircle className="h-5 w-5" /> : option.id}
                            </button>
                            <Input
                                value={option.text}
                                onChange={(e) => updateOption(index, 'text', e.target.value)}
                                placeholder={`Option ${option.id} - Enter answer text`}
                                className={cn('flex-1', option.is_correct && 'border-green-300 bg-green-50')}
                            />
                            {value.options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    className="p-2 text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 3: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Explain the Answer
                </div>
                <FormField label="Explanation" helper="This will be shown after the student answers">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder="Example: Paris is the capital of France because..."
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Find Error Form (English)
export function FindErrorForm({ value, onChange }: FormProps<FindErrorContent>) {
    const words = value.sentence.split(' ').filter(w => w.length > 0);
    const selectedWord = words[value.error_index];

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={AlertCircle}
                title="Find the Error"
                description="Write a sentence with a grammatical error. Students must identify the wrong word."
            />

            {/* Step 1: Sentence */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Write the Sentence with an Error
                </div>
                <FormField
                    label="Sentence"
                    required
                    helper="Include one grammatical mistake that students need to find"
                >
                    <Textarea
                        value={value.sentence}
                        onChange={(e) => onChange({ ...value, sentence: e.target.value })}
                        placeholder='Example: She go to the store every day.'
                        rows={2}
                    />
                </FormField>
            </div>

            {/* Step 2: Select Error Word */}
            {words.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                        Click the Word with the Error
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-wrap gap-2">
                            {words.map((word, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => onChange({ ...value, error_index: index })}
                                    className={cn(
                                        'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                        value.error_index === index
                                            ? 'bg-red-500 text-white shadow-md ring-2 ring-red-200'
                                            : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
                                    )}
                                >
                                    {word}
                                </button>
                            ))}
                        </div>
                        {selectedWord && (
                            <p className="mt-3 text-sm text-gray-600">
                                Selected error: <span className="font-medium text-red-600">"{selectedWord}"</span>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Correct Word */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Enter the Correct Word
                </div>
                <FormField
                    label="Correct Word"
                    required
                    helper={selectedWord ? `What should replace "${selectedWord}"?` : 'The word that fixes the error'}
                >
                    <Input
                        value={value.correct_word}
                        onChange={(e) => onChange({ ...value, correct_word: e.target.value })}
                        placeholder='Example: goes'
                    />
                </FormField>
                {selectedWord && value.correct_word && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm">
                        <span className="text-gray-600">Corrected sentence: </span>
                        <span className="text-gray-900">
                            {words.map((w, i) => i === value.error_index ? <span key={i} className="font-medium text-green-600">{value.correct_word}</span> : <span key={i}>{w}</span>).reduce((prev, curr, i) => <>{prev}{i > 0 ? ' ' : ''}{curr}</>, <></>)}
                        </span>
                    </div>
                )}
            </div>

            {/* Step 4: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">4</span>
                    Explain the Error
                </div>
                <FormField label="Explanation" helper="Why is this incorrect? What grammar rule applies?">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder='Example: "Go" should be "goes" because the subject "she" is third person singular...'
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Strike Out Form (English)
export function StrikeOutForm({ value, onChange }: FormProps<StrikeOutContent>) {
    const words = value.sentence.split(' ').filter(w => w.length > 0);

    const toggleWord = (index: number) => {
        const newIds = value.correct_ids_to_remove.includes(index)
            ? value.correct_ids_to_remove.filter((i) => i !== index)
            : [...value.correct_ids_to_remove, index];
        onChange({ ...value, correct_ids_to_remove: newIds });
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={Type}
                title="Strike Out Extra Words"
                description="Write a sentence with unnecessary words. Students must identify and remove them."
            />

            {/* Step 1: Sentence */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Write the Sentence with Extra Words
                </div>
                <FormField
                    label="Sentence"
                    required
                    helper="Include redundant or unnecessary words that students need to remove"
                >
                    <Textarea
                        value={value.sentence}
                        onChange={(e) => onChange({ ...value, sentence: e.target.value, correct_ids_to_remove: [] })}
                        placeholder='Example: The reason why because I was late is traffic.'
                        rows={2}
                    />
                </FormField>
            </div>

            {/* Step 2: Select Words to Remove */}
            {words.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                        Click Words to Strike Out
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-wrap gap-2">
                            {words.map((word, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => toggleWord(index)}
                                    className={cn(
                                        'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                        value.correct_ids_to_remove.includes(index)
                                            ? 'bg-red-500 text-white line-through shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                                    )}
                                >
                                    {word}
                                </button>
                            ))}
                        </div>
                        {value.correct_ids_to_remove.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm text-gray-600">
                                    Words to remove: <span className="font-medium text-red-600">{value.correct_ids_to_remove.map(i => words[i]).join(', ')}</span>
                                </p>
                                <div className="rounded-lg bg-green-50 p-2 text-sm">
                                    <span className="text-gray-600">Result: </span>
                                    <span className="text-green-700">
                                        {words.filter((_, i) => !value.correct_ids_to_remove.includes(i)).join(' ')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Explain Why
                </div>
                <FormField label="Explanation" helper="Why are these words redundant?">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder='Example: "The reason why" and "because" mean the same thing. Using both is redundant.'
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Ordering Form (English/Math)
export function OrderingForm({ value, onChange }: FormProps<OrderingContent>) {
    const addItem = () => {
        const newId = String.fromCharCode(65 + value.items.length);
        onChange({
            ...value,
            items: [...value.items, { id: newId, content: '' }],
            correct_order: [...value.correct_order, newId],
        });
    };

    const removeItem = (index: number) => {
        const removedId = value.items[index].id;
        onChange({
            ...value,
            items: value.items.filter((_, i) => i !== index),
            correct_order: value.correct_order.filter((id) => id !== removedId),
        });
    };

    const updateItem = (index: number, content: string) => {
        const newItems = [...value.items];
        newItems[index] = { ...newItems[index], content };
        onChange({ ...value, items: newItems });
    };

    const moveInOrder = (fromIndex: number, direction: 'up' | 'down') => {
        const newOrder = [...value.correct_order];
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= newOrder.length) return;
        [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
        onChange({ ...value, correct_order: newOrder });
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={ListOrdered}
                title="Put in Order"
                description="Create items that students must arrange in the correct sequence."
            />

            {/* Step 1: Add Items */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                        Add Items to Order
                    </div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Item
                    </button>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                    {value.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
                                {item.id}
                            </span>
                            <Input
                                value={item.content}
                                onChange={(e) => updateItem(index, e.target.value)}
                                placeholder={`Enter item ${item.id}...`}
                                className="flex-1"
                            />
                            {value.items.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="p-2 text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 2: Set Correct Order */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                    Set the Correct Order
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                    <p className="text-sm text-green-700 mb-2">Use arrows to arrange in correct sequence:</p>
                    {value.correct_order.map((id, index) => {
                        const item = value.items.find((i) => i.id === id);
                        return (
                            <div key={id} className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                                    {index + 1}
                                </span>
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-medium">
                                    {id}
                                </span>
                                <span className="flex-1 text-sm truncate">{item?.content || '(empty)'}</span>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveInOrder(index, 'up')}
                                        disabled={index === 0}
                                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveInOrder(index, 'down')}
                                        disabled={index === value.correct_order.length - 1}
                                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        ↓
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step 3: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Explain the Order
                </div>
                <FormField label="Explanation">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder="Explain why this is the correct order..."
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Highlight Form (Reading)
export function HighlightForm({ value, onChange }: FormProps<HighlightContent>) {
    const phraseFound = value.passage && value.correct_phrase && value.passage.includes(value.correct_phrase);

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={MousePointerClick}
                title="Highlight Text"
                description="Students read a passage and highlight a specific phrase that answers the question."
            />

            {/* Step 1: Passage */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Enter the Reading Passage
                </div>
                <FormField label="Passage" required>
                    <Textarea
                        value={value.passage}
                        onChange={(e) => onChange({ ...value, passage: e.target.value })}
                        placeholder="Enter or paste the reading passage here..."
                        rows={4}
                    />
                </FormField>
            </div>

            {/* Step 2: Question */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                    Write the Question
                </div>
                <FormField
                    label="Question"
                    required
                    helper="Ask students to highlight a specific part of the passage"
                >
                    <Input
                        value={value.question}
                        onChange={(e) => onChange({ ...value, question: e.target.value })}
                        placeholder='Example: Highlight the phrase that shows the main idea.'
                    />
                </FormField>
            </div>

            {/* Step 3: Correct Phrase */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Set the Correct Answer
                </div>
                <FormField
                    label="Correct Phrase to Highlight"
                    required
                    helper="Copy the exact phrase from the passage"
                >
                    <Input
                        value={value.correct_phrase}
                        onChange={(e) => onChange({ ...value, correct_phrase: e.target.value })}
                        placeholder="Enter the exact phrase from the passage..."
                        className={cn(value.correct_phrase && !phraseFound && 'border-red-300')}
                    />
                </FormField>
                {value.correct_phrase && !phraseFound && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        This phrase was not found in the passage
                    </div>
                )}
                {phraseFound && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Phrase found in passage
                    </div>
                )}
            </div>

            {/* Step 4: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">4</span>
                    Explain the Answer
                </div>
                <FormField label="Explanation">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder="Explain why this phrase is the correct answer..."
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Swipe Decision Form (Reading/Science)
export function SwipeDecisionForm({ value, onChange }: FormProps<SwipeDecisionContent>) {
    return (
        <div className="space-y-6">
            <SectionHeader
                icon={ArrowUpDown}
                title="Swipe Decision"
                description="Create a card that students swipe left or right to categorize (e.g., Fact vs Opinion)."
            />

            {/* Step 1: Set Labels */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Set Category Labels
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Left Label (←)" required>
                        <Input
                            value={value.labels.left}
                            onChange={(e) => onChange({ ...value, labels: { ...value.labels, left: e.target.value } })}
                            placeholder="e.g., Fact, True, No"
                        />
                    </FormField>
                    <FormField label="Right Label (→)" required>
                        <Input
                            value={value.labels.right}
                            onChange={(e) => onChange({ ...value, labels: { ...value.labels, right: e.target.value } })}
                            placeholder="e.g., Opinion, False, Yes"
                        />
                    </FormField>
                </div>
            </div>

            {/* Step 2: Statement */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                    Enter the Statement
                </div>
                <FormField label="Statement" required>
                    <Textarea
                        value={value.content}
                        onChange={(e) => onChange({ ...value, content: e.target.value })}
                        placeholder="Enter the statement..."
                        rows={2}
                    />
                </FormField>
            </div>

            {/* Step 3: Correct Answer */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Select Correct Answer
                </div>
                <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onChange({ ...value, correct_swipe: 'left' })}
                            className={cn(
                                'flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                                value.correct_swipe === 'left'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            ← {value.labels.left || 'Left'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange({ ...value, correct_swipe: 'right' })}
                            className={cn(
                                'flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                                value.correct_swipe === 'right'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            {value.labels.right || 'Right'} →
                        </button>
                    </div>
                </div>
            </div>

            {/* Step 4: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">4</span>
                    Explain the Answer
                </div>
                <FormField label="Explanation" helper="Why does this belong to this category?">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder="Explain why..."
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Fill Gap Form (Math)
export function FillGapForm({ value, onChange }: FormProps<FillGapContent>) {
    return (
        <div className="space-y-6">
            <SectionHeader
                icon={MessageSquare}
                title="Fill in the Blank"
                description="Students solve a problem and type the answer. Great for math equations."
            />

            {/* Step 1: Question */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Write the Problem
                </div>
                <FormField
                    label="Question / Problem"
                    required
                    helper="Use _____ to show where the answer goes. LaTeX: $x^2 + 5 = ?$"
                >
                    <Textarea
                        value={value.question}
                        onChange={(e) => onChange({ ...value, question: e.target.value })}
                        placeholder='Example: If 3x - 5 = 10, what is the value of x? Answer: _____'
                        rows={3}
                    />
                </FormField>
            </div>

            {/* Step 2: Correct Answer */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                    Set the Correct Answer
                </div>
                <FormField label="Correct Answer" required>
                    <Input
                        value={value.correct_answer}
                        onChange={(e) => onChange({ ...value, correct_answer: e.target.value })}
                        placeholder='Example: 5'
                        className="text-lg font-medium"
                    />
                </FormField>
            </div>

            {/* Step 3: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Show the Solution
                </div>
                <FormField label="Explanation / Solution" helper="Show step-by-step how to solve this">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder='Step 1: Add 5 to both sides: 3x = 15&#10;Step 2: Divide by 3: x = 5'
                        rows={4}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Matching Form (Math)
export function MatchingForm({ value, onChange }: FormProps<MatchingContent>) {
    const addPair = () => {
        const newId = String(value.pairs.length + 1);
        onChange({
            ...value,
            pairs: [...value.pairs, { id: newId, left: '', right: '' }],
        });
    };

    const removePair = (index: number) => {
        onChange({
            ...value,
            pairs: value.pairs.filter((_, i) => i !== index),
        });
    };

    const updatePair = (index: number, field: 'left' | 'right', val: string) => {
        const newPairs = [...value.pairs];
        newPairs[index] = { ...newPairs[index], [field]: val };
        onChange({ ...value, pairs: newPairs });
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={Lightbulb}
                title="Match the Pairs"
                description="Create pairs that students must match together (e.g., equations to solutions)."
            />

            {/* Step 1: Add Pairs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                        Create Matching Pairs
                    </div>
                    <button
                        type="button"
                        onClick={addPair}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Pair
                    </button>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                    <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 text-xs font-medium text-gray-500 px-1">
                        <span>Left Side</span>
                        <span></span>
                        <span>Right Side (Match)</span>
                        <span></span>
                    </div>
                    {value.pairs.map((pair, index) => (
                        <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                            <Input
                                value={pair.left}
                                onChange={(e) => updatePair(index, 'left', e.target.value)}
                                placeholder={`Item ${index + 1}...`}
                            />
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm">
                                ↔
                            </span>
                            <Input
                                value={pair.right}
                                onChange={(e) => updatePair(index, 'right', e.target.value)}
                                placeholder="Match..."
                            />
                            {value.pairs.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removePair(index)}
                                    className="p-2 text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500">Tip: You can use LaTeX for math: $x^2$, $\frac{1}{2}$</p>
            </div>
        </div>
    );
}

// Graph Point Form (Math/Science)
export function GraphPointForm({ value, onChange }: FormProps<GraphPointContent>) {
    return (
        <div className="space-y-6">
            <SectionHeader
                icon={MousePointerClick}
                title="Plot a Point on Graph"
                description="Students tap on a coordinate grid to identify a specific point."
            />

            {/* Step 1: Graph Description */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Describe the Graph
                </div>
                <FormField
                    label="Graph Description"
                    required
                    helper="What does the graph show? (We'll display a coordinate grid)"
                >
                    <Textarea
                        value={value.graph_description}
                        onChange={(e) => onChange({ ...value, graph_description: e.target.value })}
                        placeholder='Example: A line graph showing y = 2x + 1. Find where x = 3.'
                        rows={2}
                    />
                </FormField>
            </div>

            {/* Step 2: Target Point */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                    Set the Target Point
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <FormField label="X Coordinate" required>
                        <Input
                            type="number"
                            value={value.target_x}
                            onChange={(e) => onChange({ ...value, target_x: parseFloat(e.target.value) || 0 })}
                        />
                    </FormField>
                    <FormField label="Y Coordinate" required>
                        <Input
                            type="number"
                            value={value.target_y}
                            onChange={(e) => onChange({ ...value, target_y: parseFloat(e.target.value) || 0 })}
                        />
                    </FormField>
                    <FormField label="Tap Radius (px)" helper="How close must they tap?">
                        <Input
                            type="number"
                            value={value.radius}
                            onChange={(e) => onChange({ ...value, radius: parseInt(e.target.value) || 10 })}
                        />
                    </FormField>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                    Correct point: ({value.target_x}, {value.target_y})
                </div>
            </div>

            {/* Step 3: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Explain the Answer
                </div>
                <FormField label="Explanation">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder='Example: When x = 3, y = 2(3) + 1 = 7, so the point is (3, 7).'
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Trend Arrow Form (Science)
export function TrendArrowForm({ value, onChange }: FormProps<TrendArrowContent>) {
    return (
        <div className="space-y-6">
            <SectionHeader
                icon={ArrowUpDown}
                title="Identify the Trend"
                description="Students analyze data and determine if values increase, decrease, or stay the same."
            />

            {/* Step 1: Question */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Describe the Scenario
                </div>
                <FormField
                    label="Question"
                    required
                    helper="Describe what is being compared or measured"
                >
                    <Textarea
                        value={value.question}
                        onChange={(e) => onChange({ ...value, question: e.target.value })}
                        placeholder='Example: As temperature increases, what happens to the rate of evaporation?'
                        rows={3}
                    />
                </FormField>
            </div>

            {/* Step 2: Correct Trend */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                    Select the Correct Trend
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {(['increase', 'decrease', 'no_change'] as const).map((trend) => (
                        <button
                            key={trend}
                            type="button"
                            onClick={() => onChange({ ...value, correct_trend: trend })}
                            className={cn(
                                'flex flex-col items-center gap-2 rounded-xl p-4 text-sm font-medium transition-all',
                                value.correct_trend === trend
                                    ? 'bg-green-500 text-white shadow-lg ring-2 ring-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            <span className="text-3xl">
                                {trend === 'increase' && '↑'}
                                {trend === 'decrease' && '↓'}
                                {trend === 'no_change' && '→'}
                            </span>
                            <span>
                                {trend === 'increase' && 'Increases'}
                                {trend === 'decrease' && 'Decreases'}
                                {trend === 'no_change' && 'No Change'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 3: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Explain Why
                </div>
                <FormField label="Explanation">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder='Example: Higher temperature gives water molecules more energy, causing faster evaporation.'
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// Slider Value Form (Science)
export function SliderValueForm({ value, onChange }: FormProps<SliderValueContent>) {
    return (
        <div className="space-y-6">
            <SectionHeader
                icon={MousePointerClick}
                title="Estimate Value from Graph"
                description="Students use a slider to estimate a value from a graph or image."
            />

            {/* Step 1: Graph Description */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">1</span>
                    Describe the Graph/Image
                </div>
                <FormField
                    label="Image Description"
                    required
                    helper="What does the graph or image show?"
                >
                    <Textarea
                        value={value.image_description}
                        onChange={(e) => onChange({ ...value, image_description: e.target.value })}
                        placeholder='Example: A scatter plot showing plant height (cm) vs hours of sunlight.'
                        rows={2}
                    />
                </FormField>
            </div>

            {/* Step 2: Question */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                    Ask the Question
                </div>
                <FormField label="Question" required>
                    <Input
                        value={value.question}
                        onChange={(e) => onChange({ ...value, question: e.target.value })}
                        placeholder='Example: Estimate the plant height at 4.5 hours of sunlight.'
                    />
                </FormField>
            </div>

            {/* Step 3: Slider Range */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">3</span>
                    Set the Slider Range
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Minimum Value">
                        <Input
                            type="number"
                            value={value.min_value}
                            onChange={(e) => onChange({ ...value, min_value: parseFloat(e.target.value) || 0 })}
                        />
                    </FormField>
                    <FormField label="Maximum Value">
                        <Input
                            type="number"
                            value={value.max_value}
                            onChange={(e) => onChange({ ...value, max_value: parseFloat(e.target.value) || 100 })}
                        />
                    </FormField>
                </div>
            </div>

            {/* Step 4: Correct Answer */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">4</span>
                    Set the Correct Answer
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <FormField label="Correct Value" required>
                        <Input
                            type="number"
                            step="0.1"
                            value={value.correct_value}
                            onChange={(e) => onChange({ ...value, correct_value: parseFloat(e.target.value) || 0 })}
                        />
                    </FormField>
                    <FormField label="Tolerance (±)" helper="How close is acceptable?">
                        <Input
                            type="number"
                            step="0.1"
                            value={value.tolerance}
                            onChange={(e) => onChange({ ...value, tolerance: parseFloat(e.target.value) || 1 })}
                        />
                    </FormField>
                    <FormField label="Unit" helper="e.g., cm, kg, °C">
                        <Input
                            value={value.unit}
                            onChange={(e) => onChange({ ...value, unit: e.target.value })}
                            placeholder="cm"
                        />
                    </FormField>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    Acceptable range: {value.correct_value - value.tolerance} - {value.correct_value + value.tolerance} {value.unit}
                </div>
            </div>

            {/* Step 5: Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">5</span>
                    Explain How to Read the Graph
                </div>
                <FormField label="Explanation">
                    <Textarea
                        value={value.explanation}
                        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
                        placeholder='Example: Find 4.5 on the x-axis, trace up to the trend line, then read the y-value...'
                        rows={2}
                    />
                </FormField>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContent = any;

// Default content generators
export const getDefaultContent = (type: QuestionType): AnyContent => {
    switch (type) {
        case 'multiple_choice':
            return {
                question: '',
                options: [
                    { id: 'A', text: '', is_correct: false },
                    { id: 'B', text: '', is_correct: false },
                    { id: 'C', text: '', is_correct: false },
                    { id: 'D', text: '', is_correct: false },
                ],
                explanation: '',
            };
        case 'find_error':
            return {
                sentence: '',
                error_index: 0,
                correct_word: '',
                explanation: '',
            };
        case 'strike_out':
            return {
                sentence: '',
                correct_ids_to_remove: [],
                explanation: '',
            };
        case 'ordering':
            return {
                items: [
                    { id: 'A', content: '' },
                    { id: 'B', content: '' },
                    { id: 'C', content: '' },
                ],
                correct_order: ['A', 'B', 'C'],
                explanation: '',
            };
        case 'highlight':
            return {
                passage: '',
                question: '',
                correct_phrase: '',
                explanation: '',
            };
        case 'swipe_decision':
            return {
                content: '',
                correct_swipe: 'left',
                explanation: '',
                labels: { left: 'Fact', right: 'Opinion' },
            };
        case 'fill_gap':
            return {
                question: '',
                correct_answer: '',
                explanation: '',
            };
        case 'matching':
            return {
                pairs: [
                    { id: '1', left: '', right: '' },
                    { id: '2', left: '', right: '' },
                    { id: '3', left: '', right: '' },
                ],
            };
        case 'graph_point':
            return {
                graph_description: '',
                target_x: 0,
                target_y: 0,
                radius: 20,
                explanation: '',
            };
        case 'trend_arrow':
            return {
                question: '',
                correct_trend: 'increase',
                explanation: '',
            };
        case 'slider_value':
            return {
                image_description: '',
                question: '',
                min_value: 0,
                max_value: 100,
                correct_value: 50,
                tolerance: 5,
                unit: '',
                explanation: '',
            };
        default:
            return {};
    }
};

// Main form renderer
interface QuestionFormRendererProps {
    type: QuestionType;
    content: AnyContent;
    onChange: (content: AnyContent) => void;
}

export function QuestionFormRenderer({ type, content, onChange }: QuestionFormRendererProps) {
    switch (type) {
        case 'multiple_choice':
            return <MultipleChoiceForm value={content} onChange={onChange} />;
        case 'find_error':
            return <FindErrorForm value={content} onChange={onChange} />;
        case 'strike_out':
            return <StrikeOutForm value={content} onChange={onChange} />;
        case 'ordering':
            return <OrderingForm value={content} onChange={onChange} />;
        case 'highlight':
            return <HighlightForm value={content} onChange={onChange} />;
        case 'swipe_decision':
            return <SwipeDecisionForm value={content} onChange={onChange} />;
        case 'fill_gap':
            return <FillGapForm value={content} onChange={onChange} />;
        case 'matching':
            return <MatchingForm value={content} onChange={onChange} />;
        case 'graph_point':
            return <GraphPointForm value={content} onChange={onChange} />;
        case 'trend_arrow':
            return <TrendArrowForm value={content} onChange={onChange} />;
        case 'slider_value':
            return <SliderValueForm value={content} onChange={onChange} />;
        default:
            return <div className="text-gray-500">Unknown question type</div>;
    }
}
