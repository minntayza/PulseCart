'use client';
import { FormEvent, useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createManagerProduct, updateManagerProduct, deleteManagerProduct, generateProductDetails } from '@/services/managerProductService';
import { getProducts } from '@/services/productService';
import { Product, formatPrice } from '@/types';

const initial = {
  name: '', category: 'laptops', price: '', stock: '', description: '',
  badge: '',
  overview: '', howItWorks: '', bestFor: '', limitations: '',
};

export default function ProductAdminPanel() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [fields, setFields] = useState(initial);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [showGenerated, setShowGenerated] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const update = (name: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [name]: value }));
  const chooseImage = (file: File | null) => {
    setImage(file);
    setPreview('');
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(String(reader.result));
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getProducts()
      .then((data) => { if (!cancelled) setProducts(data); })
      .catch((err) => { if (!cancelled) console.error('Failed to load products', err); });
    return () => { cancelled = true; };
  }, []);

  const selectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    setError(''); setMessage(''); setImage(null); setShowDeleteConfirm(false);
    setShowGenerated(false);
    if (product) {
      setFields({
        name: product.name, category: product.category,
        price: product.price.toString(), stock: (product.stock ?? 0).toString(),
        description: product.description, badge: product.badge || '',
        overview: product.overview || '', howItWorks: product.howItWorks || '',
        bestFor: (product.bestFor || []).join(', '),
        limitations: (product.limitations || []).join(', '),
      });
      setPreview(product.imageUrl || '');
    } else {
      setFields(initial); setPreview('');
    }
  };

  const handleGenerate = async () => {
    if (!accessToken) return setError('Manager session is missing.');
    if (!fields.name || !fields.description) return setError('Fill in name and description first.');
    setGenerating(true); setError(''); setMessage('');
    try {
      const result = await generateProductDetails(
        { name: fields.name, category: fields.category, description: fields.description },
        accessToken,
      );
      setFields((prev) => ({
        ...prev,
        overview: result.overview,
        howItWorks: result.howItWorks,
        bestFor: result.bestFor.join(', '),
        limitations: result.limitations.join(', '),
      }));
      setShowGenerated(true);
      setMessage('AI details generated. Review and edit before saving.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!accessToken) return setError('Manager session is missing. Sign in again.');
    const form = new FormData();
    form.set('name', fields.name);
    form.set('category', fields.category);
    form.set('price', fields.price);
    form.set('stock', fields.stock);
    form.set('description', fields.description);
    form.set('overview', fields.overview);
    form.set('how_it_works', fields.howItWorks);
    form.set('best_for', JSON.stringify(fields.bestFor.split(',').map((v) => v.trim()).filter(Boolean)));
    form.set('limitations', JSON.stringify(fields.limitations.split(',').map((v) => v.trim()).filter(Boolean)));
    form.set('specifications', '[]');
    form.set('warranty', '1-year limited warranty');
    if (fields.badge) form.set('badge', fields.badge);
    if (image) form.set('image', image);
    setSaving(true);
    try {
      if (selectedProduct) {
        const product = await updateManagerProduct(selectedProduct.id, form, accessToken);
        setMessage(`${product.name} was updated successfully.`);
        setProducts(products.map((p) => (p.id === product.id ? product : p)));
      } else {
        const product = await createManagerProduct(form, accessToken);
        setMessage(`${product.name} was added to the live catalog.`);
        setProducts([product, ...products]);
        setFields(initial); setImage(null); setPreview(''); setShowGenerated(false);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Product could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct || !accessToken) return;
    setSaving(true);
    try {
      await deleteManagerProduct(selectedProduct.id, accessToken);
      setMessage(`${selectedProduct.name} deleted.`);
      setProducts(products.filter((p) => p.id !== selectedProduct.id));
      selectProduct(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Product could not be deleted.');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const input = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10';
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === 'all' || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr_.7fr]">
      {/* Sidebar list */}
      <aside className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col max-h-[700px]">
        <div className="p-4 border-b border-border bg-surface-alt space-y-3">
          <button type="button" onClick={() => selectProduct(null)} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold">
            + Add New Product
          </button>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 text-xs whitespace-nowrap rounded-full border transition-colors ${selectedCategory === c ? 'bg-primary text-white border-primary' : 'bg-background border-border text-foreground hover:bg-surface'}`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="overflow-y-auto p-2 space-y-1">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectProduct(p)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProduct?.id === p.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-alt'}`}
            >
              {p.name}
            </button>
          ))}
          {filteredProducts.length === 0 && <p className="text-center text-xs text-text-muted mt-4">No products found</p>}
        </div>
      </aside>

      {/* Form */}
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">{selectedProduct ? 'Edit product' : 'Add a product'}</h2>
            <p className="text-xs text-text-muted">Products are saved to Supabase. Images are optional.</p>
          </div>
          {selectedProduct && (
            <div className="flex gap-2">
              {showDeleteConfirm ? (
                <>
                  <button type="button" onClick={handleDelete} className="text-sm font-bold text-white bg-danger rounded px-3 py-1 hover:bg-danger/80">Confirm Delete</button>
                  <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-sm font-bold text-text-muted hover:underline px-3 py-1">Cancel</button>
                </>
              ) : (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-sm font-bold text-danger hover:underline px-3 py-1">Delete</button>
              )}
            </div>
          )}
        </div>

        {/* Basic fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Name<input required minLength={2} value={fields.name} onChange={(e) => update('name', e.target.value)} className={input} /></label>
          <label className="text-sm">Category
            <select value={fields.category} onChange={(e) => update('category', e.target.value)} className={input}>
              <option value="laptops">Laptops</option>
              <option value="chairs">Chairs</option>
              <option value="headphones">Headphones</option>
              <option value="accessories">Accessories</option>
            </select>
          </label>
          <label className="text-sm">Price<input required min="0.01" step="0.01" type="number" value={fields.price} onChange={(e) => update('price', e.target.value)} className={input} /></label>
          <label className="text-sm">Stock<input required min="0" type="number" value={fields.stock} onChange={(e) => update('stock', e.target.value)} className={input} /></label>
        </div>
        <label className="block text-sm">Short description<textarea required minLength={5} rows={2} value={fields.description} onChange={(e) => update('description', e.target.value)} className={input} /></label>
        <label className="text-sm">Badge
          <select value={fields.badge} onChange={(e) => update('badge', e.target.value)} className={input}>
            <option value="">None</option>
            <option value="agent">Agent</option>
            <option value="trending">Trending</option>
            <option value="match">Match</option>
          </select>
        </label>
        <label className="block text-sm">Product image <span className="text-text-muted">(optional, max 5 MB)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => chooseImage(e.target.files?.[0] ?? null)} className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-primary`} />
        </label>

        {/* AI Generate button */}
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !fields.name || !fields.description}
            className="w-full rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? 'Generating details…' : '✨ Generate AI Details'}
          </button>
          <p className="text-xs text-text-muted mt-1 text-center">Auto-fills overview, how it works, best for, and limitations from name + category + description</p>
        </div>

        {/* AI-Generated fields (expandable) */}
        {showGenerated && (
          <div className="border border-primary/20 rounded-xl bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">AI-Generated Details</h3>
              <button type="button" onClick={() => setShowGenerated(false)} className="text-xs text-text-muted hover:underline">Collapse</button>
            </div>
            <label className="block text-sm">Overview<textarea rows={3} value={fields.overview} onChange={(e) => update('overview', e.target.value)} className={input} /></label>
            <label className="block text-sm">How it works<textarea rows={3} value={fields.howItWorks} onChange={(e) => update('howItWorks', e.target.value)} className={input} /></label>
            <label className="block text-sm">Best for <span className="text-text-muted">(comma separated)</span><input value={fields.bestFor} onChange={(e) => update('bestFor', e.target.value)} className={input} /></label>
            <label className="block text-sm">Limitations <span className="text-text-muted">(comma separated)</span><input value={fields.limitations} onChange={(e) => update('limitations', e.target.value)} className={input} /></label>
          </div>
        )}

        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        {message && <p className="text-sm text-success" role="status">{message}</p>}
        <button disabled={saving} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
          {saving ? 'Saving product…' : selectedProduct ? 'Save changes' : 'Add product'}
        </button>
      </form>

      {/* Preview */}
      <aside className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-bold">Preview</h3>
        <div className="mt-4 grid aspect-square place-items-center overflow-hidden rounded-2xl bg-surface-alt">
          {preview ? <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${preview})` }} /> : <span className="text-sm text-text-muted">No image selected</span>}
        </div>
        <h4 className="mt-4 font-bold">{fields.name || 'Product name'}</h4>
        <p className="mt-1 text-sm text-text-secondary">{fields.description || 'Short description will appear here.'}</p>
        <p className="mt-3 text-xl font-black">{fields.price ? formatPrice(Number(fields.price)) : '$0.00'}</p>
      </aside>
    </div>
  );
}
