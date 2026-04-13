import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Plus, Check, X, Calendar } from 'lucide-react';
import type { LeaveRequest } from '../data/mockData';
import { apiFetch } from '../api/client';

export default function LeaveManagement() {
  const location = useLocation();
  const isManager = location.pathname.startsWith('/manager');

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError('');

        const result = await apiFetch<{ leaveRequests: LeaveRequest[] }>(
          '/api/leave-requests'
        );
        if (!mounted) return;
        setLeaveRequests(result.leaveRequests);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load leave requests');
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isManager]);

  const handleApprove = async (id: string) => {
    const result = await apiFetch<{ leaveRequest: LeaveRequest }>(
      `/api/leave-requests/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Approved' }),
      }
    );

    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === id ? result.leaveRequest : req))
    );
  };

  const handleReject = async (id: string) => {
    const result = await apiFetch<{ leaveRequest: LeaveRequest }>(
      `/api/leave-requests/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Rejected' }),
      }
    );

    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === id ? result.leaveRequest : req))
    );
  };

  const handleApplyLeave = async () => {
    const result = await apiFetch<{ leaveRequest: LeaveRequest }>(
      '/api/leave-requests',
      {
        method: 'POST',
        body: JSON.stringify({
          fromDate: newLeave.fromDate,
          toDate: newLeave.toDate,
          reason: newLeave.reason,
        }),
      }
    );

    setLeaveRequests((prev) => [result.leaveRequest, ...prev]);
    setIsDialogOpen(false);
    setNewLeave({ fromDate: '', toDate: '', reason: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'Rejected': return 'bg-red-100 text-red-700 hover:bg-red-100';
      case 'Pending': return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingCount = leaveRequests.filter(r => r.status === 'Pending').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'Rejected').length;

  if (isLoading) {
    return <div className="p-8 text-gray-600">Loading leave requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#1E293B] mb-2">Leave Management</h1>
          <p className="text-gray-600">Manage employee leave requests and track attendance</p>
        </div>
        {!isManager ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2563EB] hover:bg-[#1E40AF]">
                <Plus className="w-4 h-4 mr-2" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for manager approval.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-date">From Date</Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={newLeave.fromDate}
                      onChange={(e) => setNewLeave({ ...newLeave, fromDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to-date">To Date</Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={newLeave.toDate}
                      onChange={(e) => setNewLeave({ ...newLeave, toDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for leave"
                    value={newLeave.reason}
                    onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleApplyLeave} className="bg-[#2563EB] hover:bg-[#1E40AF]">
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Pending Requests</CardTitle>
            <Calendar className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{pendingCount}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Approved</CardTitle>
            <Check className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{approvedCount}</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Rejected</CardTitle>
            <X className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{rejectedCount}</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">From Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">To Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Reason</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Applied On</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="text-sm text-[#1E293B]">{request.employeeName}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {new Date(request.fromDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {new Date(request.toDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 max-w-xs truncate">
                      {request.reason}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {new Date(request.appliedOn).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      {isManager && request.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            className="bg-green-600 hover:bg-green-700 h-8 px-3"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            className="border-red-600 text-red-600 hover:bg-red-50 h-8 px-3"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No actions</span>
                      )}
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
