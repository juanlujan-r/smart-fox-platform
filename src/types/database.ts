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
  id: string;
  user_id: string;
  scheduled_date: string; // YYYY-MM-DD
  start_time: string;    // HH:MM or HH:MM:SS
  end_time: string;
  created_at?: string;
}

export interface AttendanceLogRow {
  id: string;
  user_id: string;
  state?: string;       // entrada, offline, descanso, etc.
  type?: string;        // alternative to state
  created_at: string;
  notes?: string | null;
  location?: string | null;
}

export interface ShiftExchangeRequestRow {
  id: string;
  user_id: string;
  original_date: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}