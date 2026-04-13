import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Briefcase } from 'lucide-react';
import { apiFetch, publicFetch } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'manager' | 'employee'>('manager');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsFirstManager, setNeedsFirstManager] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await publicFetch<{ needsFirstManager: boolean }>('/api/auth/status');
        if (mounted) setNeedsFirstManager(s.needsFirstManager);
      } catch {
        if (mounted) setNeedsFirstManager(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    (async () => {
      try {
        // Do not send an old JWT on login; credentials must stand alone.
        localStorage.removeItem('token');

        const result = await publicFetch<{ token: string }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
            role,
          }),
        });

        if (!result?.token) {
          throw new Error('Invalid response from server');
        }

        localStorage.setItem('token', result.token);

        await apiFetch('/api/me');

        navigate(role === 'manager' ? '/manager/dashboard' : '/employee/dashboard');
      } catch (err) {
        localStorage.removeItem('token');
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2563EB] to-[#1E40AF] items-center justify-center p-12">
        <div className="text-white max-w-md">
          <Briefcase className="w-20 h-20 mb-8" />
          <h1 className="text-5xl mb-6">TaskFlow</h1>
          <p className="text-xl text-blue-100">
            Streamline your team's productivity with our comprehensive task management and employee monitoring system.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
              <div>
                <div className="font-semibold">Task Management</div>
                <div className="text-sm text-blue-100">Assign and track tasks efficiently</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
              <div>
                <div className="font-semibold">Team Collaboration</div>
                <div className="text-sm text-blue-100">Work together seamlessly</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
              <div>
                <div className="font-semibold">Analytics & Reports</div>
                <div className="text-sm text-blue-100">Data-driven insights</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-[#2563EB] mb-4 lg:hidden">
              <Briefcase className="w-8 h-8" />
              <span className="text-2xl">TaskFlow</span>
            </div>
            <h2 className="text-3xl text-[#1E293B] mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selection */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  role === 'manager'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  role === 'employee'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Employee
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#2563EB]" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-[#2563EB] hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full h-11 bg-[#2563EB] hover:bg-[#1E40AF]">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {error ? <p className="mt-4 text-sm text-red-600 text-center">{error}</p> : null}

          {needsFirstManager === true ? (
            <p className="mt-6 text-center text-sm">
              <Link to="/setup" className="text-[#2563EB] font-medium hover:underline">
                First time? Create the manager account →
              </Link>
            </p>
          ) : needsFirstManager === false ? (
            <p className="mt-6 text-center text-sm text-gray-600">
              Use the password you chose at signup. Managers add employees (with their own passwords) from the
              Employees page.
            </p>
          ) : (
            <p className="mt-6 text-center text-sm text-gray-500">Checking setup status…</p>
          )}
        </div>
      </div>
    </div>
  );
}
