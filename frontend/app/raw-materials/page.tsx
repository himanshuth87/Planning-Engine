'use client';

import { useEffect, useState } from 'react';
import { getRawMaterials, getProducts, getBatches, getBatchRequirement, createRawMaterial, createProduct, addProductMaterial } from '@/lib/api';
import { Boxes, Loader2, Plus } from 'lucide-react';

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<Awaited<ReturnType<typeof getRawMaterials>>>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const [batches, setBatches] = useState<Awaited<ReturnType<typeof getBatches>>>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [requirement, setRequirement] = useState<Awaited<ReturnType<typeof getBatchRequirement>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'kg' });
  const [newProduct, setNewProduct] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getRawMaterials(), getProducts(), getBatches()])
      .then(([m, p, b]) => {
        setMaterials(m);
        setProducts(p);
        setBatches(b);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedBatchId == null) { setRequirement(null); return; }
    getBatchRequirement(selectedBatchId).then(setRequirement).catch(() => setRequirement(null));
  }, [selectedBatchId]);

  const addMaterial = () => {
    if (!newMaterial.name.trim()) return;
    createRawMaterial(newMaterial).then(() => { setNewMaterial({ name: '', unit: 'kg' }); load(); }).catch(() => {});
  };

  const addProduct = () => {
    if (!newProduct.trim()) return;
    createProduct({ name: newProduct }).then(() => { setNewProduct(''); load(); }).catch(() => {});
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Raw Materials</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>Define RM per product and view requirements per batch</p>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <section style={{ background: 'var(--gray-800)', borderRadius: 12, padding: 24, border: '1px solid var(--gray-700)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Raw Materials</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  placeholder="Name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial((p) => ({ ...p, name: e.target.value }))}
                  style={{ padding: '8px 12px', background: 'var(--gray-900)', border: '1px solid var(--gray-700)', borderRadius: 8, color: 'var(--white)', flex: 1 }}
                />
                <input
                  placeholder="Unit"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial((p) => ({ ...p, unit: e.target.value }))}
                  style={{ padding: '8px 12px', background: 'var(--gray-900)', border: '1px solid var(--gray-700)', borderRadius: 8, color: 'var(--white)', width: 80 }}
                />
                <button onClick={addMaterial} style={{ padding: '8px 16px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}>Add</button>
              </div>
              <ul style={{ listStyle: 'none' }}>
                {materials.map((m) => (
                  <li key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-700)', color: 'var(--gray-400)' }}>{m.name} ({m.unit})</li>
                ))}
              </ul>
            </section>

            <section style={{ background: 'var(--gray-800)', borderRadius: 12, padding: 24, border: '1px solid var(--gray-700)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Products (for RM mapping)</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  placeholder="Product name"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  style={{ padding: '8px 12px', background: 'var(--gray-900)', border: '1px solid var(--gray-700)', borderRadius: 8, color: 'var(--white)', flex: 1 }}
                />
                <button onClick={addProduct} style={{ padding: '8px 16px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}>Add</button>
              </div>
              <ul style={{ listStyle: 'none' }}>
                {products.map((p) => (
                  <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-700)' }}>
                    {p.name}
                    {p.raw_materials?.length ? <span style={{ color: 'var(--gray-500)', fontSize: 12 }}> — {p.raw_materials.length} RM(s)</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section style={{ background: 'var(--gray-800)', borderRadius: 12, padding: 24, border: '1px solid var(--gray-700)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>RM requirement by batch</h2>
            <div style={{ marginBottom: 16 }}>
              <select
                value={selectedBatchId ?? ''}
                onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : null)}
                style={{ padding: '10px 14px', background: 'var(--gray-900)', border: '1px solid var(--gray-700)', borderRadius: 8, color: 'var(--white)', minWidth: 200 }}
              >
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>Batch {b.id}: {b.product_name} / {b.color} — {b.total_quantity} units</option>
                ))}
              </select>
            </div>
            {requirement && (
              <div>
                <p style={{ color: 'var(--gray-400)', marginBottom: 12 }}>{requirement.product_name} / {requirement.color} — Total: {requirement.total_quantity} units</p>
                <table style={{ width: '100%', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--gray-500)' }}>
                      <th style={{ paddingBottom: 8 }}>Raw Material</th>
                      <th style={{ paddingBottom: 8 }}>Per unit</th>
                      <th style={{ paddingBottom: 8 }}>Total</th>
                      <th style={{ paddingBottom: 8 }}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirement.requirements.map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--gray-700)' }}>
                        <td style={{ padding: '10px 0' }}>{r.raw_material_name}</td>
                        <td>{r.quantity_per_unit}</td>
                        <td>{r.total_quantity}</td>
                        <td>{r.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selectedBatchId && !requirement && <p style={{ color: 'var(--gray-500)' }}>Loading...</p>}
            {!selectedBatchId && <p style={{ color: 'var(--gray-500)' }}>Select a batch to see RM requirement.</p>}
          </section>
        </>
      )}
    </div>
  );
}
