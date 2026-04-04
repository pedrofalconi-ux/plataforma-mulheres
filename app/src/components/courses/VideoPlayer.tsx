'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  lessonId: string;
  courseId: string;
  onComplete?: () => void;
  poster?: string;
}

export default function VideoPlayer({ url, lessonId, courseId, onComplete, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncTimeRef = useRef<number>(0);

  // Sync progress every 15 seconds of watch time
  const SYNC_INTERVAL = 15;

  const syncProgress = async (watchTime: number, completed = false) => {
    try {
      if (completed) setIsSyncing(true);
      
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          courseId,
          watchTime: Math.floor(watchTime),
          completed
        }),
      });

      if (!response.ok) {
        console.error('Failed to sync progress');
      }

      if (completed) {
        setIsCompleted(true);
        setIsSyncing(false);
        if (onComplete) onComplete();
      }
    } catch (err) {
      console.error('Error syncing video progress:', err);
      if (completed) setIsSyncing(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || isCompleted) return;
    
    const currentTime = videoRef.current.currentTime;
    
    // Check if we hit a 15-second milestone to sync
    if (currentTime - lastSyncTimeRef.current >= SYNC_INTERVAL) {
      lastSyncTimeRef.current = currentTime;
      syncProgress(currentTime, false);
    }
    
    // Auto-complete if watched 95% of the video
    const duration = videoRef.current.duration;
    if (duration > 0 && currentTime / duration > 0.95 && !isCompleted) {
      syncProgress(currentTime, true);
    }
  };

  const handleEnded = () => {
    if (!isCompleted && videoRef.current) {
      syncProgress(videoRef.current.currentTime, true);
    }
  };

  const markAsCompleteManually = () => {
    if (!isCompleted && videoRef.current) {
      syncProgress(videoRef.current.currentTime, true);
    }
  };

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeId(url);

  return (
    <div className="w-full bg-stone-900 rounded-xl overflow-hidden shadow-lg relative group">
      {youtubeId ? (
        <div className="aspect-video w-full">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full aspect-video outline-none"
          src={url}
          poster={poster}
          controls
          controlsList="nodownload"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        >
          <p className="text-white p-4">Seu navegador não suporta a tag de vídeo.</p>
        </video>
      )}

    </div>
  );
}
