import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Plus } from 'lucide-react';
import { apiFetch } from '../api/client';
import type { Employee } from '../data/mockData';

type EmployeeApi = Omit<Employee, 'tasksCompleted' | 'tasksInProgress'>;
type EmployeesRes = { employees: EmployeeApi[] };

export default function Employees() {
  const [employees, setEmployees] = useState<EmployeeApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [leaveBalance, setLeaveBalance] = useState('20');

  const load = useCallback(async () => {
    const res = await apiFetch<EmployeesRes>('/api/employees');
    setEmployees(res.employees);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError('');
        await load();
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load employees');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setDepartment('');
    setJobRole('');
    setLeaveBalance('20');
    setFormError('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    (async () => {
      try {
        const bal = Number(leaveBalance);
        await apiFetch<{ employee: EmployeeApi }>('/api/employees', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            department,
            role: jobRole,
            leaveBalance: Number.isFinite(bal) ? bal : 0,
          }),
        });
        await load();
        setDialogOpen(false);
        resetForm();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Could not create employee');
      } finally {
        setSaving(false);
      }
    })();
  };

  if (isLoading) {
    return <div className="p-8 text-gray-600">Loading employees…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl text-[#1E293B] mb-2">Employees</h1>
          <p className="text-gray-600">Team directory and leave balances (stored in MongoDB)</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#2563EB] hover:bg-[#1E40AF]">
              <Plus className="w-4 h-4 mr-2" />
              Add employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add employee</DialogTitle>
              <DialogDescription>
                Creates a profile and login. They sign in with Employee selected and this email/password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="emp-name">Name</Label>
                <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-email">Email</Label>
                <Input id="emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-password">Password (min 6 characters)</Label>
                <Input
                  id="emp-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-dept">Department</Label>
                <Input id="emp-dept" value={department} onChange={(e) => setDepartment(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-role">Job title / role</Label>
                <Input id="emp-role" value={jobRole} onChange={(e) => setJobRole(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-leave">Starting leave balance (days)</Label>
                <Input
                  id="emp-leave"
                  type="number"
                  min={0}
                  value={leaveBalance}
                  onChange={(e) => setLeaveBalance(e.target.value)}
                />
              </div>
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2563EB]" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All employees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Leave balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                    No employees yet. Add someone to get started.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs">
                          {emp.avatar || emp.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-[#1E293B]">{emp.name}</TableCell>
                    <TableCell className="text-gray-600">{emp.email}</TableCell>
                    <TableCell className="text-gray-600">{emp.department}</TableCell>
                    <TableCell className="text-gray-600">{emp.role}</TableCell>
                    <TableCell className="text-right text-[#1E293B]">{emp.leaveBalance} days</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
