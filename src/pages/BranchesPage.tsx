import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2, MapPin, Phone, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDataStore, useToast } from '@/hooks/use-data';
import type { Branch } from '@/lib/supabase';

export function BranchesPage() {
  const { branches, equipment } = useDataStore();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', code: '', address: '', city: '', phone: '' });
    setShowForm(true);
  };

  const openEdit = (br: Branch) => {
    setEditing(br);
    setForm({
      name: br.name,
      code: br.code,
      address: br.address || '',
      city: br.city || '',
      phone: br.phone || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast({ title: 'Champs requis', description: 'Le nom et le code sont obligatoires.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      code: form.code,
      address: form.address || null,
      city: form.city || null,
      phone: form.phone || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from('branches').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('branches').insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editing ? 'Agence modifiée' : 'Agence ajoutée', description: form.name });
      setShowForm(false);
      refreshBranches();
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const { error } = await supabase.from('branches').delete().eq('id', deleteConfirm.id);
    setDeleting(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Agence supprimée', description: deleteConfirm.name });
      setDeleteConfirm(null);
      refreshBranches();
    }
  };

  const { fetchAll } = useDataStore();
  const refreshBranches = () => fetchAll();

  const equipmentCount = (branchId: string) =>
    equipment.filter((e) => e.branch_id === branchId).length;

  const fieldClass = 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {branches.length} agence{branches.length > 1 ? 's' : ''} enregistrée{branches.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((br) => (
          <div
            key={br.id}
            className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(br)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(br)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{br.name}</h3>
            <p className="text-xs text-gray-400 font-mono mb-3">{br.code}</p>
            <div className="space-y-1.5">
              {br.address && (
                <p className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {br.address}
                </p>
              )}
              {br.city && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-5">{br.city}</p>
              )}
              {br.phone && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {br.phone}
                </p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {equipmentCount(br.id)} équipement{equipmentCount(br.id) > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Form dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {editing ? 'Modifier l\'agence' : 'Nouvelle agence'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Nom *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} placeholder="Ex: Agence Plateau" />
              </div>
              <div>
                <label className={labelClass}>Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={fieldClass} placeholder="Ex: BR-006" />
              </div>
              <div>
                <label className={labelClass}>Adresse</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Ville</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} placeholder="+221 ..." />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  <Save className="h-4 w-4" /> {saving ? '...' : 'Enregistrer'}
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
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Supprimer l'agence</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Voulez-vous supprimer <strong>{deleteConfirm.name}</strong> ? Les équipements liés ne seront pas supprimés mais perdront leur association.
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
