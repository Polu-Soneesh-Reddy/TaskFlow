import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Briefcase } from 'lucide-react';
import { publicFetch } from '../api/client';

export default function Setup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await publicFetch<{ needsFirstManager: boolean }>('/api/auth/status');
        if (!mounted) return;
        if (!s.needsFirstManager) navigate('/', { replace: true });
      } catch {
        if (mounted) navigate('/', { replace: true });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    (async () => {
      try {
        await publicFetch<{ message: string }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        navigate('/', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create account');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-[#2563EB] mb-4">
            <Briefcase className="w-8 h-8" />
            <span className="text-2xl">TaskFlow</span>
          </div>
          <h1 className="text-3xl text-[#1E293B] mb-2">Create manager account</h1>
          <p className="text-gray-600">
            This runs once. After that, sign in and add employees from the Employees page. Data is stored in
            MongoDB.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password (min 6 characters)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full h-11 bg-[#2563EB] hover:bg-[#1E40AF]" disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create account'}
          </Button>
          {error ? <p className="text-sm text-red-600 text-center">{error}</p> : null}
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/" className="text-[#2563EB] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
