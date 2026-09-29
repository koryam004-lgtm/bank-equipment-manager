import { useState, useEffect } from 'react';
import { X, Pencil, Calendar, DollarSign, FileText, Wrench, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-data';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge, MaintenanceStatusBadge } from '@/components/StatusBadge';
import { STATUS_LABELS, MAINTENANCE_TYPE_LABELS } from '@/lib/supabase';
import type { EquipmentWithRelations, MaintenanceRecord } from '@/lib/supabase';

interface EquipmentDetailProps {
  equipment: EquipmentWithRelations;
  onClose: () => void;
  onEdit: () => void;
}

export function EquipmentDetail({ equipment, onClose, onEdit }: EquipmentDetailProps) {
  const toast = useToast();
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loadingMaint, setLoadingMaint] = useState(true);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [savingMaint, setSavingMaint] = useState(false);

  const [maintForm, setMaintForm] = useState({
    type: 'preventive' as 'preventive' | 'corrective' | 'inspection',
    description: '',
    cost: '',
    technician: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    scheduled_date: '',
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    fetchMaintenance();
  }, [equipment.id]);

  const fetchMaintenance = async () => {
    setLoadingMaint(true);
    const { data } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('equipment_id', equipment.id)
      .order('scheduled_date', { ascending: false });
    setMaintenance((data as MaintenanceRecord[]) || []);
    setLoadingMaint(false);
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintForm.description) {
      toast({ title: 'Champ requis', description: 'La description est obligatoire.', variant: 'destructive' });
      return;
    }
    setSavingMaint(true);
    const { error } = await supabase.from('maintenance_records').insert({
      equipment_id: equipment.id,
      type: maintForm.type,
      description: maintForm.description,
      cost: maintForm.cost ? parseFloat(maintForm.cost) : 0,
      technician: maintForm.technician || null,
      status: maintForm.status,
      scheduled_date: maintForm.scheduled_date || null,
      completed_date: maintForm.status === 'completed' ? new Date().toISOString().split('T')[0] : null,
    });
    setSavingMaint(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Maintenance ajoutée' });
      setMaintForm({
        type: 'preventive',
        description: '',
        cost: '',
        technician: '',
        status: 'scheduled',
        scheduled_date: '',
      });
      setShowMaintForm(false);
      fetchMaintenance();
    }
  };

  const infoItems = [
    { label: 'Numéro de série', value: equipment.serial_number, mono: true },
    { label: 'Catégorie', value: equipment.category?.name || '—' },
    { label: 'Agence', value: equipment.branch?.name || '—' },
    { label: 'Statut', value: STATUS_LABELS[equipment.status] },
    { label: 'Date d\'achat', value: formatDate(equipment.purchase_date) },
    { label: 'Coût d\'achat', value: formatCurrency(equipment.purchase_cost) },
    { label: 'Fin de garantie', value: formatDate(equipment.warranty_expiry) },
  ];

  const fieldClass = 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{equipment.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{equipment.serial_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <StatusBadge status={equipment.status} />
            {equipment.branch && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                · {equipment.branch.name}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
                <p className={cn(
                  'text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5',
                  item.mono && 'font-mono'
                )}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Notes */}
          {equipment.notes && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{equipment.notes}</p>
            </div>
          )}

          {/* Maintenance section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Historique de maintenance
                </h4>
                <span className="text-xs text-gray-400">({maintenance.length})</span>
              </div>
              <button
                onClick={() => setShowMaintForm(!showMaintForm)}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="h-3 w-3" /> Ajouter
              </button>
            </div>

            {showMaintForm && (
              <form onSubmit={handleAddMaintenance} className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      value={maintForm.type}
                      onChange={(e) => setMaintForm({ ...maintForm, type: e.target.value as 'preventive' | 'corrective' | 'inspection' })}
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
                      value={maintForm.status}
                      onChange={(e) => setMaintForm({ ...maintForm, status: e.target.value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' })}
                      className={fieldClass}
                    >
                      <option value="scheduled">Planifiée</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description *</label>
                  <input
                    type="text"
                    value={maintForm.description}
                    onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                    className={fieldClass}
                    placeholder="Description de la maintenance"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Technicien</label>
                    <input
                      type="text"
                      value={maintForm.technician}
                      onChange={(e) => setMaintForm({ ...maintForm, technician: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Coût (FCFA)</label>
                    <input
                      type="number"
                      value={maintForm.cost}
                      onChange={(e) => setMaintForm({ ...maintForm, cost: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Date prévue</label>
                    <input
                      type="date"
                      value={maintForm.scheduled_date}
                      onChange={(e) => setMaintForm({ ...maintForm, scheduled_date: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMaintForm(false)}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingMaint}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingMaint ? '...' : 'Ajouter'}
                  </button>
                </div>
              </form>
            )}

            {loadingMaint ? (
              <p className="text-sm text-gray-400 py-4 text-center">Chargement...</p>
            ) : maintenance.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Aucune maintenance enregistrée</p>
            ) : (
              <div className="space-y-2">
                {maintenance.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 dark:border-gray-800 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {MAINTENANCE_TYPE_LABELS[m.type]}
                        </span>
                        <MaintenanceStatusBadge status={m.status} />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{m.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {m.technician && <span>Par {m.technician}</span>}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
