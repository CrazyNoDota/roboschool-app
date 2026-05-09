export interface Employee {
  id: string
  name: string
  role: string
  phone: string
  email: string
  salary: number
  active: boolean
  lessons_this_month?: number
  groups?: Group[]
}

export interface Group {
  id: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
  teacher_id: string
  days: string
  time: string
  duration: number
  max_students: number
  color: string
  age_range: string
  kit_type: string
  teacher?: Employee
  student_count?: number
}

export interface Student {
  id: string
  name: string
  birthday: string
  city: string
  parent_name: string
  parent_phone: string
  parent_email: string
  payment_status: 'paid' | 'due_soon' | 'overdue'
  enrolled: string
  medical_notes: string
  active: boolean
  groups?: Group[]
}

export interface Lesson {
  id: string
  group_id: string
  date: string
  start_time: string
  duration: number
  topic: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  group?: Group
}

export interface AttendanceRecord {
  id: string
  lesson_id: string
  student_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  student?: Student
}

export interface Payment {
  id: string
  student_id: string
  amount: number
  date: string
  method: 'cash' | 'kaspi' | 'card' | 'transfer'
  period: string
  notes: string
  student?: Student
}

export interface Expense {
  id: string
  category: string
  amount: number
  date: string
  description: string
}

export interface ActivityLog {
  id: string
  type: string
  text: string
  icon: string
  created_at: string
}
