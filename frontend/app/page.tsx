'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/lib/api';
import { Calendar, Package, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 48 }}>
        <p style={{ color: 'var(--danger)' }}>Error: {error}. Is the API running on port 8000?</p>
      </div>
    );
  }

  const cards = [
    { label: "Today's Production", value: stats?.today_plan_count ?? 0, icon: Calendar, href: '/production', color: 'var(--red-muted)' },
    { label: 'Pending Orders', value: stats?.pending_orders_count ?? 0, icon: Package, href: '/orders', color: 'var(--navy-light)' },
    { label: 'Completed', value: stats?.completed_orders_count ?? 0, icon: Package },
    { label: 'Delay Alerts', value: stats?.delayed_orders_count ?? 0, icon: AlertTriangle, href: '/orders', color: 'rgba(220, 38, 38, 0.2)' },
  ];

  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 32 }}>Overview of production and orders</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          const content = (
            <div
              key={c.label}
              style={{
                background: c.color || 'var(--gray-800)',
                borderRadius: 12,
                padding: 24,
                border: '1px solid var(--gray-800)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--gray-400)', fontSize: 14 }}>{c.label}</span>
                <Icon size={20} style={{ color: 'var(--gray-500)' }} />
              </div>
              <p style={{ fontSize: 32, fontWeight: 700 }}>{c.value}</p>
            </div>
          );
          return c.href ? <Link key={c.label} href={c.href}>{content}</Link> : <div key={c.label}>{content}</div>;
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={{ background: 'var(--gray-800)', borderRadius: 12, padding: 24, border: '1px solid var(--gray-700)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Today&apos;s Production Plan</h2>
          {stats?.today_plan?.length ? (
            <table style={{ width: '100%', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-700)' }}>
                  <th style={{ paddingBottom: 12 }}>Product</th>
                  <th style={{ paddingBottom: 12 }}>Color</th>
                  <th style={{ paddingBottom: 12 }}>Qty</th>
                  <th style={{ paddingBottom: 12 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.today_plan.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-800)' }}>
                    <td style={{ padding: '12px 0' }}>{p.product_name}</td>
                    <td>{p.color}</td>
                    <td>{p.quantity_planned}</td>
                    <td><span style={{ color: 'var(--gray-400)' }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--gray-500)' }}>No production scheduled for today.</p>
          )}
        </section>

        <section style={{ background: 'var(--gray-800)', borderRadius: 12, padding: 24, border: '1px solid var(--gray-700)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Delay Alerts</h2>
          {stats?.delayed_orders?.length ? (
            <table style={{ width: '100%', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-700)' }}>
                  <th style={{ paddingBottom: 12 }}>Order</th>
                  <th style={{ paddingBottom: 12 }}>Product</th>
                  <th style={{ paddingBottom: 12 }}>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {stats.delayed_orders.slice(0, 5).map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--gray-800)' }}>
                    <td style={{ padding: '12px 0' }}>{o.order_id}</td>
                    <td>{o.product_name} / {o.color}</td>
                    <td style={{ color: 'var(--danger)' }}>{o.delivery_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--gray-500)' }}>No delay alerts.</p>
          )}
        </section>
      </div>

      <section style={{ marginTop: 24, background: 'var(--gray-800)', borderRadius: 12, padding: 24, border: '1px solid var(--gray-700)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Pending Orders</h2>
        {stats?.pending_orders?.length ? (
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-700)' }}>
                <th style={{ paddingBottom: 12 }}>Order ID</th>
                <th style={{ paddingBottom: 12 }}>Product</th>
                <th style={{ paddingBottom: 12 }}>Color</th>
                <th style={{ paddingBottom: 12 }}>Qty</th>
                <th style={{ paddingBottom: 12 }}>Delivery</th>
              </tr>
            </thead>
            <tbody>
              {stats.pending_orders.slice(0, 10).map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--gray-800)' }}>
                  <td style={{ padding: '12px 0' }}>{o.order_id}</td>
                  <td>{o.product_name}</td>
                  <td>{o.color}</td>
                  <td>{o.quantity}</td>
                  <td>{o.delivery_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--gray-500)' }}>No pending orders.</p>
        )}
      </section>
    </div>
  );
}
