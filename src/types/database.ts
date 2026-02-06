export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
  image_url?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

// Profile JSONB types (Smart Fox ERP)
export interface PersonalData {
  fullName?: string;
  ssn?: string;
  dependents?: number;
  socialSecurity?: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  date: string;
}

export interface AcademicData {
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface MedicalData {
  bloodType?: string;
  allergies?: string;
  medicalConditions?: string[];
  eps?: string;
  arl?: string;
  emergencyContact?: EmergencyContact;
}

export interface SizesData {
  shirt?: string;
  pants?: string;
  shoes?: string;
  gloves?: string;
}

export interface ProfileRow {
  id: string;
  role?: string;
  personal_data?: PersonalData | null;
  medical_data?: MedicalData | null;
  academic_data?: AcademicData | null;
  sizes_data?: SizesData | null;
}

// Shifts & attendance (Mis Turnos)
export interface ScheduleRow {
  id: number;
  user_id: string;
  scheduled_date: string; // YYYY-MM-DD
  start_time: string;    // HH:MM or HH:MM:SS
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceLogRow {
  id: number;
  user_id: string;
  state?: string;       // entrada, offline, descanso, etc.
  type?: string;        // alternative to state
  created_at: string;
  notes?: string | null;
  location?: string | null;
}

export interface ShiftExchangeRequestRow {
  id: number;
  user_id: string;
  original_date: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  reason?: string | null;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at?: string;
}

// HR Requests (Reportar / Solicitar)
export type HrRequestType = 'permiso' | 'licencia' | 'novedad' | 'vacaciones' | 'incapacidad';
export type HrRequestStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface HrRequestRow {
  id: number;
  user_id: string;
  type: HrRequestType;
  details: string | null;
  start_date: string;
  end_date: string;
  attachment_url: string | null;
  status: HrRequestStatus;
  created_at?: string;
  updated_at?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string | null;
          full_name: string | null;
          document_id: string | null;
          document_type: string | null;
          hiring_date: string | null;
          contract_type: string | null;
          base_salary: number | null;
          minute_rate: number | null;
          personal_data: Json | null;
          medical_data: Json | null;
          sizes_data: Json | null;
          bank_account: Json | null;
          updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          role?: string | null;
          full_name?: string | null;
          document_id?: string | null;
          document_type?: string | null;
          hiring_date?: string | null;
          contract_type?: string | null;
          base_salary?: number | null;
          minute_rate?: number | null;
          personal_data?: Json | null;
          medical_data?: Json | null;
          sizes_data?: Json | null;
          bank_account?: Json | null;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          role?: string | null;
          full_name?: string | null;
          document_id?: string | null;
          document_type?: string | null;
          hiring_date?: string | null;
          contract_type?: string | null;
          base_salary?: number | null;
          minute_rate?: number | null;
          personal_data?: Json | null;
          medical_data?: Json | null;
          sizes_data?: Json | null;
          bank_account?: Json | null;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      attendance_logs: {
        Row: {
          id: number;
          user_id: string;
          state: string | null;
          notes: string | null;
          location: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          state?: string | null;
          notes?: string | null;
          location?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          state?: string | null;
          notes?: string | null;
          location?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: number;
          user_id: string;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          break_start: string | null;
          break_end: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          break_start?: string | null;
          break_end?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          scheduled_date?: string;
          start_time?: string;
          end_time?: string;
          break_start?: string | null;
          break_end?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      hr_requests: {
        Row: {
          id: number;
          user_id: string;
          type: string | null;
          status: string | null;
          attachment_url: string | null;
          details: string | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          type?: string | null;
          status?: string | null;
          attachment_url?: string | null;
          details?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          type?: string | null;
          status?: string | null;
          attachment_url?: string | null;
          details?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      shift_exchange_requests: {
        Row: {
          id: number;
          user_id: string;
          original_date: string;
          requested_date: string;
          requested_start_time: string;
          requested_end_time: string;
          reason: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          original_date: string;
          requested_date: string;
          requested_start_time: string;
          requested_end_time: string;
          reason?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          original_date?: string;
          requested_date?: string;
          requested_start_time?: string;
          requested_end_time?: string;
          reason?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      payroll_runs: {
        Row: {
          id: number;
          start_date: string;
          end_date: string;
          status: string | null;
          total_paid: number | null;
          created_by: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          start_date: string;
          end_date: string;
          status?: string | null;
          total_paid?: number | null;
          created_by: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          start_date?: string;
          end_date?: string;
          status?: string | null;
          total_paid?: number | null;
          created_by?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      payroll_items: {
        Row: {
          id: number;
          payroll_run_id: number;
          user_id: string;
          base_salary: number;
          minutes_worked: number;
          total_pay: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          payroll_run_id: number;
          user_id: string;
          base_salary: number;
          minutes_worked: number;
          total_pay: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          payroll_run_id?: number;
          user_id?: string;
          base_salary?: number;
          minutes_worked?: number;
          total_pay?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      salary_audit: {
        Row: {
          id: string;
          employee_id: string;
          changed_by_id: string | null;
          old_salary: number | null;
          new_salary: number;
          change_reason: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          changed_by_id?: string | null;
          old_salary?: number | null;
          new_salary: number;
          change_reason?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          changed_by_id?: string | null;
          old_salary?: number | null;
          new_salary?: number;
          change_reason?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};