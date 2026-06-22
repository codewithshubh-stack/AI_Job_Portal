import React, { useEffect, useState } from 'react';
import api from '../../../config/axios';
import { Bell, Check, Trash2, Calendar, Mail, FileText, Briefcase, Award } from 'lucide-react';

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/notifications/');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/accounts/notifications/${id}/read/`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/accounts/notifications/');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'job_applied':
      case 'application_submitted':
        return <Briefcase size={18} class="text-indigo-400" />;
      case 'status_updated':
        return <Award size={18} class="text-amber-400" />;
      case 'interview_scheduled':
        return <Calendar size={18} class="text-blue-400" />;
      case 'resume_uploaded':
        return <FileText size={18} class="text-fuchsia-400" />;
      default:
        return <Bell size={18} class="text-slate-400" />;
    }
  };

  return (
    <div class="max-w-3xl mx-auto py-6 space-y-6 animate-in fade-in duration-350">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="font-display font-bold text-2xl text-white">Notifications</h1>
          <p class="text-xs text-slate-400 mt-1">Keep track of your job portal activity and application milestones.</p>
        </div>
        {notifications.filter(n => !n.is_read).length > 0 && (
          <button
            onClick={handleMarkAllRead}
            class="px-3.5 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div class="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} class="h-20 w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div class="glass border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <div class="p-3.5 bg-slate-950/60 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-slate-800">
            <Bell size={20} />
          </div>
          <p class="text-sm font-medium">All caught up!</p>
          <p class="text-xs text-slate-600">You don't have any notifications at the moment.</p>
        </div>
      ) : (
        <div class="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              class={`glass border rounded-2xl p-4 flex items-start gap-4 transition-all ${
                !notif.is_read ? 'border-slate-700 bg-indigo-500/[0.02]' : 'border-slate-850 bg-slate-900/20'
              }`}
            >
              <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                {getIcon(notif.notification_type)}
              </div>
              <div class="flex-grow min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <h4 class={`text-sm font-semibold truncate ${!notif.is_read ? 'text-white' : 'text-slate-400'}`}>
                    {notif.title}
                  </h4>
                  <span class="text-[10px] text-slate-500 font-mono self-start mt-0.5 shrink-0">
                    {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    class="mt-2 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={12} />
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
