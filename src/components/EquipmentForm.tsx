import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-data';
import { STATUS_LABELS } from '@/lib/supabase';
import type { EquipmentStatus, Category, Branch, EquipmentWithRelations } from '@/lib/supabase';

interface EquipmentFormProps {
  equipment: EquipmentWithRelations | null;
  categories: Category[];
  branches: Branch[];
  onClose: () => void;
  onSaved: () => void;
}

export function EquipmentForm({ equipment, categories, branches, onClose, onSaved }: EquipmentFormProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: equipment?.name || '',
    serial_number: equipment?.serial_number || '',
    category_id: equipment?.category_id || '',
    branch_id: equipment?.branch_id || '',
    status: (equipment?.status || 'operational') as EquipmentStatus,
    purchase_date: equipment?.purchase_date || '',
    purchase_cost: equipment?.purchase_cost?.toString() || '',
    warranty_expiry: equipment?.warranty_expiry || '',
    notes: equipment?.notes || '',
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.serial_number) {
      toast({ title: 'Champs requis', description: 'Le nom et le numéro de série sont obligatoires.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      serial_number: form.serial_number,
      category_id: form.category_id || null,
      branch_id: form.branch_id || null,
      status: form.status,
      purchase_date: form.purchase_date || null,
      purchase_cost: form.purchase_cost ? parseFloat(form.purchase_cost) : null,
      warranty_expiry: form.warranty_expiry || null,
      notes: form.notes || null,
    };

    let error;
    if (equipment) {
      ({ error } = await supabase.from('equipment').update(payload).eq('id', equipment.id));
    } else {
      ({ error } = await supabase.from('equipment').insert(payload));
    }

    setSaving(false);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: equipment ? 'Équipement modifié' : 'Équipement ajouté',
        description: form.name,
      });
      onSaved();
    }
  };

  const fieldClass = 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 z-10">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {equipment ? 'Modifier l\'équipement' : 'Nouvel équipement'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={fieldClass}
                placeholder="Ex: DAB Plateau 01"
              />
            </div>
            <div>
              <label className={labelClass}>Numéro de série *</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                className={fieldClass}
                placeholder="Ex: DAB-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Catégorie</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className={fieldClass}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Agence</label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className={fieldClass}
              >
                <option value="">—</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EquipmentStatus })}
                className={fieldClass}
              >
                {(Object.keys(STATUS_LABELS) as EquipmentStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date d'achat</label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Coût d'achat (FCFA)</label>
              <input
                type="number"
                value={form.purchase_cost}
                onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                className={fieldClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Fin de garantie</label>
              <input
                type="date"
                value={form.warranty_expiry}
                onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={fieldClass + ' min-h-[80px] resize-y'}
              placeholder="Informations complémentaires..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
