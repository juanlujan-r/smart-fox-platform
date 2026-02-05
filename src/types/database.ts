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