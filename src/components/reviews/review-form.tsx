'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StarRating } from './star-rating';

interface ReviewFormProps {
  productId: number;
  onSubmit: (data: { product_id: number; rating: number; title?: string; body?: string }) => Promise<void>;
}

export function ReviewForm({ productId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    try {
      await onSubmit({ product_id: productId, rating, title: title || undefined, body: body || undefined });
      setRating(0); setTitle(''); setBody('');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Your Rating</label>
        <StarRating rating={rating} interactive onChange={setRating} size={28} />
      </div>
      <Input placeholder="Review title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea placeholder="Write your review... (optional)" value={body} onChange={e => setBody(e.target.value)} rows={4} />
      <Button type="submit" disabled={rating === 0 || loading}>{loading ? 'Submitting...' : 'Submit Review'}</Button>
    </form>
  );
}
