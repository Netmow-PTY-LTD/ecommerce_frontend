'use client';
import { StarRating } from './star-rating';

interface ReviewSummaryProps {
  summary: { average: number; total: number; distribution: Record<number, number> };
}

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  if (!summary || summary.total === 0) return <p className="text-gray-500 text-sm">No reviews yet</p>;
  const maxBar = Math.max(...Object.values(summary.distribution), 1);

  return (
    <div className="flex gap-6">
      <div className="text-center">
        <div className="text-4xl font-bold">{summary.average}</div>
        <StarRating rating={Math.round(summary.average)} />
        <p className="text-sm text-gray-500 mt-1">{summary.total} reviews</p>
      </div>
      <div className="flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map(star => (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-3">{star}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-400 rounded-full h-2" style={{ width: `${((summary.distribution[star] || 0) / maxBar) * 100}%` }} />
            </div>
            <span className="text-gray-500 w-8">{summary.distribution[star] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
