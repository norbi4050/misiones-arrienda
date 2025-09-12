"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

interface UserStats {
  profileViews: number;
  favoriteCount: number;
  messageCount: number;
  rating: number;
  reviewCount: number;
  searchesCount: number;
  responseRate: number;
  joinDate: string;
  verificationLevel: 'none' | 'email' | 'phone' | 'full';
  sentMessages: number;
  receivedMessages: number;
  unreadMessages: number;
}

export function useUserStatsImproved() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchStats = useCallback(async (force = false) => {
    if (!isAuthenticated || !user) {
      setStats(null);
      setLoading(false);
      return;
    }

    // Check cache validity
    const now = Date.now();
    if (!force && stats && (now - lastFetch) < CACHE_DURATION) {
      setLoading(false);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.stats) {
        setStats(data.stats);
        setLastFetch(now);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to default stats only if we don't have any stats yet
      if (!stats) {
        setStats({
          profileViews: 0,
          favoriteCount: 0,
          messageCount: 0,
          rating: 0,
          reviewCount: 0,
          searchesCount: 0,
          responseRate: 0,
          joinDate: user.created_at || new Date().toISOString(),
          verificationLevel: 'none',
          sentMessages: 0,
          receivedMessages: 0,
          unreadMessages: 0
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [isAuthenticated, user, stats, lastFetch]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  // Auto-refresh every 10 minutes when component is active
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      // Only auto-refresh if the page is visible
      if (!document.hidden) {
        fetchStats();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchStats]);

  // Refresh when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user) {
        // Check if data is stale (older than cache duration)
        const now = Date.now();
        if ((now - lastFetch) > CACHE_DURATION) {
          fetchStats();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, user, lastFetch, fetchStats]);

  const refreshStats = useCallback(async () => {
    await fetchStats(true); // Force refresh
  }, [fetchStats]);

  // Method to update specific stat (for optimistic updates)
  const updateStat = useCallback((key: keyof UserStats, value: any) => {
    setStats(prev => prev ? { ...prev, [key]: value } : null);
  }, []);

  // Method to increment a stat
  const incrementStat = useCallback((key: keyof UserStats, increment = 1) => {
    setStats(prev => {
      if (!prev) return null;
      const currentValue = prev[key];
      if (typeof currentValue === 'number') {
        return { ...prev, [key]: currentValue + increment };
      }
      return prev;
    });
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats,
    updateStat,
    incrementStat,
    lastFetch: new Date(lastFetch),
    isStale: stats ? (Date.now() - lastFetch) > CACHE_DURATION : false
  };
}
