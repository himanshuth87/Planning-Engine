'use client';

import { useEffect, useState } from 'react';
import { getSchedule, generatePlan } from '@/lib/api';
import { CalendarDays, Loader2, Play } from 'lucide-react';

export default function ProductionPage() {
  const [schedule, setSchedule] = useState<Awaited<ReturnType<typeof getSchedule>>>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [toDate, setToDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); });

  const load = () => {
    setLoading(true);
    getSchedule(fromDate, toDate).then(setSchedule).catch(() => setSchedule([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [fromDate, toDate]);

  const runGenerate = () => {
    setGenerating(true);
    generatePlan().then(load).catch(() => {}).finally(() => setGenerating(false));
  };

  const byDate = schedule.reduce((acc, p) => {
    const d = p.planned_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {} as Record<string, typeof schedule>);

  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Production Plan</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>Daily schedule by delivery priority; generate plan from consolidated batches</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          From
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '8px 12px', background: 'var(--gray-800)', border: '1px solid var(--gray-700)', borderRadius: 8, color: 'var(--white)' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          To
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '8px 12px', background: 'var(--gray-800)', border: '1px solid var(--gray-700)', borderRadius: 8, color: 'var(--white)' }} />
        </label>
        <button onClick={runGenerate} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
          {generating ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={18} />}
          Generate Plan
        </button>
      </div>

      <div style={{ background: 'var(--gray-800)', borderRadius: 12, border: '1px solid var(--gray-700)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
        ) : Object.keys(byDate).length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>
            <CalendarDays size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>No production schedule. Run consolidation then Generate Plan.</p>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            {Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, plans]) => (
              <div key={date} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--gray-400)' }}>{date}</h3>
                <table style={{ width: '100%', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--gray-500)' }}>
                      <th style={{ padding: '10px 16px' }}>Plan ID</th>
                      <th style={{ padding: '10px 16px' }}>Batch ID</th>
                      <th style={{ padding: '10px 16px' }}>Qty</th>
                      <th style={{ padding: '10px 16px' }}>Status</th>
                      <th style={{ padding: '10px 16px' }}>Machine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--gray-700)' }}>
                        <td style={{ padding: '10px 16px' }}>{p.id}</td>
                        <td style={{ padding: '10px 16px' }}>{p.batch_id ?? '-'}</td>
                        <td style={{ padding: '10px 16px' }}>{p.quantity_planned}</td>
                        <td style={{ padding: '10px 16px' }}>{p.status}</td>
                        <td style={{ padding: '10px 16px' }}>{p.machine_id ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
