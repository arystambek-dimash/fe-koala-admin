import {useEffect, useState} from 'react';
import {useParams, useNavigate, useSearchParams} from 'react-router-dom';
import {Plus, Layers, Pencil, Trash2, Coins, Star, GripVertical, Type, FileText, Target, ArrowRight, Play, Crown} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {nodesApi} from '@/api/nodes';
import type {PassageNode, PassageNodeFormData} from '@/types';
import {cn} from '@/lib/utils';

const nodeSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    reward_coins: z.coerce.number().min(0),
    reward_xp: z.coerce.number().min(0),
    pass_score: z.coerce.number().min(0).max(100),
});

type NodeFormValues = z.infer<typeof nodeSchema>;

export function NodesPage() {
    const {passageId} = useParams<{ passageId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const subject = searchParams.get('subject') || 'english';
    const [nodes, setNodes] = useState<PassageNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<PassageNode | null>(null);
    const [deletingNode, setDeletingNode] = useState<PassageNode | null>(null);

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<PassageNode | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const form = useForm<NodeFormValues>({
        resolver: zodResolver(nodeSchema),
        defaultValues: {
            title: '',
            content: '',
            reward_coins: 10,
            reward_xp: 5,
            pass_score: 70,
        },
    });

    const passageIdNum = parseInt(passageId || '0', 10);

    const fetchNodes = async () => {
        setIsLoading(true);
        try {
            const data = await nodesApi.getNodes(passageIdNum);
            setNodes(data.sort((a, b) => a.order_index - b.order_index));
        } catch {
            setNodes([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (passageIdNum) fetchNodes();
    }, [passageIdNum]);

    const openCreateDialog = () => {
        setEditingNode(null);
        form.reset({
            title: '',
            content: '',
            reward_coins: 10,
            reward_xp: 5,
            pass_score: 70,
        });
        setDialogOpen(true);
    };

    const openEditDialog = (node: PassageNode) => {
        setEditingNode(node);
        form.reset({
            title: node.title,
            content: node.content,
            reward_coins: node.reward_coins,
            reward_xp: node.reward_xp,
            pass_score: node.pass_score,
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (values: NodeFormValues) => {
        setIsSubmitting(true);
        try {
            const orderIndex = editingNode ? editingNode.order_index : nodes.length + 1;
            const data: PassageNodeFormData = {
                ...values,
                order_index: orderIndex,
            };
            if (editingNode) {
                await nodesApi.updateNode(editingNode.id, data);
            } else {
                await nodesApi.createNode(passageIdNum, data);
            }
            await fetchNodes();
            setDialogOpen(false);
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingNode) return;
        setIsSubmitting(true);
        try {
            await nodesApi.deleteNode(deletingNode.id);
            await fetchNodes();
            setDeleteDialogOpen(false);
            setDeletingNode(null);
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetBoss = async (node: PassageNode) => {
        // If this node is already boss, do nothing
        if (node.is_boss) return;

        setIsSubmitting(true);
        try {
            const currentBoss = nodes.find(n => n.is_boss);

            // If there's already a boss, unset it first
            if (currentBoss) {
                await nodesApi.updateNode(currentBoss.id, {
                    title: currentBoss.title,
                    content: currentBoss.content,
                    order_index: currentBoss.order_index,
                    reward_coins: currentBoss.reward_coins,
                    reward_xp: currentBoss.reward_xp,
                    pass_score: currentBoss.pass_score,
                    is_boss: false,
                });
            }

            // Set the new boss
            await nodesApi.updateNode(node.id, {
                title: node.title,
                content: node.content,
                order_index: node.order_index,
                reward_coins: node.reward_coins,
                reward_xp: node.reward_xp,
                pass_score: node.pass_score,
                is_boss: true,
            });

            await fetchNodes();
        } catch (error) {
            console.error('Failed to set boss:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, node: PassageNode) => {
        setDraggedItem(node);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', node.id.toString());
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

        const dragIndex = nodes.findIndex(n => n.id === draggedItem.id);
        if (dragIndex === dropIndex) return;

        setIsSubmitting(true);
        try {
            // Use single reorder endpoint - backend handles shifting
            await nodesApi.reorderNode(passageIdNum, draggedItem.id, dropIndex + 1);
            await fetchNodes();
        } catch (error) {
            console.error('Failed to reorder:', error);
        } finally {
            setIsSubmitting(false);
            setDraggedItem(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <button onClick={() => navigate('/villages')} className="hover:text-gray-700">
                            Villages
                        </button>
                        <span>/</span>
                        <span>Passage {passageId}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage lesson nodes and challenges
                    </p>
                </div>
                <button
                    onClick={openCreateDialog}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                    <Plus className="h-4 w-4"/>
                    Add Node
                </button>
            </div>

            {/* Nodes List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100"/>
                    ))}
                </div>
            ) : nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                    <Layers className="h-12 w-12 text-gray-300"/>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No nodes</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Create your first lesson node
                    </p>
                    <button
                        onClick={openCreateDialog}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                        <Plus className="h-4 w-4"/>
                        Add Node
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {nodes.map((node, index) => (
                        <div
                            key={node.id}
                            draggable={!isSubmitting}
                            onDragStart={(e) => handleDragStart(e, node)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            className={cn(
                                'flex items-center gap-4 rounded-lg border p-4 transition-all cursor-grab active:cursor-grabbing',
                                node.is_boss
                                    ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                                    : 'bg-white border-gray-200 hover:border-gray-300',
                                draggedItem?.id === node.id && 'opacity-50 border-gray-300',
                                dragOverIndex === index && draggedItem?.id !== node.id && 'border-2 border-blue-400 bg-blue-50'
                            )}
                        >
                            {/* Drag handle */}
                            <div className="flex h-10 w-6 items-center justify-center text-gray-400 hover:text-gray-600">
                                <GripVertical className="h-5 w-5"/>
                            </div>

                            {/* Order number */}
                            <div className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium',
                                node.is_boss ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                            )}>
                                {index + 1}
                            </div>

                            {/* Icon */}
                            <div className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg',
                                node.is_boss ? 'bg-amber-100' : 'bg-gray-50'
                            )}>
                                <Layers className={cn('h-5 w-5', node.is_boss ? 'text-amber-500' : 'text-gray-400')}/>
                            </div>

                            {/* Title & Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={cn('font-medium', node.is_boss ? 'text-amber-900' : 'text-gray-900')}>
                                        {node.title}
                                    </p>
                                    {node.is_boss && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                            <Crown className="h-3 w-3"/>
                                            Boss
                                        </span>
                                    )}
                                </div>
                                <p className={cn('text-sm', node.is_boss ? 'text-amber-600' : 'text-gray-500')}>
                                    Pass: {node.pass_score}%
                                </p>
                            </div>

                            {/* Rewards */}
                            <div className={cn('flex items-center gap-4 text-sm', node.is_boss ? 'text-amber-600' : 'text-gray-500')}>
                                <span className="flex items-center gap-1">
                                    <Coins className="h-4 w-4 text-amber-500"/>
                                    {node.reward_coins}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star className={cn('h-4 w-4', node.is_boss ? 'text-amber-500' : 'text-blue-500')}/>
                                    {node.reward_xp}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {/* Boss crown button */}
                                <button
                                    onClick={() => handleSetBoss(node)}
                                    disabled={isSubmitting || node.is_boss}
                                    className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                        node.is_boss
                                            ? 'bg-amber-200 text-amber-600 cursor-default'
                                            : 'text-gray-400 hover:bg-amber-50 hover:text-amber-500'
                                    )}
                                    title={node.is_boss ? 'This is the boss node' : 'Set as boss'}
                                >
                                    <Crown className={cn('h-4 w-4', node.is_boss && 'fill-current')}/>
                                </button>

                                {/* Test button */}
                                <button
                                    onClick={() => navigate(`/nodes/${node.id}/test?subject=${subject}`)}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors',
                                        node.is_boss ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                                    )}
                                >
                                    <Play className="h-4 w-4"/>
                                    Test
                                </button>

                                {/* Questions button */}
                                <button
                                    onClick={() => navigate(`/nodes/${node.id}/questions?subject=${subject}`)}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                        node.is_boss
                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    )}
                                >
                                    Questions
                                    <ArrowRight className="h-4 w-4"/>
                                </button>

                                {/* Edit button */}
                                <button
                                    onClick={() => openEditDialog(node)}
                                    className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                        node.is_boss
                                            ? 'text-amber-400 hover:bg-amber-100 hover:text-amber-600'
                                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                    )}
                                >
                                    <Pencil className="h-4 w-4"/>
                                </button>

                                {/* Delete button */}
                                <button
                                    onClick={() => {
                                        setDeletingNode(node);
                                        setDeleteDialogOpen(true);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingNode ? 'Edit node' : 'New node'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingNode
                                ? 'Make changes to the lesson node.'
                                : 'Create a new lesson node.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title" className="flex items-center gap-2">
                                    <Type className="h-4 w-4 text-gray-500"/>
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="Lesson title"
                                    {...form.register('title')}
                                />
                                {form.formState.errors.title && (
                                    <p className="text-xs text-red-500">
                                        {form.formState.errors.title.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="content" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500"/>
                                    Content
                                </Label>
                                <Textarea
                                    id="content"
                                    placeholder="Lesson content..."
                                    rows={4}
                                    {...form.register('content')}
                                />
                                {form.formState.errors.content && (
                                    <p className="text-xs text-red-500">
                                        {form.formState.errors.content.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pass_score" className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-gray-500"/>
                                    Pass Score (%)
                                </Label>
                                <Input
                                    id="pass_score"
                                    type="number"
                                    min="0"
                                    max="100"
                                    {...form.register('pass_score')}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Rewards</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Coins className="h-4 w-4 text-amber-500"/>
                                            Coins
                                        </div>
                                        <Input
                                            type="number"
                                            {...form.register('reward_coins')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Star className="h-4 w-4 text-blue-500"/>
                                            XP
                                        </div>
                                        <Input
                                            type="number"
                                            {...form.register('reward_xp')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setDialogOpen(false)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : editingNode ? 'Save changes' : 'Create'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete node</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deletingNode?.title}"? This action cannot be undone.
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

export default NodesPage;
