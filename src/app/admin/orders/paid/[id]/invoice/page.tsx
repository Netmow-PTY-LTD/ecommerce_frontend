'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSettingsContext } from '@/contexts/SettingsContext';
import AdminLayout from '@/components/admin/admin-layout';

interface OrderItem {
  id: number;
  product_name?: string;
  product_sku?: string;
  product?: { name: string; sku: string };
  quantity: number;
  unit_price: number;
  total_price: number;
  line_total?: number;
}

interface Order {
  id: number;
  order_number: string;
  net_amount?: number;
  subtotal?: number;
  tax_amount: number;
  shipping_cost?: number;
  discount_amount?: number;
  total_amount: number;
  total_payable_amount?: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  order_date?: string;
  items: OrderItem[];
  shipping_address?: string | any;
  billing_address?: string | any;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  customer_email?: string;
  customer_phone?: string;
}

export default function AdminPaidOrderInvoicePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { settings, isLoading: settingsLoading } = useSettingsContext();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { formatCurrency } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/orders/${id}`);
      if (response.data && response.data.data) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseAddress = (address: any) => {
    if (!address) return null;
    if (typeof address === 'string') {
      try { return JSON.parse(address); } catch { return address; }
    }
    return address;
  };

  const handlePrint = () => window.print();

  if (authLoading || loading || settingsLoading) {
    return (
      <AdminLayout title="Invoice" subtitle="Loading...">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Generating invoice...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) return null;

  const shippingAddr = parseAddress(order.shipping_address);
  const createdAt = order.created_at || order.order_date || '';
  const customerName = order.customer?.name || 'N/A';
  const customerEmail = order.customer_email || order.customer?.email || '';

  return (
    <AdminLayout title={`Invoice — ${order.order_number}`} subtitle="Printable order invoice">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 print:px-0 print:max-w-none">

        {/* Action Bar - Hidden on Print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href={`/admin/orders/${id}`}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Order
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>

        {/* Invoice Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none print:rounded-none">

          {/* Invoice Header */}
          <div className="px-8 py-6 sm:px-12 print:p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-8 print:gap-4">
              <div className="flex items-center gap-3">
                {settings.logo_url
                  ? <img src={settings.logo_url} alt={settings.company_name} className="h-10 object-contain" />
                  : <h1 className="text-xl font-bold text-slate-900 uppercase">{settings.company_name || 'INVOICE'}</h1>
                }
              </div>
              <div className="text-left md:text-right">
                <h2 className="text-2xl font-bold text-slate-900 uppercase">Invoice</h2>
                <div className="mt-2 text-sm text-slate-500 space-y-1">
                  <p># {order.order_number}</p>
                  <p>{createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                  <p className={cn(
                    "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                    order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  )}>
                    Payment: {order.payment_status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="px-8 py-6 sm:px-12 print:p-6 flex flex-col sm:flex-row print:flex-row justify-between gap-12 print:gap-4 border-b border-slate-100">
            {/* Billed / Shipped By */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billed / Shipped By</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-bold text-slate-900 uppercase">{settings.company_name || 'N/A'}</p>
                <p>{settings.address || ''}</p>
                <p>{settings.city}{settings.state ? `, ${settings.state}` : ''}{settings.postal_code ? ` ${settings.postal_code}` : ''}</p>
                <p>{settings.country || ''}</p>
                {settings.phone && <p>Phone: {settings.phone}</p>}
                {settings.email && <p>Email: {settings.email}</p>}

              </div>
            </div>

            {/* Billed / Shipped To */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billed / Shipped To</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">{shippingAddr ? `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim() || customerName : customerName}</p>
                {shippingAddr ? (
                  <>
                    <p>{shippingAddr.address || ''}</p>
                    {shippingAddr.apartment && <p>{shippingAddr.apartment}</p>}
                    <p>{shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}</p>
                    <p>{shippingAddr.country || ''}</p>
                  </>
                ) : null}
                {customerEmail && <p className="pt-2 text-slate-400">{customerEmail}</p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-6 sm:px-12 print:p-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Item Details</th>
                  <th className="pb-4 text-xs font-bold text-slate-900 uppercase tracking-wider text-center w-24">Qty</th>
                  <th className="pb-4 text-xs font-bold text-slate-900 uppercase tracking-wider text-right w-32">Price</th>
                  <th className="pb-4 text-xs font-bold text-slate-900 uppercase tracking-wider text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4">
                      <p className="text-sm font-bold text-slate-900">{item.product?.name || item.product_name}</p>
                      {(item.product?.sku || item.product_sku) && (
                        <p className="text-xs text-slate-500 mt-0.5">SKU: {item.product?.sku || item.product_sku}</p>
                      )}
                    </td>
                    <td className="py-4 text-center text-sm text-slate-600">{item.quantity}</td>
                    <td className="py-4 text-right text-sm text-slate-600">{formatCurrency(item.unit_price)}</td>
                    <td className="py-4 text-right text-sm font-bold text-slate-900">{formatCurrency(item.total_price ?? item.line_total ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end pt-8">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.net_amount ?? order.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping_cost ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-rose-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-indigo-600">{formatCurrency(order.total_payable_amount ?? order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 sm:px-12 print:p-6 bg-slate-50/50 border-t border-slate-100 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-xs text-slate-400 space-y-1">
                <p>Thank you for your business.</p>
                {settings.email && <p>For any questions, please contact {settings.email}</p>}
              </div>
              {settings.website && (
                <div className="text-xs text-slate-400 md:text-right">
                  <p>{settings.website}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            .print-hidden { display: none !important; }
            @page { margin: 0.5cm; size: auto; }
            main { padding: 0 !important; margin: 0 !important; }
            aside { display: none !important; }
            header { display: none !important; }
            .rounded-xl { border-radius: 0 !important; }
            .shadow-sm { box-shadow: none !important; }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}
