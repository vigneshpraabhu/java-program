export enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
  status: 'pending' | 'approved';
  registerNumber?: string; // For students
  teacherId?: string; // For teachers
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
}

export interface AttendanceSession {
  id: string;
  teacherId: string;
  code: string;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  date: string; // YYYY-MM-DD
  status: 'present';
}