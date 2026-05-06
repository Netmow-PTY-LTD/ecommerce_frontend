'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import api from '@/lib/api';

export function useChatMessages(sessionId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    sessionId ? `/chat/sessions/${sessionId}/messages` : null,
    fetcher
  );
  return { messages: data?.data || [], isLoading, isError: error, mutate };
}

export function useFAQs() {
  const { data, error, isLoading } = useSWR('/chat/faqs', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // cache for 1 minute
  });
  return { faqs: data?.data || [], isLoading, isError: error };
}

export async function createChatSession(customerId?: number) {
  const res = await api.post('/chat/sessions', { customer_id: customerId, guest_id: !customerId ? crypto.randomUUID() : undefined });
  return res.data;
}

export async function sendChatMessage(sessionId: string, message: string) {
  const res = await api.post(`/chat/sessions/${sessionId}/messages`, { message, sender_type: 'customer' });
  return res.data;
}
