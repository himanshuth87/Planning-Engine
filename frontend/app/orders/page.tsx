'use client';

import { useEffect, useState, useRef } from 'react';
import { getOrders, uploadExcel, deleteAllOrders } from '@/lib/api';
import { Upload, Loader2, FileSpreadsheet, Trash2 } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrders>>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ created: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    getOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all orders? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteAllOrders();
      load();
    } catch (err) {
      alert('Failed to delete all orders');
    } finally {
      setDeleting(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadExcel(file);
      setUploadResult(result);
      load();
    } catch (err) {
      setUploadResult({ created: 0, errors: [err instanceof Error ? err.message : 'Upload failed'] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Sales Orders</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
        Upload Excel or CSV with columns: Order ID, Product Name, Quantity, Color, Delivery Date
      </p>

      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} style={{ display: 'none' }} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || deleting}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', background: 'var(--red)', color: 'white',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14,
          }}
        >
          {uploading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} />}
          Upload Excel
        </button>
        <button
          onClick={handleDeleteAll}
          disabled={uploading || deleting || orders.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', background: 'var(--gray-800)', color: 'white',
            border: '1px solid var(--gray-700)', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: orders.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {deleting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={18} />}
          Delete All
        </button>
      </div>

      {uploadResult && (
        <div style={{ padding: 16, background: uploadResult.errors?.length ? 'rgba(220, 38, 38, 0.1)' : 'var(--red-muted)', borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          <strong>Created: {uploadResult.created}</strong>
          {uploadResult.errors?.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {uploadResult.errors.map((e, i) => <li key={i} style={{ color: 'var(--gray-400)' }}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      <div style={{ background: 'var(--gray-800)', borderRadius: 12, border: '1px solid var(--gray-700)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)' }}>
            <FileSpreadsheet size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>No orders yet. Upload an Excel file to import.</p>
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--gray-900)', textAlign: 'left', color: 'var(--gray-500)' }}>
                <th style={{ padding: '14px 20px' }}>Order ID</th>
                <th style={{ padding: '14px 20px' }}>Product</th>
                <th style={{ padding: '14px 20px' }}>Color</th>
                <th style={{ padding: '14px 20px' }}>Quantity</th>
                <th style={{ padding: '14px 20px' }}>Delivery Date</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderTop: '1px solid var(--gray-700)' }}>
                  <td style={{ padding: '14px 20px' }}>{o.order_id}</td>
                  <td style={{ padding: '14px 20px' }}>{o.product_name}</td>
                  <td style={{ padding: '14px 20px' }}>{o.color}</td>
                  <td style={{ padding: '14px 20px' }}>{o.quantity}</td>
                  <td style={{ padding: '14px 20px' }}>{o.delivery_date}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, background: o.status === 'completed' ? 'var(--success)' : o.status === 'delayed' ? 'var(--danger)' : 'var(--gray-700)', color: 'white' }}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
