/**
 * Tipos TypeScript del sistema EcoCampus UMAR
 */

export interface User {
  id: string;
  employee_id: string;
  full_name: string;
  role: "admin" | "collector" | "supervisor";
  is_active: boolean;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  is_active: boolean;
}

export interface Location {
  id: string;
  name: string;
  sector: string | null;
  location_type: string | null;
  description: string | null;
  is_active: boolean;
  campus_id: string;
  campus?: Campus;
}

export interface WasteCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  icon_url?: string | null;
  is_active: boolean;
  density_kg_per_liter: number | null;
}

export interface Container {
  id: string;
  container_code: string;
  tare_weight: number;
  volume_liters: number | null;
  status: string;
  qr_generated: boolean;
  is_active: boolean;
  location_id: string;
  waste_category_id: string;
  waste_category?: WasteCategory;
  location?: Location;
}

export interface CollectionRecord {
  id: string;
  gross_weight: number | null;
  net_weight: number | null;
  fill_level: string;
  physical_state: string;
  condition: string;
  separation_level: string;
  created_at: string;
  container_id: string;
  collector_id: string;
  container?: Container;
  collector?: User;
  incident?: Incident;
}

export interface Incident {
  id: string;
  description: string;
  quick_tag: string | null;
  photo_url: string | null;
  status: "open" | "in_progress" | "resolved";
  collection_record_id: string | null;
  reported_by_id: string;
  container_id: string;
  created_at: string;
}