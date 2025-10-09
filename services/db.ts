import { User, Role, AttendanceSession, AttendanceRecord } from '../types';
import { 
    DB_USERS_KEY, 
    DB_ATTENDANCE_SESSIONS_KEY, 
    DB_ATTENDANCE_RECORDS_KEY 
} from '../constants';

// --- User Management ---

const getUsers = (): User[] => {
    try {
        const users = localStorage.getItem(DB_USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch (error) {
        console.error("Failed to parse users from localStorage", error);
        return [];
    }
};

const setUsers = (users: User[]) => {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
};

export const initializeDb = () => {
    const users = getUsers();
    if (!users.some(u => u.role === Role.ADMIN)) {
        const adminUser: User = {
            id: `admin-${Date.now()}`,
            username: 'admin',
            password: 'admin123', // In a real app, this should be hashed
            role: Role.ADMIN,
            status: 'approved',
        };
        setUsers([adminUser]);
    }
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getUsers();
            if (users.some(u => u.username === userData.username)) {
                return reject(new Error('Username already exists.'));
            }
            if (userData.role === Role.STUDENT && users.some(u => u.registerNumber === userData.registerNumber)) {
                return reject(new Error('Register Number already exists.'));
            }
            if (userData.role === Role.TEACHER && users.some(u => u.teacherId === userData.teacherId)) {
                return reject(new Error('Teacher ID already exists.'));
            }

            const newUser: User = {
                id: `${userData.role}-${Date.now()}`,
                ...userData,
            };
            setUsers([...users, newUser]);
            resolve(newUser);
        }, 500);
    });
};

export const deleteUser = async (userId: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let users = getUsers();
            users = users.filter(u => u.id !== userId);
            setUsers(users);
            resolve();
        }, 300);
    });
};

export const authenticateUser = async (username: string, password: string, role: Role): Promise<User | null> => {
     return new Promise((resolve) => {
        setTimeout(() => {
            const users = getUsers();
            const user = users.find(u => 
                u.username === username && 
                u.password === password && 
                u.role === role
            );
            resolve(user || null);
        }, 500);
    });
};

export const getPendingUsers = async (role: Role.TEACHER | Role.STUDENT): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = getUsers();
            const pending = users.filter(u => u.role === role && u.status === 'pending');
            resolve(pending);
        }, 300);
    });
};

export const getAllApprovedUsers = async (): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = getUsers();
            const approved = users.filter(u => u.status === 'approved' && u.role !== Role.ADMIN);
            resolve(approved);
        }, 300);
    });
};


export const approveUser = async (userId: string): Promise<User> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return reject(new Error('User not found.'));
            }
            users[userIndex].status = 'approved';
            setUsers(users);
            resolve(users[userIndex]);
        }, 500);
    });
};

// --- Attendance Management ---

const getAttendanceSessions = (): AttendanceSession[] => {
    try {
        const sessions = localStorage.getItem(DB_ATTENDANCE_SESSIONS_KEY);
        return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
        console.error("Failed to parse attendance sessions from localStorage", error);
        return [];
    }
};

const setAttendanceSessions = (sessions: AttendanceSession[]) => {
    localStorage.setItem(DB_ATTENDANCE_SESSIONS_KEY, JSON.stringify(sessions));
};

const getAttendanceRecords = (): AttendanceRecord[] => {
    try {
        const records = localStorage.getItem(DB_ATTENDANCE_RECORDS_KEY);
        return records ? JSON.parse(records) : [];
    } catch (error) {
        console.error("Failed to parse attendance records from localStorage", error);
        return [];
    }
};

const setAttendanceRecords = (records: AttendanceRecord[]) => {
    localStorage.setItem(DB_ATTENDANCE_RECORDS_KEY, JSON.stringify(records));
};

const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

export const createAttendanceSession = async (teacherId: string, code: string, durationMinutes: number): Promise<AttendanceSession> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const now = Date.now();
            const newSession: AttendanceSession = {
                id: `session-${now}`,
                teacherId,
                code,
                createdAt: now,
                expiresAt: now + durationMinutes * 60 * 1000,
            };
            const sessions = getAttendanceSessions();
            setAttendanceSessions([...sessions, newSession]);
            resolve(newSession);
        }, 300);
    });
};

export const validateAttendanceCode = async (code: string): Promise<AttendanceSession> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            const sessions = getAttendanceSessions();
            const now = Date.now();
            const activeSession = sessions.find(s => s.code.toUpperCase() === code.toUpperCase() && s.expiresAt > now);
            if (!activeSession) {
                return reject(new Error('Invalid or expired attendance code.'));
            }
            resolve(activeSession);
        }, 300);
    });
};


export const markStudentPresent = async (studentId: string, sessionId: string): Promise<AttendanceRecord> => {
    return new Promise(async (resolve, reject) => {
        const today = getTodayDateString();
        const records = getAttendanceRecords();

        if (records.some(r => r.studentId === studentId && r.date === today)) {
            return reject(new Error('Attendance already marked for today.'));
        }
        
        const newRecord: AttendanceRecord = {
            id: `record-${studentId}-${today}`,
            studentId,
            sessionId: sessionId,
            date: today,
            status: 'present'
        };

        setAttendanceRecords([...records, newRecord]);
        resolve(newRecord);
    });
};

export const getStudentAttendanceForToday = async (studentId: string): Promise<AttendanceRecord | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const records = getAttendanceRecords();
            const today = getTodayDateString();
            const record = records.find(r => r.studentId === studentId && r.date === today);
            resolve(record || null);
        }, 200);
    });
};


export const getAttendanceForSession = async (sessionId: string): Promise<{record: AttendanceRecord, student: User}[]> => {
     return new Promise((resolve) => {
        setTimeout(() => {
            const records = getAttendanceRecords().filter(r => r.sessionId === sessionId);
            const users = getUsers();
            const results = records.map(record => {
                const student = users.find(u => u.id === record.studentId);
                return { record, student: student! }; // Assuming student will be found
            }).filter(item => !!item.student);
            resolve(results);
        }, 500);
    });
};

export const getSessionsForTeacher = async (teacherId: string): Promise<AttendanceSession[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const sessions = getAttendanceSessions();
            const teacherSessions = sessions
                .filter(s => s.teacherId === teacherId)
                .sort((a, b) => b.createdAt - a.createdAt); // Newest first
            resolve(teacherSessions);
        }, 300);
    });
};

export const getStudents = async (): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getUsers().filter(u => u.role === Role.STUDENT));
        }, 300);
    });
};