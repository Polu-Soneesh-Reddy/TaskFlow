import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { apiFetch } from '../api/client';

type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: string; // 'manager' or employee role title
  department: string;
  avatar: string;
  leaveBalance: number;
};

export default function Settings() {
  const location = useLocation();
  const isManager = location.pathname.startsWith('/manager');

  const [me, setMe] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError('');
        const result = await apiFetch<MeResponse>('/api/me');
        if (!mounted) return;
        setMe(result);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="p-8 text-gray-600">Loading settings...</div>;
  }

  if (error || !me) {
    return <div className="p-8 text-red-600">{error || 'Failed to load settings'}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#1E293B] mb-2">Settings</h1>
        <p className="text-gray-600">Account details and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="text-base text-[#1E293B]">{me.name}</div>
          </div>

          {!isManager ? (
            <div>
              <div className="text-sm text-gray-500">Department</div>
              <div className="text-base text-[#1E293B]">{me.department}</div>
            </div>
          ) : null}

          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-base text-[#1E293B]">{me.email || '—'}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">{isManager ? 'Role' : 'Employee role'}</div>
            <div className="text-base text-[#1E293B]">{me.role}</div>
          </div>

          {!isManager ? (
            <div>
              <div className="text-sm text-gray-500">Leave Balance</div>
              <div className="text-base text-[#1E293B]">{me.leaveBalance} days</div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

