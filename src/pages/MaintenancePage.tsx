import { useState, useMemo } from 'react';
import { Search, Wrench, Filter, X, Calendar, DollarSign, User, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDataStore, useToast } from '@/hooks/use-data';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { MaintenanceStatusBadge } from '@/components/StatusBadge';
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from '@/lib/supabase';
import type { MaintenanceStatus, MaintenanceType, MaintenanceWithEquipment } from '@/lib/supabase';

export function MaintenancePage() {
  const { maintenance, equipment, refreshMaintenance } = useDataStore();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'all'>('all');

  const [editing, setEditing] = useState<MaintenanceWithEquipment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MaintenanceWithEquipment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    id: '',
    equipment_id: '',
    type: 'preventive' as MaintenanceType,
    description: '',
    cost: '',
    technician: '',
    status: 'scheduled' as MaintenanceStatus,
    scheduled_date: '',
  });

  const filtered = useMemo(() => {
    let result = maintenance;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.description.toLowerCase().includes(q) ||
          (m.technician || '').toLowerCase().includes(q) ||
          (m.equipment?.name || '').toLowerCase().includes(q) ||
          (m.equipment?.serial_number || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter((m) => m.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter((m) => m.type === typeFilter);
    return result;
  }, [maintenance, search, statusFilter, typeFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      id: '',
      equipment_id: equipment[0]?.id || '',
      type: 'preventive',
      description: '',
      cost: '',
      technician: '',
      status: 'scheduled',
      scheduled_date: '',
    });
    setShowForm(true);
  };

  const openEdit = (m: MaintenanceWithEquipment) => {
    setEditing(m);
    setForm({
      id: m.id,
      equipment_id: m.equipment_id,
      type: m.type,
      description: m.description,
      cost: m.cost?.toString() || '',
      technician: m.technician || '',
      status: m.status,
      scheduled_date: m.scheduled_date || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.equipment_id || !form.description) {
      toast({ title: 'Champs requis', description: 'L\'équipement et la description sont obligatoires.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      equipment_id: form.equipment_id,
      type: form.type,
      description: form.description,
      cost: form.cost ? parseFloat(form.cost) : 0,
      technician: form.technician || null,
      status: form.status,
      scheduled_date: form.scheduled_date || null,
      completed_date: form.status === 'completed' ? new Date().toISOString().split('T')[0] : null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from('maintenance_records').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('maintenance_records').insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editing ? 'Maintenance modifiée' : 'Maintenance ajoutée' });
      setShowForm(false);
      await refreshMaintenance();
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const { error } = await supabase.from('maintenance_records').delete().eq('id', deleteConfirm.id);
    setDeleting(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Maintenance supprimée' });
      setDeleteConfirm(null);
      await refreshMaintenance();
    }
  };

  const hasFilters = search || statusFilter !== 'all' || typeFilter !== 'all';
  const fieldClass = 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par description, technicien, équipement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Wrench className="h-4 w-4" /> Nouvelle maintenance
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | 'all')}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          {(Object.keys(MAINTENANCE_STATUS_LABELS) as MaintenanceStatus[]).map((s) => (
            <option key={s} value={s}>{MAINTENANCE_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MaintenanceType | 'all')}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Tous les types</option>
          {(Object.keys(MAINTENANCE_TYPE_LABELS) as MaintenanceType[]).map((t) => (
            <option key={t} value={t}>{MAINTENANCE_TYPE_LABELS[t]}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-3 w-3" /> Réinitialiser
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} enregistrement{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-gray-200 dark:border-gray-800">
            <Wrench className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-2" />
            <p className="text-sm text-gray-400">Aucune maintenance trouvée</p>
          </div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      {MAINTENANCE_TYPE_LABELS[m.type]}
                    </span>
                    <MaintenanceStatusBadge status={m.status} />
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {m.equipment?.name || 'Équipement supprimé'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {m.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                    {m.technician && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {m.technician}
                      </span>
                    )}
                    {m.scheduled_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(m.scheduled_date)}
                      </span>
                    )}
                    {m.cost > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> {formatCurrency(m.cost)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(m)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(m)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {editing ? 'Modifier la maintenance' : 'Nouvelle maintenance'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Équipement *</label>
                <select
                  value={form.equipment_id}
                  onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                  className={fieldClass}
                >
                  <option value="">— Sélectionner —</option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.serial_number})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceType })}
                    className={fieldClass}
                  >
                    {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as MaintenanceStatus })}
                    className={fieldClass}
                  >
                    {Object.entries(MAINTENANCE_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={fieldClass}
                  placeholder="Description de l'intervention"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Technicien</label>
                  <input type="text" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Coût (FCFA)</label>
                  <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Date prévue</label>
                  <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className={fieldClass} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? '...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950 shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Supprimer la maintenance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Voulez-vous supprimer cet enregistrement de maintenance ? Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
