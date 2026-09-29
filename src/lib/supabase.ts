import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type EquipmentStatus = 'operational' | 'maintenance' | 'faulty' | 'retired';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  category_id: string | null;
  branch_id: string | null;
  status: EquipmentStatus;
  purchase_date: string | null;
  purchase_cost: number | null;
  warranty_expiry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentWithRelations extends Equipment {
  category: Category | null;
  branch: Branch | null;
}

export interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  technician: string | null;
  status: MaintenanceStatus;
  scheduled_date: string | null;
  completed_date: string | null;
  created_at: string;
}

export interface MaintenanceWithEquipment extends MaintenanceRecord {
  equipment: Pick<Equipment, 'id' | 'name' | 'serial_number'> | null;
}

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  operational: 'Opérationnel',
  maintenance: 'En maintenance',
  faulty: 'En panne',
  retired: 'Retiré',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  scheduled: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  preventive: 'Préventive',
  corrective: 'Corrective',
  inspection: 'Inspection',
};
