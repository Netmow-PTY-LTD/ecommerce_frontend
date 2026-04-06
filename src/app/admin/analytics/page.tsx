'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/analytics/sales');
  }, [router]);
  return null;
}
