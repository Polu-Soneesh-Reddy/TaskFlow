import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, Users, CheckSquare, Calendar } from 'lucide-react';
import { apiFetch } from '../api/client';
import type { Employee, LeaveRequest, Task } from '../data/mockData';

type EmployeeApi = Omit<Employee, 'tasksCompleted' | 'tasksInProgress'>;

type TasksRes = { tasks: Task[] };
type EmployeesRes = { employees: EmployeeApi[] };
type LeaveRes = { leaveRequests: LeaveRequest[] };

export default function Reports() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeApi[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError('');
        const [tRes, eRes, lRes] = await Promise.all([
          apiFetch<TasksRes>('/api/tasks'),
          apiFetch<EmployeesRes>('/api/employees'),
          apiFetch<LeaveRes>('/api/leave-requests'),
        ]);
        if (!mounted) return;
        setTasks(tRes.tasks);
        setEmployees(eRes.employees);
        setLeaveRequests(lRes.leaveRequests);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;

  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#10B981' },
    { name: 'In Progress', value: inProgressTasks, color: '#F59E0B' },
    { name: 'Pending', value: pendingTasks, color: '#EF4444' },
  ];

  const tasksPerEmployee = useMemo(() => {
    return employees.map((emp) => {
      const mine = tasks.filter((t) => t.assignedToId === emp.id);
      const completed = mine.filter((t) => t.status === 'Completed').length;
      const inProgress = mine.filter((t) => t.status === 'In Progress').length;
      return {
        name: emp.name.split(' ')[0],
        completed,
        inProgress,
        total: mine.length,
      };
    });
  }, [employees, tasks]);

  const leaveUsageData = useMemo(() => {
    const usedByEmp = new Map<string, number>();
    for (const r of leaveRequests) {
      if (r.status !== 'Approved') continue;
      const days =
        Math.max(
          1,
          Math.round(
            (new Date(r.toDate).getTime() - new Date(r.fromDate).getTime()) / (86400000)
          ) + 1
        );
      usedByEmp.set(r.employeeId, (usedByEmp.get(r.employeeId) || 0) + days);
    }
    return employees.map((emp) => {
      const used = usedByEmp.get(emp.id) || 0;
      const remaining = Math.max(0, emp.leaveBalance);
      return {
        name: emp.name.split(' ')[0],
        used,
        remaining,
      };
    });
  }, [employees, leaveRequests]);

  const departmentData = useMemo(() => {
    const byDept = new Map<string, { total: number; completed: number }>();
    for (const emp of employees) {
      if (!byDept.has(emp.department)) {
        byDept.set(emp.department, { total: 0, completed: 0 });
      }
    }
    for (const t of tasks) {
      const emp = employees.find((e) => e.id === t.assignedToId);
      if (!emp) continue;
      const agg = byDept.get(emp.department);
      if (!agg) continue;
      agg.total += 1;
      if (t.status === 'Completed') agg.completed += 1;
    }
    return [...byDept.entries()].map(([department, { total, completed }]) => ({
      department,
      tasks: total,
      efficiency: total ? Math.round((completed / total) * 100) : 0,
    }));
  }, [employees, tasks]);

  const monthlyTrendData = useMemo(() => {
    const buckets = new Map<string, { completed: number; assigned: number }>();
    for (const t of tasks) {
      const key = t.deadline.slice(0, 7);
      if (!buckets.has(key)) buckets.set(key, { completed: 0, assigned: 0 });
      const b = buckets.get(key)!;
      b.assigned += 1;
      if (t.status === 'Completed') b.completed += 1;
    }
    const rows = [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({
        month,
        completed: v.completed,
        assigned: v.assigned,
      }));
    return rows.length ? rows : [{ month: 'Current', completed: completedTasks, assigned: tasks.length }];
  }, [tasks, completedTasks]);

  const completionPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const avgPerEmp = employees.length ? (tasks.length / employees.length).toFixed(1) : '0';
  const deptCount = useMemo(() => new Set(employees.map((e) => e.department)).size, [employees]);

  if (isLoading) {
    return <div className="p-8 text-gray-600">Loading reports…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#1E293B] mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Comprehensive insights into team performance and productivity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-[#2563EB]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Tasks</CardTitle>
            <CheckSquare className="w-5 h-5 text-[#2563EB]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{tasks.length}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Live data from API
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Completion Rate</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{completionPct}%</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Completed / total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Active Employees</CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{employees.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across {deptCount} department{deptCount === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Avg Tasks/Employee</CardTitle>
            <CheckSquare className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{avgPerEmp}</div>
            <p className="text-xs text-gray-500 mt-1">Currently assigned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {taskStatusData.map((item) => (
                <div key={item.name} className="text-center">
                  <div className="text-2xl text-[#1E293B]">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task completion by month (deadline)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Completed"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="assigned"
                  stroke="#2563EB"
                  strokeWidth={2}
                  name="Assigned"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks Per Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksPerEmployee}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[8, 8, 0, 0]} />
                <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave usage (approved days vs balance)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leaveUsageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="name" type="category" stroke="#6B7280" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="used" fill="#EF4444" name="Used (days)" stackId="a" radius={[0, 8, 8, 0]} />
                <Bar dataKey="remaining" fill="#10B981" name="Balance" stackId="a" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Total Tasks</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Efficiency Rate</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Performance</th>
                </tr>
              </thead>
              <tbody>
                {departmentData.map((dept) => (
                  <tr
                    key={dept.department}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-[#1E293B]">{dept.department}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{dept.tasks}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{dept.efficiency}%</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                          <div
                            className="bg-[#2563EB] h-2 rounded-full"
                            style={{ width: `${dept.efficiency}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-12 text-right">{dept.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
