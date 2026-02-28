'use client';

import { useEffect, useState } from 'react';
import { getBatches, runConsolidation, resetConsolidation } from '@/lib/api';
import { Layers, Loader2, RefreshCw, Trash2 } from 'lucide-react';

export default function ConsolidationPage() {
  const [batches, setBatches] = useState<Awaited<ReturnType<typeof getBatches>>>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = () => {
    setLoading(true);
    getBatches().then(setBatches).catch(() => setBatches([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const run = () => {
    setRunning(true);
    runConsolidation().then((newBatches) => setBatches((prev) => [...(newBatches || []), ...prev])).catch(() => { }).finally(() => setRunning(false));
  };

  const reset = async () => {
    if (!confirm('Are you sure you want to reset all batches? This will also wipe your production schedule.')) return;
    setResetting(true);
    try {
      await resetConsolidation();
      load();
    } catch (e) {
      alert('Failed to reset consolidation');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Order Consolidation</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>Group orders by Product + Color and sum quantities into batches</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button
          onClick={run}
          disabled={running || resetting}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
        >
          {running ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={18} />}
          Run Consolidation
        </button>
        <button
          onClick={reset}
          disabled={running || resetting || batches.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--gray-700)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
        >
          {resetting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={18} />}
          Reset Engine
        </button>
      </div>

      <div style={{ background: 'var(--gray-800)', borderRadius: 12, border: '1px solid var(--gray-700)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
        ) : batches.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>
            <Layers size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>No consolidated batches. Add orders and run consolidation.</p>
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--gray-900)', textAlign: 'left', color: 'var(--gray-500)' }}>
                <th style={{ padding: '14px 20px' }}>Batch ID</th>
                <th style={{ padding: '14px 20px' }}>Product</th>
                <th style={{ padding: '14px 20px' }}>Color</th>
                <th style={{ padding: '14px 20px' }}>Total Qty</th>
                <th style={{ padding: '14px 20px' }}>Order IDs</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} style={{ borderTop: '1px solid var(--gray-700)' }}>
                  <td style={{ padding: '14px 20px' }}>{b.id}</td>
                  <td style={{ padding: '14px 20px' }}>{b.product_name}</td>
                  <td style={{ padding: '14px 20px' }}>{b.color}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{b.total_quantity}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--gray-400)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.order_ids || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
