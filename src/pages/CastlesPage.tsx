import { useEffect, useState, useRef } from 'react';
import { Plus, Castle, Pencil, Trash2, Upload, Type, Coins, Package, Zap } from 'lucide-react';
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
import { buildingsApi } from '@/api/buildings';
import type { Castle as CastleType, CastleCreate, CastleUpdate } from '@/types';

const castleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  svg: z.string().optional(),
  treasure_capacity: z.coerce.number().min(0),
  speed_production_treasure: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
});

type CastleFormValues = z.infer<typeof castleSchema>;

// Read file as bytes (ArrayBuffer) and convert to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      let binary = '';
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      const base64 = btoa(binary);
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

// Hook to handle SVG display - either URL or base64
const useSvgUrl = (svg: string | undefined) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    if (!svg) {
      setSrc('');
      return;
    }

    // If it's a URL, use it directly (browser can render SVG from URL)
    if (svg.startsWith('http://') || svg.startsWith('https://')) {
      setSrc(svg);
      return;
    }

    // Otherwise treat as base64 content
    setSrc(`data:image/svg+xml;base64,${svg}`);
  }, [svg]);

  return src;
};

const SvgImage = ({ svg, alt, className }: { svg: string; alt: string; className?: string }) => {
  const src = useSvgUrl(svg);
  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
};

export function CastlesPage() {
  const [castles, setCastles] = useState<CastleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCastle, setEditingCastle] = useState<CastleType | null>(null);
  const [deletingCastle, setDeletingCastle] = useState<CastleType | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CastleFormValues>({
    resolver: zodResolver(castleSchema),
    defaultValues: {
      title: '',
      svg: '',
      treasure_capacity: 300,
      speed_production_treasure: 1,
      cost: 0,
    },
  });

  const fetchCastles = async () => {
    setIsLoading(true);
    try {
      const data = await buildingsApi.getCastles();
      setCastles(data);
    } catch (error) {
      console.error('Failed to fetch castles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCastles();
  }, []);

  const isFirstCastle = () => {
    if (editingCastle) {
      // Check if this is the first castle (no cost)
      return !editingCastle.cost;
    }
    return castles.length === 0;
  };

  const openCreateDialog = () => {
    setEditingCastle(null);
    setSelectedFileName('');
    form.reset({
      title: '',
      svg: '',
      treasure_capacity: 300,
      speed_production_treasure: 1,
      cost: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (castle: CastleType) => {
    setEditingCastle(castle);
    setSelectedFileName(castle.svg ? 'Current file' : '');
    form.reset({
      title: castle.title,
      svg: castle.svg || '',
      treasure_capacity: castle.treasure_capacity,
      speed_production_treasure: castle.speed_production_treasure,
      cost: castle.cost,
    });
    setDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        form.setValue('svg', base64);
        setSelectedFileName(file.name);
      } catch (error) {
        console.error('Failed to read file:', error);
      }
    }
  };

  const openDeleteDialog = (castle: CastleType) => {
    setDeletingCastle(castle);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (values: CastleFormValues) => {
    setIsSubmitting(true);
    try {
      const isFirst = isFirstCastle();
      const cost = isFirst ? 0 : values.cost;

      if (editingCastle) {
        // PATCH: only send changed fields
        const updateData: CastleUpdate = {};

        if (values.title !== editingCastle.title) {
          updateData.title = values.title;
        }
        if (values.treasure_capacity !== editingCastle.treasure_capacity) {
          updateData.treasure_capacity = values.treasure_capacity;
        }
        if (values.speed_production_treasure !== editingCastle.speed_production_treasure) {
          updateData.speed_production_treasure = values.speed_production_treasure;
        }
        if (cost !== editingCastle.cost) {
          updateData.cost = cost;
        }
        // SVG: only send if user uploaded a new file (changed from original)
        const originalSvg = editingCastle.svg || '';
        if (values.svg !== originalSvg) {
          updateData.svg = values.svg || null; // send null to remove SVG
        }

        // Only call API if there are changes
        if (Object.keys(updateData).length > 0) {
          await buildingsApi.updateCastle(editingCastle.id, updateData);
        }
      } else {
        const createData: CastleCreate = {
          title: values.title,
          type: 'castle',
          svg: values.svg || undefined,
          treasure_capacity: values.treasure_capacity,
          speed_production_treasure: values.speed_production_treasure,
          cost,
        };
        await buildingsApi.createCastle(createData);
      }
      await fetchCastles();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save castle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCastle) return;
    setIsSubmitting(true);
    try {
      await buildingsApi.deleteBuilding(deletingCastle.id);
      await fetchCastles();
      setDeleteDialogOpen(false);
      setDeletingCastle(null);
    } catch (error) {
      console.error('Failed to delete castle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Castles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage boss levels and challenges
          </p>
        </div>
        <button
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Castle
        </button>
      </div>

      {/* Castles List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : castles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <Castle className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No castles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first castle
          </p>
          <button
            onClick={openCreateDialog}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add Castle
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {castles.map((castle, index) => (
            <div
              key={castle.id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-600">
                {index + 1}
              </div>
              {castle.svg && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 overflow-hidden">
                  <SvgImage
                    svg={castle.svg}
                    alt={castle.title}
                    className="h-10 w-10 object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{castle.title}</p>
                <p className="text-sm text-gray-500">
                  {!castle.cost ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    <>Cost: {castle.cost.toLocaleString()}</>
                  )}
                  {' | '}Capacity: {(castle.treasure_capacity ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditDialog(castle)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openDeleteDialog(castle)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCastle ? 'Edit Castle' : 'Create Castle'}
            </DialogTitle>
            <DialogDescription>
              {editingCastle ? 'Update castle details' : 'Add a new castle'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-gray-500" />
                  Title
                </Label>
                <Input id="title" placeholder="Castle name" {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              {!isFirstCastle() && (
                <div className="grid gap-2">
                  <Label htmlFor="cost" className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-gray-500" />
                    Cost
                  </Label>
                  <Input id="cost" type="number" {...form.register('cost')} />
                </div>
              )}

              {isFirstCastle() && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                  <p className="text-sm text-green-700">
                    <Coins className="h-4 w-4 inline mr-2" />
                    First castle is always free
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="treasure_capacity" className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    Capacity
                  </Label>
                  <Input id="treasure_capacity" type="number" {...form.register('treasure_capacity')} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="speed_production_treasure" className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-500" />
                    Speed
                  </Label>
                  <Input id="speed_production_treasure" type="number" {...form.register('speed_production_treasure')} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-gray-500" />
                  SVG Image
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-gray-300"
                >
                  <Upload className="h-4 w-4" />
                  {selectedFileName || 'Upload SVG file'}
                </button>
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
                {isSubmitting ? 'Saving...' : editingCastle ? 'Save' : 'Create'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Castle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCastle?.title}"? This action cannot be undone.
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

export default CastlesPage;
