'use client';

import { useEffect, useState } from 'react';
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
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Edit, Trash2, Plus } from 'lucide-react';

interface Unit {
  id: number;
  name: string;
  symbol: string;
  description?: string;
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

  const fetchUnits = async (page: number = currentPage) => {
    try {
      const response = await api.get(`/products/units?page=${page}&limit=10`);
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
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description || '',
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
      setFormData({ name: '', symbol: '', description: '' });
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
    setFormData({ name: '', symbol: '', description: '' });
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
          <h2 className="text-2xl font-bold text-foreground">Units ({units.length})</h2>
          <Button onClick={() => { setEditingUnit(null); setFormData({ name: '', symbol: '', description: '' }); setModalError(''); setShowModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>

          <DataTable
            data={units}
            columns={[
              {
                key: 'name',
                title: 'Name',
                sortable: true,
                cellClassName: 'font-medium',
              },
              {
                key: 'symbol',
                title: 'Symbol',
                sortable: true,
                render: (value) => (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                    {String(value)}
                  </span>
                ),
              },
              {
                key: 'description',
                title: 'Description',
                render: (value) => (value ? String(value) : '-'),
              },
            ]}
            actions={[
              {
                label: 'Edit',
                icon: <Edit className="h-4 w-4" />,
                onClick: (unit) => handleEdit(unit),
                variant: 'ghost',
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (unit) => handleDelete(unit.id),
                variant: 'ghost',
              },
            ]}
            searchable={true}
            searchPlaceholder="Search units..."
            emptyMessage="No units found. Add your first unit to get started."
            pagination={true}
            pageSize={10}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(column, direction) => {
              setSortBy(column);
              setSortOrder(direction);
            }}
            serverPagination={true}
            paginationMeta={paginationMeta}
            onPageChange={handlePageChange}
          />
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
        </div>
      </FormModal>
    </AdminLayout>
  );
}
