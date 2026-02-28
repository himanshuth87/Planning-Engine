const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const API = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || String(err));
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return {} as T;
  return res.json();
}

export async function uploadExcel(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/api/orders/upload-excel`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || JSON.stringify(err));
  }
  return res.json();
}

// Dashboard
export function getDashboardStats() {
  return api<{
    today_plan_count: number;
    pending_orders_count: number;
    completed_orders_count: number;
    delayed_orders_count: number;
    today_plan: Array<{ id: number; planned_date: string; product_name: string; color: string; quantity_planned: number; status: string; machine_id: number | null }>;
    pending_orders: Array<{ id: number; order_id: string; product_name: string; quantity: number; color: string; delivery_date: string; status: string }>;
    delayed_orders: Array<{ id: number; order_id: string; product_name: string; quantity: number; color: string; delivery_date: string; status: string }>;
  }>('/api/dashboard/stats');
}

// Orders
export function getOrders(status?: string) {
  const q = status ? `?status=${status}` : '';
  return api<Array<{ id: number; order_id: string; product_name: string; quantity: number; color: string; delivery_date: string; status: string }>>(`/api/orders/${q}`);
}

export function createOrder(data: { order_id: string; product_name: string; quantity: number; color: string; delivery_date: string }) {
  return api('/api/orders/', { method: 'POST', body: JSON.stringify(data) });
}

// Consolidation
export function runConsolidation() {
  return api<Array<{ id: number; product_name: string; color: string; total_quantity: number; order_ids: string | null }>>('/api/consolidation/run', { method: 'POST' });
}

export function getBatches() {
  return api<Array<{ id: number; product_name: string; color: string; total_quantity: number; order_ids: string | null }>>('/api/consolidation/batches');
}

// Production
export function generatePlan(start_date?: string) {
  const q = start_date ? `?start_date=${start_date}` : '';
  return api<Array<{ id: number; planned_date: string; batch_id: number | null; quantity_planned: number; status: string; machine_id: number | null }>>(`/api/production/generate${q}`, { method: 'POST' });
}

export function getTodayPlan() {
  return api<Array<{ id: number; planned_date: string; batch_id: number | null; quantity_planned: number; status: string; machine_id: number | null }>>('/api/production/today');
}

export function getSchedule(from: string, to: string) {
  return api<Array<{ id: number; planned_date: string; batch_id: number | null; quantity_planned: number; status: string; machine_id: number | null }>>(`/api/production/schedule?from=${from}&to=${to}`);
}

// Raw materials
export function getRawMaterials() {
  return api<Array<{ id: number; name: string; unit: string }>>('/api/raw-materials/materials');
}

export function getProducts() {
  return api<Array<{ id: number; name: string; raw_materials: Array<{ id: number; raw_material_id: number; quantity_per_unit: number; raw_material?: { id: number; name: string; unit: string } }> }>>('/api/raw-materials/products');
}

export function createRawMaterial(data: { name: string; unit?: string }) {
  return api('/api/raw-materials/materials', { method: 'POST', body: JSON.stringify(data) });
}

export function createProduct(data: { name: string }) {
  return api('/api/raw-materials/products', { method: 'POST', body: JSON.stringify(data) });
}

export function addProductMaterial(productId: number, data: { raw_material_id: number; quantity_per_unit: number }) {
  return api(`/api/raw-materials/products/${productId}/materials`, { method: 'POST', body: JSON.stringify(data) });
}

export function getBatchRequirement(batchId: number) {
  return api<{ batch_id: number; product_name: string; color: string; total_quantity: number; requirements: Array<{ raw_material_name: string; unit: string; quantity_per_unit: number; total_quantity: number }> }>(`/api/raw-materials/batch/${batchId}/requirement`);
}

// Machines
export function getMachines() {
  return api<Array<{ id: number; name: string; capacity_per_day: number; is_active: boolean }>>('/api/machines/');
}

export function createMachine(data: { name: string; capacity_per_day: number; is_active?: boolean }) {
  return api('/api/machines/', { method: 'POST', body: JSON.stringify(data) });
}
