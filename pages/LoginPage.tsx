
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import UserIcon from '../components/icons/UserIcon';
import LockIcon from '../components/icons/LockIcon';

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Role>(Role.STUDENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password, activeTab);
      if (success) {
        switch (activeTab) {
          case Role.ADMIN:
            navigate('/admin');
            break;
          case Role.TEACHER:
            navigate('/teacher');
            break;
          case Role.STUDENT:
            navigate('/student');
            break;
        }
      } else {
        setError('Invalid username or password, or account not approved.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs: Role[] = [Role.STUDENT, Role.TEACHER, Role.ADMIN];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(''); setUsername(''); setPassword(''); }}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-colors duration-200 ${
                  activeTab === tab
                    ? 'border-b-2 border-teal-500 text-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Login
        </h2>
        <p className="text-center text-gray-500 mb-6">Welcome back! Please enter your details.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="pl-10"
            />
          </div>
          <div className="relative">
            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        {activeTab === Role.STUDENT && (
           <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} className="font-medium text-teal-600 hover:text-teal-500">
                Sign up
            </button>
        </p>
        )}
        {activeTab === Role.TEACHER && (
           <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup-teacher')} className="font-medium text-teal-600 hover:text-teal-500">
                Sign up
            </button>
        </p>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;