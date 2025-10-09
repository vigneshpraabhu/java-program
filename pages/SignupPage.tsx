
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as db from '../services/db';
import { Role } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';

const SignupPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [registerNumber, setRegisterNumber] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await db.addUser({
                username,
                password,
                registerNumber,
                role: Role.STUDENT,
                status: 'pending',
            });
            setSuccess('Registration successful! Please wait for teacher approval before logging in.');
            setUsername('');
            setPassword('');
            setRegisterNumber('');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'An error occurred during signup.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    Student Registration
                </h2>
                <p className="text-center text-gray-500 mb-6">
                    Create your account to get started.
                </p>

                <form onSubmit={handleSignup} className="space-y-4">
                    <Input
                        label="Username"
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Register Number"
                        id="registerNumber"
                        type="text"
                        value={registerNumber}
                        onChange={(e) => setRegisterNumber(e.target.value)}
                        required
                    />

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Registering...' : 'Sign Up'}
                    </Button>
                </form>
                 <p className="text-center text-sm text-gray-600 mt-4">
                    Already have an account?{' '}
                    <button onClick={() => navigate('/login')} className="font-medium text-teal-600 hover:text-teal-500">
                        Login
                    </button>
                </p>
            </Card>
        </div>
    );
};

export default SignupPage;