import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import * as db from '../../services/db';
import { User, Role, AttendanceSession, AttendanceRecord } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const TeacherDashboard: React.FC = () => {
    const { user } = useAuth();
    const [pendingStudents, setPendingStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for creating a new session
    const [attendanceSession, setAttendanceSession] = useState<AttendanceSession | null>(null);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [duration, setDuration] = useState(5); // State for session duration

    // State for viewing reports
    const [pastSessions, setPastSessions] = useState<AttendanceSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [reportData, setReportData] = useState<{record: AttendanceRecord, student: User}[]>([]);
    const [isReportLoading, setIsReportLoading] = useState(false);


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        if (!user) return;
        try {
            const [students, sessions] = await Promise.all([
                db.getPendingUsers(Role.STUDENT),
                db.getSessionsForTeacher(user.id)
            ]);
            setPendingStudents(students);
            setPastSessions(sessions);
        } catch (err) {
            setError('Failed to fetch dashboard data.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (studentId: string) => {
        try {
            await db.approveUser(studentId);
            fetchData();
        } catch (err) {
            alert('Failed to approve student.');
        }
    };

    const handleDeny = async (studentId: string) => {
        try {
            await db.deleteUser(studentId);
            fetchData();
        } catch (err) {
            alert('Failed to deny student registration.');
        }
    };

    const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleStartSession = async () => {
        if (!user) return;
        setIsCreatingSession(true);
        try {
            const code = generateCode();
            const session = await db.createAttendanceSession(user.id, code, duration);
            setAttendanceSession(session);
            fetchData(); // Refresh past sessions list
        // FIX: Replaced invalid arrow `->` with `{` for correct catch block syntax.
        } catch (err) {
            alert('Failed to start attendance session.');
        } finally {
            setIsCreatingSession(false);
        }
    };
    
    const fetchReport = useCallback(async (sessionId: string) => {
        setIsReportLoading(true);
        try {
            const data = await db.getAttendanceForSession(sessionId);
            setReportData(data);
        } catch (error) {
            alert('Failed to load report data.');
            setReportData([]);
        } finally {
            setIsReportLoading(false);
        }
    }, []);

    const handleViewReport = (sessionId: string) => {
        if (selectedSessionId === sessionId) {
            setSelectedSessionId(null);
            setReportData([]);
        } else {
            setSelectedSessionId(sessionId);
            fetchReport(sessionId);
        }
    };

    return (
        <Layout title="Teacher Dashboard">
            <div className="space-y-8">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card title="Attendance Management">
                        {!attendanceSession ? (
                            <div className="text-center space-y-4">
                                <div>
                                    <Input
                                        label="Session Duration (minutes)"
                                        id="duration"
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                                        min="1"
                                        max="120"
                                        className="mx-auto max-w-[200px] text-center"
                                    />
                                </div>
                                <Button onClick={handleStartSession} disabled={isCreatingSession}>
                                    {isCreatingSession ? 'Starting...' : 'Start Session'}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <h4 className="text-lg font-semibold mb-2">Session Active</h4>
                                <p className="mb-2">Share this code or QR with your students.</p>
                                <div className="my-4 p-4 bg-teal-50 rounded-lg inline-block">
                                    <p className="text-3xl font-bold tracking-widest text-teal-700">
                                        {attendanceSession.code}
                                    </p>
                                </div>
                                <div className="flex justify-center my-4">
                                    <QRCodeSVG value={attendanceSession.code} size={200} />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Session expires at: {new Date(attendanceSession.expiresAt).toLocaleTimeString()}
                                </p>
                                <Button onClick={() => setAttendanceSession(null)} variant="danger" className="mt-4">
                                    End Session
                                </Button>
                            </div>
                        )}
                    </Card>

                    <Card title="Pending Student Approvals">
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : pendingStudents.length === 0 ? (
                            <p>No pending student registrations.</p>
                        ) : (
                            <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {pendingStudents.map((student) => (
                                    <li key={student.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-md gap-3">
                                        <div>
                                            <p className="font-semibold">{student.username}</p>
                                            <p className="text-sm text-gray-500">Reg No: {student.registerNumber}</p>
                                        </div>
                                        <div className="flex space-x-2 flex-shrink-0">
                                            <Button onClick={() => handleApprove(student.id)} variant="success" className="text-xs px-3 py-1">
                                                Approve
                                            </Button>
                                            <Button onClick={() => handleDeny(student.id)} variant="danger" className="text-xs px-3 py-1">
                                                Deny
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
                
                <Card title="Attendance Reports">
                    {isLoading ? (
                        <p>Loading sessions...</p>
                    ) : pastSessions.length === 0 ? (
                        <p>No attendance sessions have been created yet.</p>
                    ) : (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-700">Past Sessions</h4>
                            <ul className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                                {pastSessions.map(session => (
                                    <li key={session.id}>
                                        <button 
                                            onClick={() => handleViewReport(session.id)}
                                            className={`w-full text-left p-3 rounded-md transition-colors border ${
                                                selectedSessionId === session.id 
                                                ? 'bg-teal-100 text-teal-800 ring-2 ring-teal-200 border-teal-200' 
                                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">
                                                    Session from: {new Date(session.createdAt).toLocaleString()}
                                                </span>
                                                <span className="font-mono text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                                    {session.code}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {selectedSessionId && (
                                <div className="mt-6 border-t pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-semibold text-lg">Report for Session Started at {new Date(pastSessions.find(s=>s.id === selectedSessionId)!.createdAt).toLocaleTimeString()}</h5>
                                        <Button 
                                            onClick={() => fetchReport(selectedSessionId)} 
                                            variant="secondary"
                                            className="text-xs px-3 py-1"
                                            disabled={isReportLoading}
                                        >
                                            {isReportLoading ? 'Refreshing...' : 'Refresh'}
                                        </Button>
                                    </div>
                                    {isReportLoading ? (
                                        <p>Loading report...</p>
                                    ) : reportData.length === 0 ? (
                                        <p>No students marked present for this session.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Register No.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {reportData.map(({ student, record }) => (
                                                        <tr key={record.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.username}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.registerNumber}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
};

export default TeacherDashboard;