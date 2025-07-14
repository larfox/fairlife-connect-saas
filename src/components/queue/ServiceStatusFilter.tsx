import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

interface ServiceStatusFilterProps {
  serviceId: string;
  currentFilter: string;
  patientCount: number;
  onFilterChange: (serviceId: string, status: string) => void;
}

export function ServiceStatusFilter({ 
  serviceId, 
  currentFilter, 
  patientCount, 
  onFilterChange 
}: ServiceStatusFilterProps) {
  return (
    <div className="flex items-center space-x-2">
      <Select
        value={currentFilter || 'all'}
        onValueChange={(value) => onFilterChange(serviceId, value)}
      >
        <SelectTrigger className="w-32">
          <Filter className="h-4 w-4 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="waiting">Waiting</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="unavailable">Unavailable</SelectItem>
          <SelectItem value="completed">Complete</SelectItem>
        </SelectContent>
      </Select>
      <Badge variant="outline">
        {patientCount} patients
      </Badge>
    </div>
  );
}