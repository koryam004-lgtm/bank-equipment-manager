import { useMemo } from 'react';
import {
  Package,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useDataStore } from '@/hooks/use-data';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge, MaintenanceStatusBadge } from '@/components/StatusBadge';
import { STATUS_LABELS, MAINTENANCE_STATUS_LABELS } from '@/lib/supabase';
import type { EquipmentWithRelations, MaintenanceWithEquipment } from '@/lib/supabase';

type Page = 'dashboard' | 'equipment' | 'branches' | 'maintenance';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const STATUS_COLORS: Record<string, string> = {
  operational: '#10b981',
  maintenance: '#f59e0b',
  faulty: '#ef4444',
  retired: '#9ca3af',
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const { equipment, maintenance, branches } = useDataStore();

  const stats = useMemo(() => {
    const total = equipment.length;
    const operational = equipment.filter((e) => e.status === 'operational').length;
    const inMaintenance = equipment.filter((e) => e.status === 'maintenance').length;
    const faulty = equipment.filter((e) => e.status === 'faulty').length;
    const totalValue = equipment.reduce((sum, e) => sum + (e.purchase_cost || 0), 0);
    const pendingMaintenance = maintenance.filter(
      (m) => m.status === 'scheduled' || m.status === 'in_progress'
    ).length;
    return { total, operational, inMaintenance, faulty, totalValue, pendingMaintenance };
  }, [equipment, maintenance]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    equipment.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key,
      value,
      key,
    }));
  }, [equipment]);

  const branchData = useMemo(() => {
    const counts: Record<string, number> = {};
    equipment.forEach((e) => {
      const name = e.branch?.name || 'Non assigné';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [equipment]);

  const upcomingMaintenance = useMemo(() => {
    return maintenance
      .filter((m) => m.status === 'scheduled' || m.status === 'in_progress')
      .sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || ''))
      .slice(0, 5);
  }, [maintenance]);

  const recentEquipment = useMemo(() => {
    return equipment.slice(0, 5);
  }, [equipment]);

  const statCards = [
    {
      label: 'Total équipements',
      value: stats.total,
      icon: Package,
      color: 'blue',
      bg: 'bg-blue-50 dark:bg-blue-950',
      iconBg: 'bg-blue-600',
    },
    {
      label: 'Opérationnels',
      value: stats.operational,
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      iconBg: 'bg-emerald-600',
    },
    {
      label: 'En maintenance',
      value: stats.inMaintenance,
      icon: Wrench,
      color: 'amber',
      bg: 'bg-amber-50 dark:bg-amber-950',
      iconBg: 'bg-amber-600',
    },
    {
      label: 'En panne',
      value: stats.faulty,
      icon: AlertTriangle,
      color: 'red',
      bg: 'bg-red-50 dark:bg-red-950',
      iconBg: 'bg-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                </div>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', card.iconBg)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Value + pending maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">Valeur totale du parc</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <CalendarClock className="h-4 w-4" />
            <span className="text-sm font-medium">Maintenances en attente</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.pendingMaintenance}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Taux de disponibilité</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.total > 0 ? Math.round((stats.operational / stats.total) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status pie chart */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par statut
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={2}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#999'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Branch bar chart */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Équipements par agence
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming maintenance + recent equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Maintenances à venir
            </h3>
            <button
              onClick={() => onNavigate('maintenance')}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {upcomingMaintenance.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
              Aucune maintenance planifiée
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingMaintenance.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {m.equipment?.name || '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {m.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <MaintenanceStatusBadge status={m.status} />
                    <span className="text-xs text-gray-400">{formatDate(m.scheduled_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Équipements récents
            </h3>
            <button
              onClick={() => onNavigate('equipment')}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {recentEquipment.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
              Aucun équipement enregistré
            </p>
          ) : (
            <div className="space-y-3">
              {recentEquipment.map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {eq.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {eq.serial_number} · {eq.category?.name || '—'} · {eq.branch?.name || '—'}
                    </p>
                  </div>
                  <StatusBadge status={eq.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
