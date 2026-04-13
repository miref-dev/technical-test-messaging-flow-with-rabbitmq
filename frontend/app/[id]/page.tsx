'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Message } from '@/lib/types';

const API_BASE_URL = 'http://localhost:3001/api';

export default function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/messages/${id}`);
        if (res.ok) {
          const data = await res.json();
          setMessage(data);

          if (data.status === 'delivered') {
            markAsRead();
          }
        }
      } catch (err) {
        console.error('Failed to fetch message:', err);
      } finally {
        setLoading(false);
      }
    };

    const markAsRead = async () => {
      try {
        await fetch(`${API_BASE_URL}/messages/${id}/read`, { method: 'PATCH' });
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    };

    fetchMessage();

    const interval = setInterval(fetchMessage, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleResend = async () => {
    try {
      await fetch(`${API_BASE_URL}/messages/${id}/resend`, { method: 'POST' });
    } catch (err) {
      console.error('Resend failed:', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!message) return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Message Not Found</h1>
      <Link href="/" className="text-indigo-400 hover:text-indigo-300">Return to Dashboard</Link>
    </div>
  );

  const timeline = [
    { label: 'Queued', time: message.createdAt, active: true },
    { label: 'Sent', time: message.sentAt, active: !!message.sentAt },
    { label: 'Delivered', time: message.deliveredAt, active: !!message.deliveredAt },
    { label: 'Read', time: message.readAt, active: !!message.readAt },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
          Back to Dashboard
        </button>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-2 h-2 rounded-full ${message.status === 'read' ? 'bg-cyan-400' :
                  message.status === 'delivered' ? 'bg-emerald-400' :
                    message.status === 'failed' ? 'bg-rose-400' : 'bg-indigo-400'
                  }`} />
                <h1 className="text-2xl font-bold uppercase tracking-tight">{message.status}</h1>
              </div>
              <p className="text-slate-500 text-sm font-mono">ID: {message.id}</p>
            </div>

            {(message.status === 'failed' || (message.status === 'queued' && message.attempts > 3)) && (
              <button
                onClick={handleResend}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-6 py-2 rounded-full border border-rose-500/30 transition-all font-bold text-sm"
              >
                RETRY DELIVERY
              </button>
            )}
          </div>

          <div className="p-8 space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Sender</label>
                <p className="text-lg font-semibold">{message.sender}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Receiver</label>
                <p className="text-lg font-semibold">{message.receiver}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Message Content</label>
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 italic text-slate-300 leading-relaxed shadow-inner">
                "{message.message}"
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Delivery Lifecycle</label>
              <div className="relative pt-4 overflow-hidden">
                <div className="absolute top-[2.4rem] left-0 w-full h-0.5 bg-slate-700/50" />
                <div className="flex justify-between relative">
                  {timeline.map((step, i) => (
                    <div key={step.label} className="flex flex-col items-center gap-3 relative z-10 w-24">
                      <div className={`w-4 h-4 rounded-full border-2 ${step.active ? 'bg-indigo-500 border-indigo-400' : 'bg-[#0f172a] border-slate-700'
                        }`} />
                      <div className="text-center">
                        <p className={`text-xs font-bold uppercase ${step.active ? 'text-slate-200' : 'text-slate-600'}`}>
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">
                            {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(message.failReason || (message.attempts > 0)) && (
              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Attempts</label>
                  <p className="text-sm font-mono">{message.attempts}</p>
                </div>
                {message.failReason && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-rose-500/60">Failure Reason</label>
                    <p className="text-sm text-rose-400 font-medium">{message.failReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs uppercase tracking-[0.2em] animate-pulse">
          Monitoring live status updates
        </p>
      </div>
    </div>
  );
}