import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import ProtectedLayout from "./components/ProtectedLayout";
import ManagerDashboard from "./pages/ManagerDashboard";
import TaskManagement from "./pages/TaskManagement";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import LeaveManagement from "./pages/LeaveManagement";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Employees from "./pages/Employees";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/setup",
    element: <Setup />,
  },
  {
    path: "/manager",
    element: <ProtectedLayout expectedRole="manager" />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: "dashboard",
        element: <ManagerDashboard />,
      },
      {
        path: "tasks",
        element: <TaskManagement />,
      },
      {
        path: "employees",
        element: <Employees />,
      },
      {
        path: "leave-requests",
        element: <LeaveManagement />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "/employee",
    element: <ProtectedLayout expectedRole="employee" />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: "dashboard",
        element: <EmployeeDashboard />,
      },
      {
        path: "tasks",
        element: <TaskManagement />,
      },
      {
        path: "leave",
        element: <LeaveManagement />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);
