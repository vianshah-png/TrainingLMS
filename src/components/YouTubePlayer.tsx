"use client";

import { useEffect, useRef } from 'react';
import { logActivity } from '@/lib/activity';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YouTubePlayerProps {
    videoId: string;
    onComplete: () => void;
    topicCode?: string;
    topicTitle?: string;
}

export default function YouTubePlayer({ videoId, onComplete, topicCode, topicTitle }: YouTubePlayerProps) {
    const playerRef = useRef<any>(null);
    const containerId = `youtube-player-${videoId}`;

    useEffect(() => {
        const checkYoutubeApi = () => {
            if (window.YT && window.YT.Player) {
                createPlayer();
                return true;
            }
            return false;
        };

        if (!checkYoutubeApi()) {
            // If the script isn't already there, add it
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            }

            // Polling approach to handle cases where multiple components load
            // or when script is loading but window.onYouTubeIframeAPIReady is tricky
            const interval = setInterval(() => {
                if (checkYoutubeApi()) {
                    clearInterval(interval);
                }
            }, 100);

            // Also keep the global callback for standard compliance
            const originalCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (originalCallback) originalCallback();
                checkYoutubeApi();
            };

            return () => clearInterval(interval);
        }

        function createPlayer() {
            // Prevent duplicate initialization and error if container missing
            const container = document.getElementById(containerId);
            if (!container || playerRef.current || !window.YT || !window.YT.Player) return;

            try {
                playerRef.current = new window.YT.Player(containerId, {
                    height: '100%',
                    width: '100%',
                    videoId: videoId,
                    playerVars: {
                        'playsinline': 1,
                        'modestbranding': 1,
                        'rel': 0
                    },
                    events: {
                        'onStateChange': onPlayerStateChange
                    }
                });
            } catch (err) {
                console.error("Failed to create YouTube player:", err);
            }
        }

        function onPlayerStateChange(event: any) {
            if (event.data === 1) { // PLAYING
                logActivity('watch_video', { topicCode, contentTitle: topicTitle || 'Video Started' });
            }
            if (event.data === 0) { // ENDED
                onComplete();
                logActivity('watch_video', { topicCode, contentTitle: `${topicTitle || 'Video'} Completed` });
            }
        }

        return () => {
            if (playerRef.current) {
                // playerRef.current.destroy(); // Optional: clean up if needed
            }
        };
    }, [videoId, onComplete]);

    return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
            <div id={containerId} className="w-full h-full"></div>
        </div>
    );
}
