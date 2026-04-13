'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  sender: string;
  receiver: string;
  message: string;
  attempts: number;
  status: 'queued' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

export default function DashboardPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    sender: '',
    receiver: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/dashboard/stream`);

    eventSource.addEventListener('init', (e: any) => {
      const { messages, stats } = JSON.parse(e.data).data;
      setMessages(messages);
      setStats(stats);
    });

    eventSource.addEventListener('message:created', (e: any) => {
      const msg = JSON.parse(e.data).data;
      setMessages(prev => [msg, ...prev]);
    });

    eventSource.addEventListener('message:status', (e: any) => {
      const msg = JSON.parse(e.data).data;
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    });

    eventSource.addEventListener('stats:update', (e: any) => {
      const s = JSON.parse(e.data).data;
      setStats(s);
    });

    eventSource.onerror = (e) => {
      console.error('SSE Error:', e);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sender || !formData.receiver || !formData.message) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setFormData({ ...formData, message: '' });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/messages/${id}/resend`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to resend message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 space-y-12">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Messaging System
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 shadow-xl">
            <span className="text-sm font-medium text-slate-400">Sent:</span>
            <span className="ml-2 text-indigo-400 font-bold">{stats?.sent || 0}</span>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 shadow-xl">
            <span className="text-sm font-medium text-slate-400">Delivered:</span>
            <span className="ml-2 text-emerald-400 font-bold">{stats?.delivered || 0}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Send Message Form */}
        <div className="lg:col-span-4 bg-slate-800/40 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl sticky top-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Send New Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Sender</label>
              <input
                type="text"
                placeholder="Your username"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                value={formData.sender}
                onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Receiver</label>
              <input
                type="text"
                placeholder="Recipient username"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                value={formData.receiver}
                onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Message</label>
              <textarea
                placeholder="Write your message here..."
                rows={4}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 resize-none"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] drop-shadow-[0_0_15px_rgba(79,70,229,0.3)] mt-2"
            >
              {isSending ? 'Queuing...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Message List */}
        <div className="lg:col-span-8 bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/30">
            <h2 className="text-xl font-semibold">Live Feed</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/30">
                {messages.length} Messages
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Participants</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Message</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {messages.map((msg) => (
                  <tr 
                    key={msg.id} 
                    onClick={() => router.push(`/${msg.id}`)}
                    className="hover:bg-white/2 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200">{msg.sender}</span>
                        <span className="text-xs text-slate-500">to {msg.receiver}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-slate-300 max-w-xs truncate group-hover:text-white transition-colors">
                        {msg.message}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${msg.status === 'read' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          msg.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            msg.status === 'processing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                              msg.status === 'sent' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                msg.status === 'queued' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                          {msg.status}
                        </span>
                        {(msg.status === 'failed' || msg.status === "queued") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResend(msg.id);
                            }}
                            className="text-[10px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30 transition-all uppercase font-bold cursor-pointer"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {messages.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-500 italic">No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
