'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/admin-layout';
import { DataTable } from '@/components/ui/data-table';
import {
  User, Mail, Phone, MapPin,
  History, Edit, Eye,
  Users, UserPlus, Building, Search,
  CheckCircle2, Power, PowerOff
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  customer_type: 'individual' | 'company';
  company: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive';
  total_orders: number;
  total_spent: number;
  created_at: string;
}

interface Pagination {
  total: number;
  page: string;
  limit: string;
  totalPage: number;
}

export default function AdminCustomersPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: '1',
    limit: '10',
    totalPage: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [error, setError] = useState('');

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const [stats, setStats] = useState({
    active: 0,
    individual: 0,
    company: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setColumnVisibility({
        customer: true,
        status: width >= 1600,
        customer_type: width >= 768,
        location: width >= 1024,
        contact: width >= 1280,
        orders: width >= 1440,
        actions: width >= 500,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (appliedSearch) params.append('search', appliedSearch);

      const response = await api.get(`/customers/admin/all?${params}`);
      const data = response.data;

      setCustomers(data.data || []);
      setPagination({
        total: data.pagination?.total || 0,
        page: data.pagination?.page || currentPage.toString(),
        limit: data.pagination?.limit || '10',
        totalPage: data.pagination?.totalPage || 1,
      });

      // Update stats if available in response or calculate from data
      if (data.stats) {
        setStats({
          active: data.stats.active || 0,
          individual: data.stats.individual || 0,
          company: data.stats.company || 0,
        });
      } else if (data.data) {
        // Fallback calculation for current page if stats not provided by API
        const currentStats = data.data.reduce((acc: any, curr: Customer) => {
          if (curr.status === 'active') acc.active++;
          if (curr.customer_type === 'individual') acc.individual++;
          if (curr.customer_type === 'company') acc.company++;
          return acc;
        }, { active: 0, individual: 0, company: 0 });

        // Note: These will only reflect the current page if not provided by API
        setStats(currentStats);
      }
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      setError('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated, currentPage, selectedStatus, appliedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const toggleStatus = async (customer: Customer) => {
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/customers/admin/${customer.id}/status`, { status: newStatus });
      fetchCustomers();
    } catch (error) {
      alert(`Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} customer`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage your customer relationships and history.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Customers</p>
                  <h3 className="text-2xl font-bold mt-1">{pagination.total}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Active Customers</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.active || pagination.total}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Business / Company</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.company}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Building className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Individual</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.individual}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 bg-white border-b border-slate-100">
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-[180px] h-11 bg-slate-50 border-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button type="submit" className="flex-1 sm:flex-none h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white transition-all">
                  Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={handleClearSearch}
                >
                  Reset
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Customers Table */}
        <Card className="border-none shadow-sm overflow-hidden p-0 sm:p-4 md:p-6">
          <DataTable<Customer>
            data={customers}
            columns={[
              {
                key: 'customer',
                title: 'Customer',
                render: (_, customer): ReactNode => (
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {customer.name}
                      </span>
                      {customer.company && (
                        <div className="flex items-center text-[10px] text-slate-500 mt-0.5">
                          <Building className="h-3 w-3 mr-1 text-slate-400" />
                          {customer.company}
                        </div>
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: 'contact',
                title: 'Contact',
                render: (_, customer): ReactNode => (
                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <div className="flex items-center text-xs text-slate-600">
                      <Mail className="h-3 w-3 mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">{customer.email || '-'}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600">
                      <Phone className="h-3 w-3 mr-2 text-slate-400 shrink-0" />
                      <span>{customer.phone || '-'}</span>
                    </div>
                  </div>
                )
              },
              {
                key: 'location',
                title: 'Location',
                render: (_, customer): ReactNode => (
                  <div className="flex flex-col gap-1 min-w-[120px]">
                    <div className="flex items-center text-sm text-slate-700">
                      <MapPin className="h-3 w-3 mr-1.5 text-slate-400 shrink-0" />
                      <span className="truncate">{customer.city || '-'}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 ml-4.5">{customer.country || ''}</span>
                  </div>
                )
              },
              {
                key: 'customer_type',
                title: 'Type',
                render: (type): ReactNode => (
                  <Badge className={`${type === 'company'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                    } shadow-none border px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider`} variant="outline">
                    {type === 'company' ? 'Bus' : 'Ind'}
                  </Badge>
                )
              },
              {
                key: 'status',
                title: 'Status',
                render: (status): ReactNode => (
                  <Badge className={`${status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                    } shadow-none border px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider`} variant="outline">
                    {status as string}
                  </Badge>
                )
              },
              {
                key: 'actions',
                title: 'Actions',
                className: 'text-right',
                headerClassName: 'text-right',
                render: (_, customer): ReactNode => (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/admin/customer/${customer.id}`)}
                      title="View Customer"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/admin/customer/${customer.id}/edit`)}
                      title="Edit Customer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 transition-colors ${
                        customer.status === 'active'
                          ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      onClick={() => toggleStatus(customer)}
                      title={customer.status === 'active' ? 'Deactivate Customer' : 'Activate Customer'}
                    >
                      {customer.status === 'active' ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </Button>
                  </div>
                )
              }
            ]}
            expandable
            renderExpandedRow={(customer) => (
              <div className="py-2 space-y-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200 px-4 md:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Contact & Company
                    </p>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{customer.email || 'No Email'}</p>
                      <p className="text-slate-600">{customer.phone || 'No Phone'}</p>
                      {customer.company && <p className="text-indigo-600 text-xs font-medium">@{customer.company}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Address Details
                    </p>
                    <div className="space-y-1">
                      <p className="text-slate-900 leading-relaxed">{customer.address || 'No Address'}</p>
                      <p className="text-slate-600 font-medium">{customer.city}, {customer.country}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total Orders</p>
                    <p className="font-bold text-slate-900">{customer.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total Spent</p>
                    <p className="font-bold text-indigo-600">{formatCurrency(Number(customer.total_spent || 0))}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 text-xs gap-2 rounded-lg bg-white border-slate-200"
                    onClick={() => router.push(`/admin/customer/${customer.id}/edit`)}
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 text-xs gap-2 rounded-lg bg-white border-slate-200"
                    onClick={() => router.push(`/admin/customer/${customer.id}`)}
                  >
                    <History className="h-3.5 w-3.5" /> View Orders
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-9 px-4 text-xs gap-2 rounded-lg transition-all ${
                      customer.status === 'active'
                        ? 'border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                    onClick={() => toggleStatus(customer)}
                  >
                    {customer.status === 'active' ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                    {customer.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            )}
            searchable={false}
            serverPagination
            paginationMeta={{
              total: pagination.total,
              page: currentPage,
              limit: parseInt(pagination.limit),
              totalPage: pagination.totalPage
            }}
            onPageChange={(page) => setCurrentPage(page)}
            loading={loadingCustomers}
            emptyMessage="No customers found."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
