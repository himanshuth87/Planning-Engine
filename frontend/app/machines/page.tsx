'use client';

import { useEffect, useState } from 'react';
import { getMachines, createMachine } from '@/lib/api';
import { Cpu, Loader2, Plus } from 'lucide-react';

export default function MachinesPage() {
  const [machines, setMachines] = useState<Awaited<ReturnType<typeof getMachines>>>([]);
  const [loading, setLoading] = useState(true);
  const [newMachine, setNewMachine] = useState({ name: '', capacity_per_day: 100 });

  const load = () => {
    setLoading(true);
    getMachines().then(setMachines).catch(() => setMachines([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add = () => {
    if (!newMachine.name.trim()) return;
    createMachine(newMachine).then(() => { setNewMachine({ name: '', capacity_per_day: 100 }); load(); }).catch(() => {});
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Machine Scheduling</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>Define machine capacity per day; production plan allocates by capacity</p>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Machine name"
          value={newMachine.name}
          onChange={(e) => setNewMachine((p) => ({ ...p, name: e.target.value }))}
          style={{ padding: '10px 14px', background: 'var(--gray-800)', border: '1px solid var(--gray-700)', borderRadius: 8, color: 'var(--white)', width: 200 }}
        />
        <input
          type="number"
          placeholder="Capacity/day"
          value={newMachine.capacity_per_day}
          onChange={(e) => setNewMachine((p) => ({ ...p, capacity_per_day: Number(e.target.value) || 0 }))}
          style={{ padding: '10px 14px', background: 'var(--gray-800)', border: '1px solid var(--gray-700)', borderRadius: 8, color: 'var(--white)', width: 120 }}
        />
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}>
          <Plus size={18} /> Add Machine
        </button>
      </div>

      <div style={{ background: 'var(--gray-800)', borderRadius: 12, border: '1px solid var(--gray-700)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
        ) : machines.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>
            <Cpu size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>No machines. Add one to use in production planning.</p>
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--gray-900)', textAlign: 'left', color: 'var(--gray-500)' }}>
                <th style={{ padding: '14px 20px' }}>ID</th>
                <th style={{ padding: '14px 20px' }}>Name</th>
                <th style={{ padding: '14px 20px' }}>Capacity / day</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--gray-700)' }}>
                  <td style={{ padding: '14px 20px' }}>{m.id}</td>
                  <td style={{ padding: '14px 20px' }}>{m.name}</td>
                  <td style={{ padding: '14px 20px' }}>{m.capacity_per_day} units</td>
                  <td style={{ padding: '14px 20px' }}>{m.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
