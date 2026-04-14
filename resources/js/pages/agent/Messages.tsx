import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import axios from 'axios';

interface Message {
    id: number;
    body: string;
    from_agent: boolean;
    created_at: string;
    sender_initial?: string;
}

export default function AgentMessages() {
    const [msgs, setMsgs] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/agent/dashboard' },
        { title: 'Messages', href: '/agent/messages' },
    ];

    useEffect(() => {
        axios.get('/api/agent/messages', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => setMsgs(res.data.messages || []))
            .catch(err => toast.error(err.response?.data?.message || 'Failed to load messages'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs, typing]);

    const send = async () => {
        if (!input.trim() || sending) return;
        const text = input.trim();
        setInput('');
        setSending(true);

        const tempId = Date.now();
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMsgs(p => [...p, { id: tempId, body: text, from_agent: true, created_at: now, sender_initial: 'A' }]);

        try {
            const res = await axios.post('/api/agent/messages', { body: text }, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = res.data;
            setMsgs(p => p.map(m => m.id === tempId ? (data.message || m) : m));

            if (data.auto_reply) {
                setTyping(true);
                setTimeout(() => {
                    setTyping(false);
                    setMsgs(p => [...p, data.auto_reply]);
                }, 1200);
            }
        } catch {
            setMsgs(p => p.filter(m => m.id !== tempId));
            toast.error('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (t: string) =>
        t.includes('T')
            ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : t;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages" />

            <div className="p-4 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                <div className="mb-4">
                    <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
                    <p className="text-muted-foreground">Chat directly with your approver or support team.</p>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                            L
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Lixnet Support</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-xs text-muted-foreground">Online · Replies within 24hrs (Mon–Fri)</span>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
                        {loading && (
                            <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">
                                Loading messages…
                            </div>
                        )}

                        {!loading && msgs.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <p className="text-4xl mb-3">💬</p>
                                <p className="font-semibold">No messages yet</p>
                                <p className="text-sm mt-1">Send a message to get in touch with support.</p>
                            </div>
                        )}

                        {msgs.map(m => {
                            const isAgent = m.from_agent;
                            const initial = m.sender_initial || (isAgent ? 'Y' : 'L');

                            return (
                                <div key={m.id} className={`flex gap-2.5 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                                        ${isAgent ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                        {initial}
                                    </div>
                                    <div className={`max-w-[68%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-3.5 py-2 text-sm rounded-xl leading-relaxed
                                            ${isAgent
                                                ? 'bg-primary/10 border border-primary/20 rounded-tr-sm'
                                                : 'bg-muted border rounded-tl-sm'}`}>
                                            {m.body}
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1">{formatTime(m.created_at)}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {typing && (
                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">L</div>
                                <div className="bg-muted border rounded-xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                                    {[0, 0.2, 0.4].map((d, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}s` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </CardContent>

                    {/* Input */}
                    <div className="border-t px-4 py-3 flex gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                            placeholder="Type a message…"
                            disabled={sending}
                            className="flex-1"
                        />
                        <Button onClick={send} disabled={!input.trim() || sending} size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}