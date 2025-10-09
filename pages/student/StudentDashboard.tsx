import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import * as db from '../../services/db';
import { AttendanceRecord } from '../../types';

// Let TypeScript know about the global from the script tag
declare const Html5QrcodeScanner: any;

const QR_READER_ID = "qr-reader";

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceRecord | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    const checkAttendance = useCallback(async () => {
        if (user) {
            const record = await db.getStudentAttendanceForToday(user.id);
            setAttendanceStatus(record);
        }
    }, [user]);

    useEffect(() => {
        checkAttendance();
    }, [checkAttendance]);

    const processAttendanceCode = useCallback(async (code: string) => {
        setIsLoading(true);
        setScanMessage({ type: '', text: '' });
        try {
            // FIX: Get session from validation and pass session ID to mark attendance.
            const session = await db.validateAttendanceCode(code);
            
            if (!user) {
                throw new Error("User not found.");
            }
            await db.markStudentPresent(user.id, session.id);
            setScanMessage({ type: 'success', text: 'Attendance marked successfully!' });
            checkAttendance();
        } catch (error: any) {
            setScanMessage({ type: 'error', text: error.message || 'Failed to process code.' });
        } finally {
            setIsLoading(false);
            setIsScanning(false);
            setShowCodeInput(false);
            setManualCode('');
        }
    }, [user, checkAttendance]);

    const onScanSuccess = useCallback((decodedText: string) => {
        setIsScanning(false);
        // The decoded text is now the code itself, no JSON parsing needed.
        if (decodedText && decodedText.trim().length > 0) {
            processAttendanceCode(decodedText.trim());
        } else {
            setScanMessage({ type: 'error', text: 'Invalid QR code. Please try again.' });
        }
    }, [processAttendanceCode]);
    
    useEffect(() => {
        if (isScanning) {
            const scanner = new Html5QrcodeScanner(QR_READER_ID, { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scanner.render(onScanSuccess, () => {}); // Empty failure callback
            return () => {
                scanner.clear().catch(err => console.error("Failed to clear scanner.", err));
            };
        }
    }, [isScanning, onScanSuccess]);
    
    const handleManualCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            processAttendanceCode(manualCode.trim());
        }
    };
    
    const handleStartScan = () => {
        setScanMessage({ type: '', text: '' });
        setShowCodeInput(false);
        setIsScanning(true);
    };

    const handleShowCodeInput = () => {
        setScanMessage({ type: '', text: '' });
        setIsScanning(false);
        setShowCodeInput(true);
    }
    
    const handleCancel = () => {
        setIsScanning(false);
        setShowCodeInput(false);
        setScanMessage({ type: '', text: '' });
    }

    if (!user) return null;

    return (
        <Layout title="Student Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="My Information">
                    <div className="space-y-3">
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Register Number:</strong> {user.registerNumber || 'N/A'}</p>
                        <p><strong>Status:</strong> <span className="capitalize font-semibold text-green-600">{user.status}</span></p>
                    </div>
                </Card>
                <Card title="Daily Attendance">
                   <div className="flex flex-col items-center text-center space-y-4">
                       {attendanceStatus ? (
                            <div className="p-3 rounded-md bg-green-100 text-green-800 font-semibold">
                                You are marked PRESENT for today.
                            </div>
                       ) : isScanning ? (
                            <div>
                                <div id={QR_READER_ID} style={{ width: '100%', minHeight: '250px' }}></div>
                                <Button onClick={handleCancel} variant="secondary" className="mt-4">
                                    Cancel Scan
                                </Button>
                            </div>
                       ) : showCodeInput ? (
                            <form onSubmit={handleManualCodeSubmit} className="w-full space-y-3">
                                <Input 
                                    label="Enter Attendance Code"
                                    id="attendance-code"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. A1B2C3"
                                    maxLength={6}
                                    required
                                    className="text-center tracking-widest font-mono"
                                />
                                <div className="flex gap-2">
                                    <Button type="button" onClick={handleCancel} variant="secondary" className="flex-1">Cancel</Button>
                                    <Button type="submit" disabled={isLoading} className="flex-1">
                                        {isLoading ? 'Submitting...' : 'Submit Code'}
                                    </Button>
                                </div>
                            </form>
                       ) : (
                           <div className="space-y-3">
                                <p className="text-gray-600">How would you like to mark your attendance?</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                   <Button onClick={handleStartScan}>
                                       Scan QR Code
                                   </Button>
                                   <Button onClick={handleShowCodeInput} variant="secondary">
                                       Enter Code Manually
                                   </Button>
                                </div>
                           </div>
                       )}

                       {scanMessage.text && !isScanning && !showCodeInput && (
                           <p className={`text-sm text-center mt-3 ${scanMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                               {scanMessage.text}
                           </p>
                       )}
                   </div>
                </Card>
            </div>
        </Layout>
    );
};

export default StudentDashboard;