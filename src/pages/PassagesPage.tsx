import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Pencil, Trash2, GripVertical, Type, ChevronDown, ChevronRight, Crown, Coins, Star, Target, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildingsApi, VillageWithPassages } from '@/api/buildings';
import { passagesApi } from '@/api/passages';
import { bossApi, Boss } from '@/api/boss';
import { cn } from '@/lib/utils';

const passageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

const bossSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  pass_score: z.coerce.number().min(0, 'Must be 0 or greater'),
  reward_coins: z.coerce.number().min(0, 'Must be 0 or greater'),
  reward_xp: z.coerce.number().min(0, 'Must be 0 or greater'),
});

type PassageFormValues = z.infer<typeof passageSchema>;
type BossFormValues = z.infer<typeof bossSchema>;

interface Passage {
  id: number;
  title: string;
  order_index: number;
}

export function PassagesPage() {
  const { villageId } = useParams<{ villageId: string }>();
  const navigate = useNavigate();
  const [village, setVillage] = useState<VillageWithPassages | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null);
  const [deletingPassage, setDeletingPassage] = useState<Passage | null>(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<Passage | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Boss state
  const [expandedPassages, setExpandedPassages] = useState<Set<number>>(new Set());
  const [bossData, setBossData] = useState<Record<number, Boss | null>>({});
  const [loadingBoss, setLoadingBoss] = useState<Set<number>>(new Set());
  const [bossDialogOpen, setBossDialogOpen] = useState(false);
  const [creatingBossForPassage, setCreatingBossForPassage] = useState<number | null>(null);

  const form = useForm<PassageFormValues>({
    resolver: zodResolver(passageSchema),
    defaultValues: { title: '' },
  });

  const bossForm = useForm<BossFormValues>({
    resolver: zodResolver(bossSchema),
    defaultValues: {
      title: '',
      pass_score: 70,
      reward_coins: 100,
      reward_xp: 50,
    },
  });

  const villageIdNum = parseInt(villageId || '0', 10);

  const fetchVillageWithPassages = async () => {
    setIsLoading(true);
    try {
      const data = await buildingsApi.getVillage(villageIdNum);
      setVillage(data);
      setPassages(data.passages?.sort((a, b) => a.order_index - b.order_index) || []);
    } catch {
      navigate('/villages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (villageIdNum) fetchVillageWithPassages();
  }, [villageIdNum]);

  const togglePassageExpanded = async (passageId: number) => {
    const newExpanded = new Set(expandedPassages);
    if (newExpanded.has(passageId)) {
      newExpanded.delete(passageId);
    } else {
      newExpanded.add(passageId);
      // Fetch boss data if not already loaded
      if (bossData[passageId] === undefined) {
        setLoadingBoss(prev => new Set(prev).add(passageId));
        try {
          const boss = await bossApi.getBoss(passageId);
          setBossData(prev => ({ ...prev, [passageId]: boss }));
        } catch (error) {
          console.error('Failed to fetch boss:', error);
          setBossData(prev => ({ ...prev, [passageId]: null }));
        } finally {
          setLoadingBoss(prev => {
            const next = new Set(prev);
            next.delete(passageId);
            return next;
          });
        }
      }
    }
    setExpandedPassages(newExpanded);
  };

  const openCreateDialog = () => {
    setEditingPassage(null);
    form.reset({ title: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (passage: Passage) => {
    setEditingPassage(passage);
    form.reset({ title: passage.title });
    setDialogOpen(true);
  };

  const openBossDialog = (passageId: number) => {
    setCreatingBossForPassage(passageId);
    bossForm.reset({
      title: '',
      pass_score: 70,
      reward_coins: 100,
      reward_xp: 50,
    });
    setBossDialogOpen(true);
  };

  const handleSubmit = async (values: PassageFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingPassage) {
        await passagesApi.updatePassage(editingPassage.id, {
          title: values.title,
        });
      } else {
        await passagesApi.createPassage({
          village_id: villageIdNum,
          title: values.title,
        });
      }
      await fetchVillageWithPassages();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBossSubmit = async (values: BossFormValues) => {
    if (!creatingBossForPassage) return;
    setIsSubmitting(true);
    try {
      const boss = await bossApi.createBoss(creatingBossForPassage, values);
      setBossData(prev => ({ ...prev, [creatingBossForPassage]: boss }));
      setBossDialogOpen(false);
      setCreatingBossForPassage(null);
    } catch (error) {
      console.error('Failed to create boss:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPassage) return;
    setIsSubmitting(true);
    try {
      await passagesApi.deletePassage(deletingPassage.id);
      await fetchVillageWithPassages();
      setDeleteDialogOpen(false);
      setDeletingPassage(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, passage: Passage) => {
    setDraggedItem(passage);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', passage.id.toString());
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

    const dragIndex = passages.findIndex(p => p.id === draggedItem.id);
    if (dragIndex === dropIndex) return;

    setIsSubmitting(true);
    try {
      await passagesApi.reorderPassage(villageIdNum, draggedItem.id, dropIndex + 1);
      await fetchVillageWithPassages();
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
            <span>{village?.title || `Village ${villageId}`}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{village?.title || 'Passages'}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage passages for this village
          </p>
        </div>
        <button
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Passage
        </button>
      </div>

      {/* Passages List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : passages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No passages</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first passage
          </p>
          <button
            onClick={openCreateDialog}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add Passage
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {passages.map((passage, index) => {
            const isExpanded = expandedPassages.has(passage.id);
            const boss = bossData[passage.id];
            const isLoadingBoss = loadingBoss.has(passage.id);

            return (
              <div
                key={passage.id}
                className={cn(
                  'rounded-lg border bg-white transition-all',
                  draggedItem?.id === passage.id ? 'opacity-50 border-gray-300' : 'border-gray-200',
                  dragOverIndex === index && draggedItem?.id !== passage.id ? 'border-2 border-blue-400 bg-blue-50' : ''
                )}
              >
                {/* Passage Header Row */}
                <div
                  draggable={!isSubmitting}
                  onDragStart={(e) => handleDragStart(e, passage)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center gap-4 p-4"
                >
                  {/* Drag handle */}
                  <div
                    className="flex h-10 w-6 items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Expand/Collapse button */}
                  <button
                    onClick={() => togglePassageExpanded(passage.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{passage.title}</p>
                    {boss !== undefined && (
                      <p className="text-sm text-gray-500">
                        {boss ? (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Crown className="h-3 w-3" />
                            Boss: {boss.title}
                          </span>
                        ) : (
                          <span className="text-gray-400">No boss</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(passage);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingPassage(passage);
                        setDeleteDialogOpen(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Boss Section */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 ml-14">
                    {isLoadingBoss ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        Loading boss...
                      </div>
                    ) : boss ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                            <Crown className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{boss.title}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Pass: {boss.pass_score}%
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Coins className="h-3 w-3" />
                                {boss.reward_coins}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {boss.reward_xp} XP
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/boss/${boss.id}/questions?subject=${village?.subject || 'english'}&villageId=${villageIdNum}&passageTitle=${encodeURIComponent(passage.title)}`)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200"
                          >
                            Questions
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                            <Crown className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-500">No Boss</p>
                            <p className="text-sm text-gray-400">Create a boss for this passage</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openBossDialog(passage.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                        >
                          <Plus className="h-4 w-4" />
                          Create Boss
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Passage Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPassage ? 'Edit passage' : 'New passage'}
            </DialogTitle>
            <DialogDescription>
              {editingPassage
                ? 'Make changes to the passage.'
                : 'Create a new passage for this village.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-gray-500" />
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Passage title"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.title.message}
                  </p>
                )}
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
                {isSubmitting ? 'Saving...' : editingPassage ? 'Save changes' : 'Create'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Boss Dialog */}
      <Dialog open={bossDialogOpen} onOpenChange={setBossDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Create Boss
            </DialogTitle>
            <DialogDescription>
              Create a boss challenge for this passage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={bossForm.handleSubmit(handleBossSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="boss-title" className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-gray-500" />
                  Title
                </Label>
                <Input
                  id="boss-title"
                  placeholder="Boss title"
                  {...bossForm.register('title')}
                />
                {bossForm.formState.errors.title && (
                  <p className="text-xs text-red-500">
                    {bossForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pass_score" className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    Pass %
                  </Label>
                  <Input
                    id="pass_score"
                    type="number"
                    min={0}
                    max={100}
                    {...bossForm.register('pass_score')}
                  />
                  {bossForm.formState.errors.pass_score && (
                    <p className="text-xs text-red-500">
                      {bossForm.formState.errors.pass_score.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reward_coins" className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-gray-500" />
                    Coins
                  </Label>
                  <Input
                    id="reward_coins"
                    type="number"
                    min={0}
                    {...bossForm.register('reward_coins')}
                  />
                  {bossForm.formState.errors.reward_coins && (
                    <p className="text-xs text-red-500">
                      {bossForm.formState.errors.reward_coins.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reward_xp" className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    XP
                  </Label>
                  <Input
                    id="reward_xp"
                    type="number"
                    min={0}
                    {...bossForm.register('reward_xp')}
                  />
                  {bossForm.formState.errors.reward_xp && (
                    <p className="text-xs text-red-500">
                      {bossForm.formState.errors.reward_xp.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setBossDialogOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Boss'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Passage Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete passage</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingPassage?.title}"? This will
              also delete all nodes and the boss within this passage.
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

export default PassagesPage;
