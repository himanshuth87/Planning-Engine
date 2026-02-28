'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  CalendarDays,
  Boxes,
  Cpu,
  AlertTriangle,
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Sales Orders', icon: FileSpreadsheet },
  { href: '/consolidation', label: 'Consolidation', icon: Layers },
  { href: '/production', label: 'Production Plan', icon: CalendarDays },
  { href: '/raw-materials', label: 'Raw Materials', icon: Boxes },
  { href: '/machines', label: 'Machine Scheduling', icon: Cpu },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 280,
        minHeight: '100vh',
        background: 'var(--navy)',
        borderRight: '1px solid var(--navy-light)',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--navy-light)' }}>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--white)',
          }}
        >
          Production Plan
        </h1>
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
          Manufacturing ERP
        </p>
      </div>
      <nav style={{ padding: '16px 12px' }}>
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                marginBottom: 4,
                background: isActive ? 'var(--red-muted)' : 'transparent',
                color: isActive ? 'var(--red)' : 'var(--gray-400)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
              }}
            >
              <Icon size={20} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          padding: 12,
          background: 'var(--navy-light)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--gray-500)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} />
          AI features coming: optimal plan, delay prediction
        </span>
      </div>
    </aside>
  );
}
