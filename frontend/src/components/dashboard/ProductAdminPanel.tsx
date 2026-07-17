'use client';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createManagerProduct } from '@/services/managerProductService';

const initial = { name: '', category: 'laptops', price: '', stock: '', description: '', overview: '', howItWorks: '', bestFor: '', limitations: '', deliveryEstimate: '2–5 business days', warranty: '1-year limited warranty' };

export default function ProductAdminPanel() {
  const { accessToken } = useAuth();
  const [fields, setFields] = useState(initial);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (name: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [name]: value }));
  const chooseImage = (file: File | null) => { setImage(file); setPreview(''); if (file) { const reader = new FileReader(); reader.onload = () => setPreview(String(reader.result)); reader.readAsDataURL(file); } };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!accessToken) return setError('Manager session is missing. Sign in again.');
    const form = new FormData();
    form.set('name', fields.name); form.set('category', fields.category); form.set('price', fields.price); form.set('stock', fields.stock);
    form.set('description', fields.description); form.set('overview', fields.overview); form.set('how_it_works', fields.howItWorks);
    form.set('best_for', JSON.stringify(fields.bestFor.split(',').map((value) => value.trim()).filter(Boolean)));
    form.set('limitations', JSON.stringify(fields.limitations.split(',').map((value) => value.trim()).filter(Boolean)));
    form.set('specifications', '[]'); form.set('delivery_estimate', fields.deliveryEstimate); form.set('warranty', fields.warranty);
    if (image) form.set('image', image);
    setSaving(true);
    try { const product = await createManagerProduct(form, accessToken); setMessage(`${product.name} was added to the live catalog.`); setFields(initial); setImage(null); setPreview(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Product could not be created.'); }
    finally { setSaving(false); }
  };

  const input = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10';
  return <div className="grid gap-6 lg:grid-cols-[1fr_.7fr]"><form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-surface p-5"><div><h2 className="text-lg font-bold">Add a product</h2><p className="text-xs text-text-muted">Products are saved to Supabase. Images are optional.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Name<input required value={fields.name} onChange={(e) => update('name', e.target.value)} className={input}/></label><label className="text-sm">Category<select value={fields.category} onChange={(e) => update('category', e.target.value)} className={input}><option value="laptops">Laptops</option><option value="chairs">Chairs</option><option value="headphones">Headphones</option><option value="accessories">Accessories</option></select></label><label className="text-sm">Price<input required min="0.01" step="0.01" type="number" value={fields.price} onChange={(e) => update('price', e.target.value)} className={input}/></label><label className="text-sm">Stock<input required min="0" type="number" value={fields.stock} onChange={(e) => update('stock', e.target.value)} className={input}/></label></div><label className="block text-sm">Short description<textarea required rows={2} value={fields.description} onChange={(e) => update('description', e.target.value)} className={input}/></label><label className="block text-sm">Overview<textarea required rows={3} value={fields.overview} onChange={(e) => update('overview', e.target.value)} className={input}/></label><label className="block text-sm">How it works<textarea required rows={3} value={fields.howItWorks} onChange={(e) => update('howItWorks', e.target.value)} className={input}/></label><label className="block text-sm">Best for <span className="text-text-muted">(comma separated)</span><input value={fields.bestFor} onChange={(e) => update('bestFor', e.target.value)} className={input}/></label><label className="block text-sm">Limitations <span className="text-text-muted">(comma separated)</span><input value={fields.limitations} onChange={(e) => update('limitations', e.target.value)} className={input}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Delivery estimate<input value={fields.deliveryEstimate} onChange={(e) => update('deliveryEstimate', e.target.value)} className={input}/></label><label className="text-sm">Warranty<input value={fields.warranty} onChange={(e) => update('warranty', e.target.value)} className={input}/></label></div><label className="block text-sm">Product image <span className="text-text-muted">(optional, max 5 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => chooseImage(e.target.files?.[0] ?? null)} className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-primary`}/></label>{error && <p className="text-sm text-danger" role="alert">{error}</p>}{message && <p className="text-sm text-success" role="status">{message}</p>}<button disabled={saving} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving product…' : 'Add product'}</button></form><aside className="rounded-2xl border border-border bg-surface p-5"><h3 className="font-bold">Preview</h3><div className="mt-4 grid aspect-square place-items-center overflow-hidden rounded-2xl bg-surface-alt">{preview ? <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${preview})` }}/> : <span className="text-sm text-text-muted">No image selected</span>}</div><h4 className="mt-4 font-bold">{fields.name || 'Product name'}</h4><p className="mt-1 text-sm text-text-secondary">{fields.description || 'Short description will appear here.'}</p><p className="mt-3 text-xl font-black">{fields.price ? `$${Number(fields.price).toFixed(2)}` : '$0.00'}</p></aside></div>;
}
