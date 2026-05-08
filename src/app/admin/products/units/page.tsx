'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProductsNavbar from '@/components/admin/products-navbar';
import AdminLayout from '@/components/admin/admin-layout';
import { FormModal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Unit {
  id: number;
  name: string;
  symbol: string;
  description?: string;
  status: 'active' | 'inactive';
  sort_order?: number;
}

function SortableUnitItem({
  unit,
  onEdit,
  onDelete,
}: {
  unit: Unit;
  onEdit: (u: Unit) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: unit.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-4 transition-shadow ${isDragging ? 'shadow-lg' : 'hover:shadow-sm'
        }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing shrink-0"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{unit.name}</span>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
            {unit.symbol}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${unit.status === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
            {unit.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        {unit.description && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{unit.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onEdit(unit)} className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(unit.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminUnitsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 0,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnits();
    }
  }, [isAuthenticated, currentPage]);

  const fetchUnits = useCallback(async (page: number = currentPage) => {
    try {
      const response = await api.get(`/products/units/?page=${page}&limit=100`);
      setUnits(response.data.data || []);
      setPaginationMeta(response.data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPage: 0,
      });
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDragEnd = async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = units.findIndex((u) => u.id === active.id);
    const newIndex = units.findIndex((u) => u.id === over.id);
    const reordered = arrayMove(units, oldIndex, newIndex);
    setUnits(reordered);

    try {
      const orders = reordered.map((u, i) => ({ id: u.id, sort_order: i }));
      await api.put('/products/units/reorder', { orders });
    } catch {
      setUnits(units);
      setError('Failed to save order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description || '',
      status: unit.status,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      await api.delete(`/products/units/${id}`);
      setSuccess('Unit deleted successfully');
      fetchUnits();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to delete unit');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      if (editingUnit) {
        await api.put(`/products/units/${editingUnit.id}`, formData);
        setSuccess('Unit updated successfully');
      } else {
        await api.post('/products/units', formData);
        setSuccess('Unit created successfully');
      }

      setShowModal(false);
      setEditingUnit(null);
      setFormData({ name: '', symbol: '', description: '', status: 'active' });
      fetchUnits();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setModalError(err.response?.data?.message || 'Failed to save unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    setFormData({ name: '', symbol: '', description: '', status: 'active' });
    setModalError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout
      title="Units Management"
      subtitle="Manage product units of measurement"
    >
      <div className="space-y-6">
        <ProductsNavbar />

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Units ({paginationMeta.total})</h2>
          <Button onClick={() => { setEditingUnit(null); setFormData({ name: '', symbol: '', description: '', status: 'active' }); setModalError(''); setShowModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>

        {units.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No units found. Add your first unit to get started.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={units.map((u) => u.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {units.map((unit) => (
                  <SortableUnitItem
                    key={unit.id}
                    unit={unit}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {paginationMeta.totalPage > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: paginationMeta.totalPage }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
        )}
      </div>

      <FormModal
        open={showModal}
        onOpenChange={(open) => { if (!open) handleCloseModal(); else setShowModal(open); }}
        title={editingUnit ? 'Edit Unit' : 'Add New Unit'}
        description={editingUnit ? 'Update the unit details below.' : 'Add a new unit of measurement for your products.'}
        onSubmit={handleSubmit}
        submitText={editingUnit ? 'Update Unit' : 'Create Unit'}
        isSubmitting={submitting}
      >
        {modalError && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm mb-4">
            {modalError}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name *</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Piece, Kilogram, Liter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol *</Label>
            <Input
              id="symbol"
              type="text"
              required
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="e.g., pcs, kg, L"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of this unit..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border rounded-md bg-transparent focus:ring-2 focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </FormModal>
    </AdminLayout>
  );
}
