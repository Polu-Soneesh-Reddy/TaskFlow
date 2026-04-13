import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Briefcase,
} from 'lucide-react';
import { apiFetch } from '../api/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';

interface LayoutProps {
  role: 'manager' | 'employee';
}

export default function Layout({ role }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [headerName, setHeaderName] = useState<string | null>(null);
  const [headerSubtitle, setHeaderSubtitle] = useState<string | null>(null);
  const [headerAvatar, setHeaderAvatar] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await apiFetch<{
          name: string;
          role: string;
          avatar: string;
        }>('/api/me');
        if (!mounted) return;
        setHeaderName(me.name);
        setHeaderSubtitle(role === 'manager' ? 'Manager' : me.role);
        setHeaderAvatar(me.avatar || '—');
      } catch {
        if (!mounted) return;
        setHeaderName(null);
        setHeaderSubtitle(null);
        setHeaderAvatar(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [role]);

  const managerNavItems = [
    { path: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/manager/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/manager/employees', label: 'Employees', icon: Users },
    { path: '/manager/leave-requests', label: 'Leave Requests', icon: Calendar },
    { path: '/manager/reports', label: 'Reports', icon: BarChart3 },
    { path: '/manager/settings', label: 'Settings', icon: Settings },
  ];

  const employeeNavItems = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
    { path: '/employee/leave', label: 'Leave', icon: Calendar },
    { path: '/employee/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = role === 'manager' ? managerNavItems : employeeNavItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <Briefcase className="w-7 h-7" />
            <span className="text-xl">TaskFlow</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-[#2563EB] text-white">
                      {headerAvatar || (role === 'manager' ? 'AM' : '…')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm text-[#1E293B]">
                      {headerName || (role === 'manager' ? 'Alex Morgan' : 'Loading…')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {headerSubtitle || (role === 'manager' ? 'Manager' : '…')}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
