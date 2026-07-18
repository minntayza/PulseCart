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
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
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
        description: result.shortDescription || prev.description,
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

  const input = 'mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-text-muted shadow-sm';
  const labelClass = 'block text-sm font-medium text-text-secondary';
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];
  const outOfStockCount = products.filter((p) => (p.stock ?? 0) === 0).length;
  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === 'all' || p.category === selectedCategory) &&
      (stockFilter === 'all' ||
        (stockFilter === 'out-of-stock' && (p.stock ?? 0) === 0) ||
        (stockFilter === 'in-stock' && (p.stock ?? 0) > 0)) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr_340px] items-start">
      {/* Left Panel: Navigation & List */}
      <aside className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col h-[750px]">
        <div className="p-4 border-b border-border-light bg-surface-alt space-y-4">
          <button type="button" onClick={() => selectProduct(null)} className="w-full py-2.5 bg-primary hover:bg-primary-hover transition-colors text-white rounded-xl text-sm font-semibold shadow-sm flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            Add Product
          </button>

          {/* Stock toggle */}
          <div className="flex rounded-lg border border-border bg-background p-0.5">
            {([
              { key: 'all', label: 'All', count: products.length },
              { key: 'in-stock', label: 'In stock', count: products.length - outOfStockCount },
              { key: 'out-of-stock', label: 'Out of stock', count: outOfStockCount },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStockFilter(opt.key)}
                className={`flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  stockFilter === opt.key
                    ? opt.key === 'out-of-stock' && outOfStockCount > 0
                      ? 'bg-danger/10 text-danger shadow-sm'
                      : 'bg-surface text-foreground shadow-sm'
                    : 'text-text-muted hover:text-foreground'
                }`}
              >
                {opt.label}
                <span className={`inline-flex items-center justify-center min-w-[16px] h-4 rounded-full px-1 text-[10px] font-bold ${
                  stockFilter === opt.key
                    ? opt.key === 'out-of-stock' && outOfStockCount > 0
                      ? 'bg-danger/20 text-danger'
                      : 'bg-primary/10 text-primary'
                    : 'bg-border text-text-muted'
                }`}>
                  {opt.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg border transition-all ${
                  selectedCategory === c 
                    ? 'bg-primary-light text-primary border-primary/30' 
                    : 'bg-surface border-border text-text-secondary hover:bg-surface-alt'
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-y-auto p-2 space-y-1 flex-1 bg-surface-alt/30">
          {filteredProducts.map((p) => {
            const isOutOfStock = (p.stock ?? 0) === 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProduct(p)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex flex-col gap-1 ${
                  selectedProduct?.id === p.id
                    ? 'bg-primary-light border border-primary/20 shadow-sm'
                    : isOutOfStock
                      ? 'hover:bg-danger/5 border border-danger/10'
                      : 'hover:bg-border-light border border-transparent'
                }`}
              >
                <span className={`font-medium ${selectedProduct?.id === p.id ? 'text-primary' : 'text-text-secondary'}`}>{p.name}</span>
                <span className="text-xs text-text-muted">{p.category} • {formatPrice(p.price)} {isOutOfStock && '· Out of stock'}</span>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-border mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              <p className="text-sm text-text-muted">No products found</p>
            </div>
          )}
        </div>
      </aside>

      {/* Center Panel: Form */}
      <form onSubmit={submit} className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col h-[750px]">
        {selectedProduct && (selectedProduct.stock ?? 0) === 0 && (
          <div className="flex items-center gap-2 rounded-none border-b border-danger/20 bg-danger/5 px-6 py-3 text-sm text-danger">
            <span className="text-base">⚠️</span>
            <span className="font-medium">This product is out of stock.</span>
            <span className="text-danger/70 text-xs">Update the stock quantity above to make it available again.</span>
          </div>
        )}
        <div className="p-6 border-b border-border-light flex justify-between items-center bg-surface sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-sm text-text-muted mt-1">Configure product details and media.</p>
          </div>
          {selectedProduct && (
            <div className="flex gap-2">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 bg-danger-light px-3 py-1.5 rounded-xl border border-danger/20">
                  <span className="text-sm font-medium text-danger mr-2">Are you sure?</span>
                  <button type="button" onClick={handleDelete} className="text-sm font-semibold text-white bg-danger rounded-lg px-3 py-1.5 hover:bg-danger/90 transition-colors shadow-sm">Delete</button>
                  <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-sm font-medium text-text-secondary hover:text-foreground px-2 py-1.5">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="p-2 text-text-muted hover:text-danger hover:bg-danger-light rounded-xl transition-colors" title="Delete Product">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-surface-alt/50">
          
          {/* Section: Basic Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Basic Information</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Product Name</label>
                <input required minLength={2} value={fields.name} onChange={(e) => update('name', e.target.value)} className={input} placeholder="e.g. MacBook Pro M3" />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select value={fields.category} onChange={(e) => update('category', e.target.value)} className={input}>
                  <option value="laptops">Laptops</option>
                  <option value="chairs">Chairs</option>
                  <option value="headphones">Headphones</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Short Description</label>
              <textarea required minLength={5} rows={2} value={fields.description} onChange={(e) => update('description', e.target.value)} className={input} placeholder="A brief hook or summary of the product..." />
            </div>
          </section>

          {/* Section: Pricing & Inventory */}
          <section className="space-y-4 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pricing & Inventory</h3>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Price (MMK)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted sm:text-sm font-medium">MMK</span>
                  <input required min="1" step="1" type="number" value={fields.price} onChange={(e) => update('price', e.target.value)} className={`${input} pl-14`} placeholder="0" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Stock Level</label>
                <input required min="0" type="number" value={fields.stock} onChange={(e) => update('stock', e.target.value)} className={input} placeholder="e.g. 50" />
              </div>
              <div>
                <label className={labelClass}>Highlight Badge</label>
                <select value={fields.badge} onChange={(e) => update('badge', e.target.value)} className={input}>
                  <option value="">None</option>
                  <option value="agent">Agent Choice</option>
                  <option value="trending">Trending</option>
                  <option value="match">Perfect Match</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Media */}
          <section className="space-y-4 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Media</h3>
            <label className={labelClass}>Product Image <span className="text-text-muted font-normal">(optional, max 5 MB)</span></label>
            <div className="mt-2 flex justify-center rounded-xl border border-dashed border-border px-6 py-8 hover:bg-surface-alt transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-border" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
                <div className="mt-4 flex text-sm leading-6 text-text-secondary justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-surface font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-hover">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(e) => chooseImage(e.target.files?.[0] ?? null)} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-text-muted">PNG, JPG, WEBP up to 5MB</p>
                {image && <p className="text-sm text-success mt-2 font-medium">Selected: {image.name}</p>}
              </div>
            </div>
          </section>

          {/* Section: AI Generation */}
          <section className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary"><path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" /><path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13-7.51 4.044a.75.75 0 01-.712 0l-7.51-4.043zM3.265 15.852l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13-7.51 4.044a.75.75 0 01-.712 0l-7.51-4.043z" /></svg>
                AI Enhanced Details
              </h3>
            </div>
            
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !fields.name || !fields.description}
              className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-agent to-primary p-[2px] transition-all hover:scale-[1.01] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none group"
            >
              <div className="relative flex h-full items-center justify-center gap-2 rounded-[10px] bg-surface px-4 py-3 text-sm font-bold text-foreground group-hover:bg-opacity-90 transition-all">
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Generating details...
                  </>
                ) : (
                  <>✨ Auto-generate deep details</>
                )}
              </div>
            </button>
            <p className="text-xs text-text-muted mt-1 text-center">Fills overview, how it works, best for, and limitations using AI.</p>

            {showGenerated && (
              <div className="border border-primary/20 rounded-xl bg-primary-light/50 p-5 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <h4 className="text-sm font-bold text-primary">AI-Generated Content</h4>
                  <button type="button" onClick={() => setShowGenerated(false)} className="text-xs font-medium text-primary hover:text-primary-hover">Hide</button>
                </div>
                <div><label className={labelClass}>Overview</label><textarea rows={3} value={fields.overview} onChange={(e) => update('overview', e.target.value)} className={input} /></div>
                <div><label className={labelClass}>How it works</label><textarea rows={3} value={fields.howItWorks} onChange={(e) => update('howItWorks', e.target.value)} className={input} /></div>
                <div><label className={labelClass}>Best for <span className="font-normal text-text-muted">(comma separated)</span></label><input value={fields.bestFor} onChange={(e) => update('bestFor', e.target.value)} className={input} /></div>
                <div><label className={labelClass}>Limitations <span className="font-normal text-text-muted">(comma separated)</span></label><input value={fields.limitations} onChange={(e) => update('limitations', e.target.value)} className={input} /></div>
              </div>
            )}
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-light bg-surface space-y-3">
          {error && (
            <div className="p-3 bg-danger-light text-danger rounded-xl text-sm border border-danger/20 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mt-0.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-success-light text-success rounded-xl text-sm border border-success/20 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mt-0.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              {message}
            </div>
          )}
          
          <button 
            disabled={saving} 
            className="w-full flex items-center justify-center h-12 rounded-xl bg-primary hover:bg-primary-hover transition-colors text-sm font-bold text-white disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : selectedProduct ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>
      </form>

      {/* Right Panel: Preview */}
      <aside className="rounded-2xl border border-border bg-surface shadow-sm flex flex-col h-[750px] overflow-hidden">
        <div className="p-4 border-b border-border-light bg-surface-alt flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-muted"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <h3 className="font-semibold text-foreground">Live Preview</h3>
        </div>
        
        <div className="p-6 bg-border-light flex-1 flex items-center justify-center overflow-y-auto">
          {/* Card Preview Container */}
          <div className="w-full max-w-sm bg-surface rounded-2xl shadow-xl border border-border overflow-hidden transition-all hover:shadow-2xl">
            {/* Image Area */}
            <div className="relative aspect-square bg-surface-alt border-b border-border-light flex items-center justify-center overflow-hidden">
              {preview ? (
                <div className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-105 duration-500" style={{ backgroundImage: `url(${preview})` }} />
              ) : (
                <div className="text-center text-text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                  <span className="text-sm font-medium">No Image</span>
                </div>
              )}
              
              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {fields.badge && (
                  <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm">
                    {fields.badge === 'agent' ? 'Agent Choice' : fields.badge === 'trending' ? 'Trending' : 'Match'}
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm ${Number(fields.stock) > 0 ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                  {Number(fields.stock) > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{fields.category || 'Category'}</p>
                  <h4 className="font-bold text-foreground text-lg leading-tight line-clamp-2">{fields.name || 'Awesome Product Name'}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-foreground">{fields.price ? formatPrice(Number(fields.price)) : '0 MMK'}</p>
                </div>
              </div>
              
              <p className="text-sm text-text-secondary line-clamp-2 mt-2 leading-relaxed">
                {fields.description || 'This is where your short, catchy product description will appear to attract customers.'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
