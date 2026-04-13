import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CheckSquare, Clock, Calendar, TrendingUp } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { useEffect, useState } from 'react';
import type { Employee, Task } from '../data/mockData';
import { apiFetch } from '../api/client';

export default function EmployeeDashboard() {
  const [me, setMe] = useState<Employee | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError('');

        const resultMe = await apiFetch<Employee>('/api/me');
        const resultTasks = await apiFetch<{ tasks: Task[] }>('/api/tasks');

        if (!mounted) return;
        setMe(resultMe);
        setMyTasks(resultTasks.tasks);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
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
    return <div className="p-8 text-gray-600">Loading...</div>;
  }

  if (error || !me) {
    return <div className="p-8 text-red-600">{error || 'Failed to load dashboard'}</div>;
  }

  const currentEmployee = me;
  const completedTasks = myTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = myTasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasks = myTasks.filter((t) => t.status === 'Pending').length;

  const completionRate = myTasks.length ? (completedTasks / myTasks.length) * 100 : 0;

  const upcomingDeadlines = myTasks
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 hover:bg-red-100';
      case 'Medium': return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
      case 'Low': return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'In Progress': return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
      case 'Pending': return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-[#1E293B] mb-2">My Dashboard</h1>
        <p className="text-gray-600">Track your tasks and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-[#2563EB]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">My Tasks</CardTitle>
            <CheckSquare className="w-5 h-5 text-[#2563EB]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{myTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total assigned</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Completed</CardTitle>
            <CheckSquare className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{completedTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Tasks finished</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">In Progress</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{inProgressTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Active tasks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Leave Balance</CardTitle>
            <Calendar className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{currentEmployee.leaveBalance}</div>
            <p className="text-xs text-gray-500 mt-1">Days remaining</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks.map((task) => (
                <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm text-[#1E293B] mb-1">{task.title}</h3>
                      <p className="text-xs text-gray-500">{task.description}</p>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.deadline).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Performance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="text-[#1E293B]">{completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Completed</span>
                  <span className="text-xl text-[#1E293B]">{completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-xl text-[#1E293B]">{inProgressTasks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((task) => {
                  const daysUntil = Math.ceil(
                    (new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={task.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        daysUntil <= 3 ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <Calendar className={`w-5 h-5 ${
                          daysUntil <= 3 ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-[#1E293B]">{task.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {daysUntil > 0 ? `${daysUntil} days left` : daysUntil === 0 ? 'Due today' : 'Overdue'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
