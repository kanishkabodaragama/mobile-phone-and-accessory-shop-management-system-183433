import React, { useEffect, useState } from 'react';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Spinner from '../../components/UI/Spinner';
import { getUsersList } from '../../lib/api/settings';

/**
 * Users Settings page (read-only)
 * Shows a list of users from Supabase 'profiles' or 'users' view; falls back to placeholders.
 */
export default function UsersSettings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getUsersList();
      if (mounted) {
        setRows(data || []);
        const hasPlaceholder = (data || []).some(r => r._placeholder);
        if (hasPlaceholder) {
          setNote('Showing placeholder users. Configure a "profiles" table or "users" view to display real users.');
        }
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

  const columns = [
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'created_at', header: 'Created At' },
  ];

  return (
    <div className="p-6 space-y-6">
      <Card title="Users" subtitle="Read-only list of users">
        {note && (
          <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded p-2 mb-4">
            {note}
          </div>
        )}
        <Table columns={columns} data={rows} />
      </Card>
    </div>
  );
}
