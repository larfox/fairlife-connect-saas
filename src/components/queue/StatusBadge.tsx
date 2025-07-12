import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const variants = {
    waiting: 'secondary',
    in_progress: 'default',
    completed: 'default'
  } as const;

  const colors = {
    waiting: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80',
    in_progress: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80',
    completed: 'bg-green-100 text-green-800 hover:bg-green-100/80'
  } as const;

  return (
    <Badge 
      variant={variants[status as keyof typeof variants] || 'secondary'}
      className={`${colors[status as keyof typeof colors] || ''} capitalize`}
    >
      {getStatusIcon(status)}
      <span className="ml-1">{status.replace('_', ' ')}</span>
    </Badge>
  );
}