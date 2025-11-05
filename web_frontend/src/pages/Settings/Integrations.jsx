import React, { useEffect, useState } from 'react';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Spinner from '../../components/UI/Spinner';
import { getSupabaseStatus } from '../../lib/api/settings';

/**
 * Integrations Settings page
 * Displays Supabase configuration status using environment variables and a simple read check.
 */
export default function IntegrationsSettings() {
  const [status, setStatus] = useState({ configured: false, url: '', canRead: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getSupabaseStatus();
      if (mounted) {
        setStatus(s);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card title="Supabase" subtitle="Connection status and configuration">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-medium">Environment Configured:</span>
            <Badge color={status.configured ? 'green' : 'red'}>
              {status.configured ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">Client Can Read (shop_settings):</span>
            <Badge color={status.canRead ? 'green' : 'yellow'}>
              {status.canRead ? 'OK' : 'Unknown/No'}
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            Supabase URL: {status.url ? <code>{status.url}</code> : <em>Not set</em>}
          </div>
          <div className="text-xs text-gray-500">
            Ensure environment variables REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY are set.
          </div>
        </div>
      </Card>
    </div>
  );
}
