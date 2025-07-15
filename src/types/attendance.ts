export interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  attendance_status: string;
  check_in_type?: string; // Added for field/office distinction
}

export interface LeaveBalance {
  casual_leave: number;
  earned_leave: number;
  sick_leave: number;
  maternity_leave: number;
  employee_id?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  leave_status: string;
  reason?: string;
  request_date?: string;
  department_approval_status?: string;
  hr_approval_status?: string;
  department_approved_by?: string;
}

export const LEAVE_TYPES = [
  { id: 'CASUAL_LEAVE', name: 'Casual Leave' },
  { id: 'SICK_LEAVE', name: 'Sick Leave' },
  { id: 'EARNED_LEAVE', name: 'Earned Leave' },
  { id: 'MATERNITY_LEAVE', name: 'Maternity Leave' }
] as const;

export const BaseResponse = <T>(data: T): { data: T } => ({
  data
});