import { cn } from '@/lib/utils';
import type { EquipmentStatus, MaintenanceStatus } from '@/lib/supabase';
import { STATUS_LABELS, MAINTENANCE_STATUS_LABELS } from '@/lib/supabase';

const equipmentStatusStyles: Record<EquipmentStatus, string> = {
  operational: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  faulty: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  retired: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const maintenanceStatusStyles: Record<MaintenanceStatus, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

export function StatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      equipmentStatusStyles[status]
    )}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'operational' && 'bg-emerald-500',
        status === 'maintenance' && 'bg-amber-500',
        status === 'faulty' && 'bg-red-500',
        status === 'retired' && 'bg-gray-400',
      )} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      maintenanceStatusStyles[status]
    )}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'scheduled' && 'bg-blue-500',
        status === 'in_progress' && 'bg-amber-500',
        status === 'completed' && 'bg-emerald-500',
        status === 'cancelled' && 'bg-gray-400',
      )} />
      {MAINTENANCE_STATUS_LABELS[status]}
    </span>
  );
}
