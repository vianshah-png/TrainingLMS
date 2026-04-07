"use client";

import { useState, useEffect } from 'react';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
    notify: any;
    onRead: (id: string) => void;
}

export default function NotificationItem({ notify, onRead }: NotificationItemProps) {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(!!notify.interaction_response);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const openNotif = params.get('openNotif');
        const urlRating = params.get('rating');
        if (openNotif === notify.id && urlRating) {
            setRating(parseInt(urlRating));
        }
    }, [notify.id]);

    const handleSubmitFeedback = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: notify.id,
                    interactionResponse: {
                        rating,
                        text: feedback,
                        submittedAt: new Date().toISOString()
                    }
                })
            });

            if (response.ok) {
                setIsSubmitted(true);
                onRead(notify.id);
            }
        } catch (err) {
            console.error("Feedback submission error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFeedbackTemplate = notify.template === 'feedback';

    const handleContainerClick = () => {
        if (notify.interaction_payload?.deepLink) {
            router.push(notify.interaction_payload.deepLink);
        }
        if (!notify.is_read) {
            onRead(notify.id);
        }
    };

    return (
        <div
            onClick={handleContainerClick}
            className={`px-5 py-4 border-b border-gray-50 transition-all cursor-pointer hover:bg-gray-50/50 ${!notify.is_read
                ? `border-l-4 ${notify.type === 'alert' ? 'border-l-red-500 bg-red-50/20' :
                    notify.type === 'warning' ? 'border-l-orange-400 bg-orange-50/20' :
                        'border-l-[#00B6C1] bg-[#00B6C1]/5'
                }`
                : ''
                }`}
        >
            <div className="flex justify-between items-start mb-1">
                <h5 className="text-[11px] font-bold text-[#0E5858] leading-tight pr-2">{notify.title}</h5>
                <p className="text-[7px] font-black text-gray-300 uppercase shrink-0">
                    {new Date(notify.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium mb-3">{notify.message}</p>

            {isFeedbackTemplate && !isSubmitted && (
                <div className="mt-4 bg-white/50 border border-[#0E585810] rounded-2xl p-4 shadow-inner" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`transition-all ${rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-200 hover:text-yellow-200'}`}
                            >
                                <Star size={16} fill={rating >= star ? "currentColor" : "none"} />
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Add your thoughts..."
                        className="w-full h-16 bg-white border border-[#0E585805] rounded-xl p-3 text-[10px] text-[#0E5858] focus:outline-none focus:ring-1 focus:ring-[#00B6C120] placeholder:text-gray-300 resize-none transition-all"
                    />
                    <button
                        onClick={handleSubmitFeedback}
                        disabled={rating === 0 || isSubmitting}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-[#0E5858] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#00B6C1] disabled:opacity-30 disabled:hover:bg-[#0E5858] transition-all"
                    >
                        {isSubmitting ? 'Sending...' : (
                            <>
                                <Send size={10} /> Submit Feedback
                            </>
                        )}
                    </button>
                </div>
            )}

            {isSubmitted && isFeedbackTemplate && (
                <div className="mt-3 flex items-center gap-2 text-[#059669]">
                    <CheckCircle2 size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-tight">Status: Mission Accomplished</span>
                </div>
            )}

            {!notify.is_read && !isFeedbackTemplate && <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00B6C1]"></div>}
        </div>
    );
}
