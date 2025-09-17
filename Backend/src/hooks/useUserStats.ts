"use client";

import { useState, useEffect } from 'react';
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
  // Additional stats from enhanced API
  sentMessages?: number;
  receivedMessages?: number;
  unreadMessages?: number;
}

export function useUserStats() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setStats(null);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/users/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');

        // Fallback to default stats
        setStats({
          profileViews: 0,
          favoriteCount: 0,
          messageCount: 0,
          rating: 0,
          reviewCount: 0,
          searchesCount: 0,
          responseRate: 0,
          joinDate: user.created_at || new Date().toISOString(),
          verificationLevel: 'none'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, isAuthenticated]);

  const refreshStats = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/users/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error refreshing stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refreshStats
  };
}
