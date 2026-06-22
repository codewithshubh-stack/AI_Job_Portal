import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../config/axios';
import { 
  Briefcase, 
  UploadCloud, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  LayoutDashboard,
  Building,
  FileSpreadsheet,
  Sun,
  Moon,
  Bell,
  Sparkles,
  Award,
  BookOpen
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, selectTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/accounts/notifications/');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.patch(`/accounts/notifications/${id}/read/`);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.post('/accounts/notifications/');
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = user.role === 'recruiter' 
    ? [
        { label: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
        { label: 'Post Job', path: '/jobs/create', icon: Briefcase },
        { label: 'Applicants', path: '/applications', icon: FileSpreadsheet },
        { label: 'Company', path: '/company', icon: Building },
      ]
    : [
        { label: 'Dashboard', path: '/candidate/dashboard', icon: LayoutDashboard },
        { label: 'Find Jobs', path: '/jobs', icon: Briefcase },
        { label: 'My Resumes', path: '/resumes', icon: UploadCloud },
        { label: 'Applications', path: '/applications', icon: FileSpreadsheet },
        { label: 'Interview Prep', path: '/interview-prep', icon: Award },
        { label: 'Career Advisor', path: '/career-advisor', icon: BookOpen },
      ];

  return (
    <nav class="sticky top-4 z-50 mx-auto max-w-7xl px-4 w-full">
      <div class="glass rounded-2xl px-6 py-4 flex items-center justify-between border border-slate-800/80 shadow-2xl">
        {/* Brand Logo */}
        <Link to="/" class="flex items-center gap-2 group">
          <div class="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg group-hover:scale-105 transition-all duration-300">
            <Briefcase size={20} />
          </div>
          <span class="font-display font-bold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">
            Talent<span class="text-indigo-400">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div class="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                class={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  active 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Profile & Theme Action Menu */}
        <div class="hidden md:flex items-center gap-2">
          {/* Notifications Tray */}
          <div class="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsDropdownOpen(false);
              }}
              class="p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center relative"
              title="Notifications"
            >
              <Bell size={15} />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div class="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                <div class="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div class="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                    <h4 class="text-xs font-bold text-white">Notifications</h4>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        class="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div class="max-h-60 overflow-y-auto divide-y divide-slate-800/50 animate-in fade-in duration-200">
                    {notifications.length === 0 ? (
                      <div class="px-4 py-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            handleMarkNotificationRead(notif.id);
                            setIsNotifOpen(false);
                          }}
                          class={`px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-slate-805/40 hover:bg-slate-800 ${
                            !notif.is_read ? 'bg-indigo-500/[0.03]' : ''
                          }`}
                        >
                          <div class="flex justify-between items-start gap-1">
                            <p class={`text-xs font-semibold ${notif.is_read ? 'text-slate-400' : 'text-white'}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 shrink-0"></span>
                            )}
                          </div>
                          <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p class="text-[9px] text-slate-500 mt-1 font-mono">
                            {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div class="border-t border-slate-800 pt-1.5 px-4 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      class="text-[11px] text-slate-400 hover:text-white font-semibold inline-block"
                    >
                      View all history
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Selector Dropdown */}
          <div class="relative group/theme">
            <button
              onClick={toggleTheme}
              class="p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Change Theme"
            >
              {theme === 'dark' ? <Moon size={15} /> : theme === 'light' ? <Sun size={15} /> : <Sparkles size={15} />}
            </button>
            <div class="absolute right-0 mt-2 w-32 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-20 hidden group-hover/theme:block animate-in fade-in duration-200">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => selectTheme(t)}
                  class={`w-full text-left px-3 py-1.5 text-xs capitalize transition-colors flex items-center gap-2 hover:bg-slate-800 ${
                    theme === t ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {t === 'light' ? <Sun size={12} /> : t === 'dark' ? <Moon size={12} /> : <Sparkles size={12} />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div class="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-200 transition-all cursor-pointer"
            >
              {user.candidate_profile?.profile_picture ? (
                <img 
                  src={user.candidate_profile.profile_picture} 
                  alt="Avatar" 
                  class="w-6 h-6 rounded-full object-cover border border-indigo-500/30"
                />
              ) : (
                <div class="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  {user.first_name[0]}
                </div>
              )}
              <span class="text-sm font-medium">{user.first_name}</span>
              <ChevronDown size={14} class={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div class="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                <div class="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div class="px-4 py-2 border-b border-slate-800">
                    <p class="text-xs text-slate-400">Signed in as</p>
                    <p class="text-sm font-semibold truncate text-white">{user.email}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    class="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <User size={15} />
                    My Profile
                  </Link>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    class="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          class="md:hidden p-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div class="md:hidden mt-2 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                class={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
          
          <div class="h-px bg-slate-800 my-2"></div>
          
          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <Bell size={18} />
            Notifications ({notifications.filter(n => !n.is_read).length})
          </Link>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <User size={18} />
            My Profile
          </Link>

          <div class="flex items-center justify-between px-4 py-3 text-slate-400">
            <span class="text-xs font-semibold uppercase tracking-wider">Appearance</span>
            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => selectTheme(t)}
                  class={`px-2.5 py-1 rounded-lg text-xs capitalize font-medium transition-all cursor-pointer ${
                    theme === t ? 'bg-indigo-600 text-white' : 'hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
