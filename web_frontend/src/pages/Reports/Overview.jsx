import React from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { Link } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * ReportsOverview
 * Landing page for Reports module offering quick links to individual reports.
 */
// PUBLIC_INTERFACE
export default function ReportsOverview() {
  /** This is a public function. */
  const items = [
    { to: '/reports/sales', title: 'Sales Summary', desc: 'Revenue, orders, and top products by date range.' },
    { to: '/reports/inventory', title: 'Inventory Summary', desc: 'Low stock, stock movements, and valuation.' },
    { to: '/reports/services', title: 'Services Summary', desc: 'Tickets KPIs, status distribution, and technician performance.' },
  ];

  return (
    <div className="page">
      <div className="page-title">Reports & Analytics</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
        {items.map((it) => (
          <Card key={it.to}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>{it.title}</div>
              <div style={{ color: '#6B7280' }}>{it.desc}</div>
              <div>
                <Link to={it.to}>
                  <Button>Open Report</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
