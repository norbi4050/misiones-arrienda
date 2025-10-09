// Status Page - Simple health dashboard (not indexable)
'use client';

import { useState, useEffect } from 'react';

interface HealthCheck {
  name: string;
  url: string;
  status: 'loading' | 'ok' | 'error';
  responseTime?: number;
  error?: string;
  timestamp?: string;
}

export default function StatusPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Database Health', url: '/api/health-db', status: 'loading' },
    { name: 'Properties API', url: '/api/properties?limit=1', status: 'loading' },
    { name: 'Analytics Ingest', url: '/api/analytics/ingest', status: 'loading' },
    { name: 'Ping Service', url: '/api/ping', status: 'loading' }
  ]);

  const runHealthCheck = async (check: HealthCheck): Promise<HealthCheck> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(check.url, {
        method: check.url.includes('ingest') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: check.url.includes('ingest') ? JSON.stringify({
          event: 'health_check',
          page: '/status',
          timestamp: Date.now()
        }) : undefined
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        ...check,
        status: response.ok ? 'ok' : 'error',
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        ...check,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  };

  const runAllChecks = async () => {
    setChecks(prev => prev.map(check => ({ ...check, status: 'loading' as const })));
    
    const results = await Promise.all(
      checks.map(check => runHealthCheck(check))
    );
    
    setChecks(results);
  };

  useEffect(() => {
    runAllChecks();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(runAllChecks, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'loading': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '❓';
    }
  };

  const allHealthy = checks.every(check => check.status === 'ok');
  const overallStatus = checks.some(check => check.status === 'loading') ? 'loading' : 
                       allHealthy ? 'ok' : 'error';

  return (
    <>
      {/* Prevent indexing */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <title>Status - Misiones Arrienda</title>
      </head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                System Status
              </h1>
              <div className={`flex items-center space-x-2 ${getStatusColor(overallStatus)}`}>
                <span className="text-2xl">{getStatusIcon(overallStatus)}</span>
                <span className="font-semibold">
                  {overallStatus === 'ok' ? 'All Systems Operational' : 
                   overallStatus === 'loading' ? 'Checking...' : 
                   'Some Issues Detected'}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {checks.map((check, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{check.name}</h3>
                    <span className={`flex items-center space-x-1 ${getStatusColor(check.status)}`}>
                      <span>{getStatusIcon(check.status)}</span>
                      <span className="text-sm font-medium">
                        {check.status.toUpperCase()}
                      </span>
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Endpoint: <code className="bg-gray-100 px-1 rounded">{check.url}</code></div>
                    {check.responseTime && (
                      <div>Response Time: {check.responseTime}ms</div>
                    )}
                    {check.timestamp && (
                      <div>Last Check: {new Date(check.timestamp).toLocaleTimeString()}</div>
                    )}
                    {check.error && (
                      <div className="text-red-600">Error: {check.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={runAllChecks}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh All Checks
              </button>
              
              <div className="text-sm text-gray-500">
                Auto-refresh every 30 seconds
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">System Information</h2>
              <div className="grid gap-2 text-sm text-gray-600">
                <div>Environment: {process.env.NODE_ENV}</div>
                <div>Version: v1.0.0</div>
                <div>Last Updated: {new Date().toLocaleString()}</div>
                <div>Build: {process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
