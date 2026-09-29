import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  EquipmentWithRelations,
  Category,
  Branch,
  MaintenanceWithEquipment,
} from '@/lib/supabase';

interface DataState {
  equipment: EquipmentWithRelations[];
  categories: Category[];
  branches: Branch[];
  maintenance: MaintenanceWithEquipment[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  refreshEquipment: () => Promise<void>;
  refreshMaintenance: () => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  equipment: [],
  categories: [],
  branches: [],
  maintenance: [],
  loading: true,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [eqRes, catRes, brRes, mainRes] = await Promise.all([
        supabase
          .from('equipment')
          .select('*, category:categories(*), branch:branches(*)')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('branches').select('*').order('name'),
        supabase
          .from('maintenance_records')
          .select('*, equipment:equipment(id, name, serial_number)')
          .order('scheduled_date', { ascending: false }),
      ]);

      if (eqRes.error) throw eqRes.error;
      if (catRes.error) throw catRes.error;
      if (brRes.error) throw brRes.error;
      if (mainRes.error) throw mainRes.error;

      set({
        equipment: (eqRes.data as EquipmentWithRelations[]) || [],
        categories: (catRes.data as Category[]) || [],
        branches: (brRes.data as Branch[]) || [],
        maintenance: (mainRes.data as MaintenanceWithEquipment[]) || [],
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  refreshEquipment: async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, category:categories(*), branch:branches(*)')
      .order('created_at', { ascending: false });
    if (!error && data) {
      set({ equipment: data as EquipmentWithRelations[] });
    }
  },

  refreshMaintenance: async () => {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*, equipment:equipment(id, name, serial_number)')
      .order('scheduled_date', { ascending: false });
    if (!error && data) {
      set({ maintenance: data as MaintenanceWithEquipment[] });
    }
  },
}));

export function useData() {
  const { fetchAll } = useDataStore();
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched) {
      fetchAll();
      setFetched(true);
    }
  }, [fetchAll, fetched]);

  return useDataStore();
}

export function useToast() {
  return useCallback((opts: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    const event = new CustomEvent('app-toast', { detail: opts });
    window.dispatchEvent(event);
  }, []);
}
