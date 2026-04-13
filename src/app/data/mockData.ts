/** Domain types shared by the UI (data comes from the API / MongoDB). */

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  assignedToId: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  tasksCompleted: number;
  tasksInProgress: number;
  leaveBalance: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}
