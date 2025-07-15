export interface Address {
  city: string;
  country: string;
  id?: string;
  state: string;
  street: string;
  zip: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string;
  role: string;
  address: Address[];
  permission: string[];
  avatar: string;
  mobile: string;
  aadhar_no: string;
  work_hours?: string;
  shift_time?: string;
  pan_no: string;
  blood_group: string;
  company_id: string;
  department_id: string;
  department_name: string;
  dob: string;
  gender: string;
  joining_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  reporting_manager_id?: string;
  father_name: string;
  mother_name: string;
  designation: string;
}

export interface Department {
  ID: string;
  Name: string;
  CompanyID: string;
}

export interface Company {
  id: string;
  name: string;
}

export const ROLES = [
  { id: 'EMPLOYEE', name: 'employee' },
  { id: 'HR', name: 'hr' },
  { id: 'ADMIN', name: 'admin' },
  { id: 'MANAGER', name: 'manager' }
] as const;

export const GENDERS = [
  { id: 'MALE', name: 'Male' },
  { id: 'FEMALE', name: 'Female' },
  { id: 'OTHER', name: 'Other' }
] as const;

export const BLOOD_GROUPS = [
  { id: 'A+', name: 'A+' },
  { id: 'A-', name: 'A-' },
  { id: 'B+', name: 'B+' },
  { id: 'B-', name: 'B-' },
  { id: 'O+', name: 'O+' },
  { id: 'O-', name: 'O-' },
  { id: 'AB+', name: 'AB+' },
  { id: 'AB-', name: 'AB-' }
] as const;

export const PERMISSIONS = [
  { id: 'Manager', name: 'manager' },
  { id: 'Employee', name: '' },
  { id: 'Admin', name: 'admin' },
  { id: 'Super Admin', name: 'super_admin' }
] as const;