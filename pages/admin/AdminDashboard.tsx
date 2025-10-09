import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import * as db from '../../services/db';
import { User, Role } from '../../types';

const AdminDashboard: React.FC = () => {
    const [pendingTeachers, setPendingTeachers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [teachers, users] = await Promise.all([
                db.getPendingUsers(Role.TEACHER),
                db.getAllApprovedUsers()
            ]);
            setPendingTeachers(teachers);
            setAllUsers(users);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (teacherId: string) => {
        try {
            await db.approveUser(teacherId);
            fetchData(); // Refresh all data
        } catch (err) {
            alert('Failed to approve teacher.');
        }
    };

    const handleDeny = async (teacherId: string) => {
        try {
            await db.deleteUser(teacherId);
            fetchData(); // Refresh all data
        } catch (err) {
            alert('Failed to deny teacher.');
        }
    };
    
    const handleRemoveUser = async (userId: string) => {
        if (window.confirm('Are you sure you want to permanently remove this user? This action cannot be undone.')) {
            try {
                await db.deleteUser(userId);
                fetchData(); // Refresh all data
            } catch (err) {
                alert('Failed to remove user.');
            }
        }
    };


    return (
        <Layout title="Admin Dashboard">
            <div className="space-y-8">
                <Card title="Pending Teacher Approvals">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : pendingTeachers.length === 0 ? (
                        <p>No pending teacher registrations.</p>
                    ) : (
                        <ul className="space-y-4">
                            {pendingTeachers.map((teacher) => (
                                <li key={teacher.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-md gap-3">
                                    <div>
                                        <p className="font-semibold">{teacher.username}</p>
                                        <p className="text-sm text-gray-500">Teacher ID: {teacher.teacherId}</p>
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0">
                                        <Button onClick={() => handleApprove(teacher.id)} variant="success" className="text-xs px-3 py-1">
                                            Approve
                                        </Button>
                                        <Button onClick={() => handleDeny(teacher.id)} variant="danger" className="text-xs px-3 py-1">
                                            Deny
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="User Management">
                     {isLoading ? (
                        <p>Loading...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : allUsers.length === 0 ? (
                        <p>No approved teachers or students found.</p>
                    ) : (
                       <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role === Role.TEACHER ? user.teacherId : user.registerNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button onClick={() => handleRemoveUser(user.id)} variant="danger" className="text-xs px-3 py-1">
                                                Remove
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                       </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
};

export default AdminDashboard;