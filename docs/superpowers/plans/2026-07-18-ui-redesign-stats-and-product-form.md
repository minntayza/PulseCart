# UI Redesign: StatsRow + ProductAdminPanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Agent Uptime/Customer Satisfaction stats with Active Agents/Feedback Signals, and simplify the product admin form with AI auto-generation of detail fields via Anthropic API.

**Architecture:** Backend gets a new `/products/generate-details` endpoint that calls Anthropic API to generate overview, howItWorks, bestFor, and limitations from name+category+description. Frontend StatsRow gets colored accent dots instead of emoji icons. ProductAdminPanel form is simplified to 7 basic fields + 4 AI-generated editable fields.

**Tech Stack:** Next.js 16, Tailwind CSS 4, FastAPI, Pydantic, Anthropic Python SDK, Supabase (optional)

## Global Constraints

- Tailwind CSS 4 with `@theme inline` — use existing color tokens: `text-foreground`, `text-text-muted`, `text-text-secondary`, `bg-surface`, `bg-surface-alt`, `border-border`, `text-success`, `text-accent`, `text-agent`, `text-primary`, `text-danger`
- Backend uses `manager_user()` dependency from `backend/app/auth.py` for manager-only endpoints
- Frontend uses `apiRequest()` from `frontend/src/services/api.ts` for all API calls
- Frontend auth token comes from `useAuth()` hook → `accessToken`
- No database schema changes required

---

### Task 1: Backend — Add Pydantic models for generate-details

**Files:**
- Modify: `backend/app/models/schemas.py:129` (append after `FeedbackInsights`)

**Interfaces:**
- Consumes: nothing
- Produces: `GenerateDetailsRequest`, `GenerateDetailsResponse` (used by Task 2)

- [ ] **Step 1: Add the two new models**

Append to `backend/app/models/schemas.py` after the `FeedbackInsights` class:

```python
class GenerateDetailsRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: Category
    description: str = Field(min_length=5, max_length=500)


class GenerateDetailsResponse(BaseModel):
    overview: str
    howItWorks: str
    bestFor: list[str]
    limitations: list[str]
```

- [ ] **Step 2: Verify import works**

Run: `cd /Users/mintayza/Desktop/PulseCart/backend && python -c "from app.models.schemas import GenerateDetailsRequest, GenerateDetailsResponse; print('OK')"`

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/mintayza/Desktop/PulseCart
git add backend/app/models/schemas.py
git commit -m "feat: add GenerateDetailsRequest/Response Pydantic models"
```

---

### Task 2: Backend — Add /products/generate-details endpoint

**Files:**
- Modify: `backend/app/routes/products.py` (add import + new route)

**Interfaces:**
- Consumes: `GenerateDetailsRequest`, `GenerateDetailsResponse` from Task 1, `manager_user` from `backend/app/auth.py`, `get_settings` from `backend/app/config.py`
- Produces: `POST /products/generate-details` endpoint (used by Task 4)

- [ ] **Step 1: Add imports and endpoint**

Replace the entire content of `backend/app/routes/products.py` with:

```python
import json
from fastapi import APIRouter, Depends, HTTPException
from ..auth import manager_user
from ..config import Settings, get_settings
from ..models.schemas import AuthUser, GenerateDetailsRequest, GenerateDetailsResponse, Product
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/products", tags=["products"])

DETAILS_SYSTEM_PROMPT = """You are a product copywriter for an e-commerce store called PulseCart.
Given a product name, category, and short description, generate the following fields as JSON:
- overview: A 2-3 sentence product overview suitable for a product detail page.
- howItWorks: A 2-3 sentence explanation of how the product works or what it does.
- bestFor: An array of 3-4 strings describing who or what this product is best for.
- limitations: An array of 2-3 strings describing limitations or considerations.

Return ONLY valid JSON with these 4 keys. No markdown, no explanation."""


@router.get("", response_model=list[Product])
def list_products(repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    try:
        return repo.list_products()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Product catalog could not be loaded: {str(exc)[:300]}") from exc


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: str, repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    try:
        return repo.get_product(product_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Product could not be loaded: {str(exc)[:300]}") from exc


@router.post("/generate-details", response_model=GenerateDetailsResponse)
def generate_product_details(
    body: GenerateDetailsRequest,
    settings: Settings = Depends(get_settings),
    _: AuthUser = Depends(manager_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="Anthropic API key is not configured")

    try:
        import anthropic
    except ImportError:
        raise HTTPException(status_code=500, detail="anthropic package is not installed")

    try:
        client_kwargs: dict = {"api_key": settings.anthropic_api_key}
        if settings.anthropic_base_url:
            client_kwargs["base_url"] = settings.anthropic_base_url

        client = anthropic.Anthropic(**client_kwargs)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=DETAILS_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Product name: {body.name}\nCategory: {body.category}\nDescription: {body.description}",
                }
            ],
        )

        text = message.content[0].text.strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return GenerateDetailsResponse(
            overview=data.get("overview", ""),
            howItWorks=data.get("howItWorks", ""),
            bestFor=data.get("bestFor", []),
            limitations=data.get("limitations", []),
        )
    except HTTPException:
        raise
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON. Please try again.") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(exc)[:300]}") from exc
```

- [ ] **Step 2: Verify server starts**

Run: `cd /Users/mintayza/Desktop/PulseCart/backend && python -c "from app.routes.products import router; print('OK')"`

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/mintayza/Desktop/PulseCart
git add backend/app/routes/products.py
git commit -m "feat: add POST /products/generate-details endpoint"
```

---

### Task 3: Backend — Make overview/howItWorks optional in manager_products

**Files:**
- Modify: `backend/app/routes/manager_products.py:81-82` (create_product) and `backend/app/routes/manager_products.py:129-130` (update_product)

**Interfaces:**
- Consumes: nothing new
- Produces: optional overview/howItWorks fields in create/update (used by Task 5)

The current `create_product` and `update_product` endpoints require `overview` and `how_it_works` with `min_length=10`. These need to become optional so managers can save products without generating details first.

- [ ] **Step 1: Make overview and how_it_works optional in create_product**

In `backend/app/routes/manager_products.py`, find the `create_product` function (line 74). Change these two lines:

```python
    overview: str = Form(min_length=10, max_length=3000),
    how_it_works: str = Form(min_length=10, max_length=3000),
```

To:

```python
    overview: str = Form(default="", max_length=3000),
    how_it_works: str = Form(default="", max_length=3000),
```

- [ ] **Step 2: Make overview and how_it_works optional in update_product**

In the same file, find the `update_product` function (line 121). Change these two lines:

```python
    overview: str = Form(min_length=10, max_length=3000),
    how_it_works: str = Form(min_length=10, max_length=3000),
```

To:

```python
    overview: str = Form(default="", max_length=3000),
    how_it_works: str = Form(default="", max_length=3000),
```

- [ ] **Step 3: Verify server starts**

Run: `cd /Users/mintayza/Desktop/PulseCart/backend && python -c "from app.routes.manager_products import router; print('OK')"`

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
cd /Users/mintayza/Desktop/PulseCart
git add backend/app/routes/manager_products.py
git commit -m "feat: make overview/howItWorks optional in product create/update"
```

---

### Task 4: Frontend — Add TypeScript types and service function

**Files:**
- Modify: `frontend/src/types/index.ts:136` (append after `FeedbackInsights`)
- Modify: `frontend/src/services/managerProductService.ts:17` (append)

**Interfaces:**
- Consumes: nothing
- Produces: `GenerateDetailsRequest`, `GenerateDetailsResponse` types, `generateProductDetails()` function (used by Task 5)

- [ ] **Step 1: Add TypeScript types**

Append to `frontend/src/types/index.ts` after the `FeedbackInsights` interface:

```typescript
export interface GenerateDetailsRequest {
  name: string;
  category: string;
  description: string;
}

export interface GenerateDetailsResponse {
  overview: string;
  howItWorks: string;
  bestFor: string[];
  limitations: string[];
}
```

- [ ] **Step 2: Add service function**

Append to `frontend/src/services/managerProductService.ts`:

```typescript
import { GenerateDetailsRequest, GenerateDetailsResponse } from '@/types';

export async function generateProductDetails(data: GenerateDetailsRequest, accessToken: string): Promise<GenerateDetailsResponse> {
  return apiRequest<GenerateDetailsResponse>('/products/generate-details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}
```

Note: remove the duplicate import line — the existing file already imports from `@/types`. Just add `GenerateDetailsRequest, GenerateDetailsResponse` to the existing import.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/mintayza/Desktop/PulseCart/frontend && npx tsc --noEmit 2>&1 | head -20`

Expected: no errors related to the new types

- [ ] **Step 4: Commit**

```bash
cd /Users/mintayza/Desktop/PulseCart
git add frontend/src/types/index.ts frontend/src/services/managerProductService.ts
git commit -m "feat: add GenerateDetails types and service function"
```

---

### Task 5: Frontend — Rewrite StatsRow with colored dots

**Files:**
- Modify: `frontend/src/components/dashboard/StatsRow.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: updated StatsRow component (used by manager page)

- [ ] **Step 1: Rewrite StatsRow**

Replace the entire content of `frontend/src/components/dashboard/StatsRow.tsx` with:

```tsx
'use client';

const stats = [
  { label: 'Total Revenue', value: '$24,580', change: '+12.5%', dot: 'bg-success' },
  { label: 'Pending Orders', value: '7', change: '3 need approval', dot: 'bg-accent' },
  { label: 'Active Agents', value: '2/3', change: 'All systems nominal', dot: 'bg-agent' },
  { label: 'Feedback Signals', value: '12 total', change: '3 high severity', dot: 'bg-primary' },
];

export default function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 lg:gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-block h-2 w-2 rounded-full ${stat.dot}`} />
            <span className="text-xs text-text-muted">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          <div className="text-xs mt-1 text-text-secondary">{stat.change}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/mintayza/Desktop/PulseCart/frontend && npm run build 2>&1 | tail -5`

Expected: `Build completed` or similar success message

- [ ] **Step 3: Commit**

```bash
cd /Users/mintayza/Desktop/PulseCart
git add frontend/src/components/dashboard/StatsRow.tsx
git commit -m "feat: replace StatsRow emoji icons with colored accent dots"
```

---

### Task 6: Frontend — Rewrite ProductAdminPanel with AI generation

**Files:**
- Modify: `frontend/src/components/dashboard/ProductAdminPanel.tsx`

**Interfaces:**
- Consumes: `GenerateDetailsRequest`, `GenerateDetailsResponse` from Task 4, `generateProductDetails()` from Task 4
- Produces: updated ProductAdminPanel with simplified form + AI generation

- [ ] **Step 1: Rewrite ProductAdminPanel**

Replace the entire content of `frontend/src/components/dashboard/ProductAdminPanel.tsx` with:

```tsx
'use client';
import { FormEvent, useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createManagerProduct, updateManagerProduct, deleteManagerProduct, generateProductDetails } from '@/services/managerProductService';
import { getProducts } from '@/services/productService';
import { Product, formatPrice } from '@/types';

const initial = { name: '', category: 'laptops', price: '', stock: '', description: '', warranty: '1-year limited warranty' };
const initialGenerated = { overview: '', howItWorks: '', bestFor: '', limitations: '' };

export default function ProductAdminPanel() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [fields, setFields] = useState(initial);
  const [generated, setGenerated] = useState(initialGenerated);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [showGenerated, setShowGenerated] = useState(false);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const update = (name: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [name]: value }));
  const updateGenerated = (name: keyof typeof generated, value: string) => setGenerated((current) => ({ ...current, [name]: value }));
  const chooseImage = (file: File | null) => { setImage(file); setPreview(''); if (file) { const reader = new FileReader(); reader.onload = () => setPreview(String(reader.result)); reader.readAsDataURL(file); } };

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try { const data = await getProducts(); setProducts(data); }
    catch (err) { console.error('Failed to load products', err); }
  };

  const selectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    setError(''); setMessage(''); setImage(null); setShowDeleteConfirm(false);
    setGenerateError(''); setShowGenerated(false);
    if (product) {
      setFields({
        name: product.name, category: product.category,
        price: product.price.toString(), stock: (product.stock ?? 0).toString(),
        description: product.description, warranty: product.warranty || '1-year limited warranty',
      });
      setGenerated({
        overview: product.overview || '',
        howItWorks: product.howItWorks || '',
        bestFor: (product.bestFor || []).join(', '),
        limitations: (product.limitations || []).join(', '),
      });
      // Show generated fields if product has them
      const hasGenerated = product.overview || product.howItWorks || (product.bestFor && product.bestFor.length > 0);
      setShowGenerated(hasGenerated);
      setPreview(product.imageUrl || '');
    } else {
      setFields(initial); setGenerated(initialGenerated); setPreview('');
    }
  };

  const handleGenerate = async () => {
    if (!accessToken) return setGenerateError('Manager session is missing.');
    setGenerating(true); setGenerateError('');
    try {
      const result = await generateProductDetails(
        { name: fields.name, category: fields.category, description: fields.description },
        accessToken,
      );
      setGenerated({
        overview: result.overview,
        howItWorks: result.howItWorks,
        bestFor: result.bestFor.join(', '),
        limitations: result.limitations.join(', '),
      });
      setShowGenerated(true);
    } catch (reason) {
      setGenerateError(reason instanceof Error ? reason.message : 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = fields.name.trim().length >= 2 && fields.description.trim().length >= 5;

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!accessToken) return setError('Manager session is missing. Sign in again.');
    const form = new FormData();
    form.set('name', fields.name); form.set('category', fields.category);
    form.set('price', fields.price); form.set('stock', fields.stock);
    form.set('description', fields.description);
    form.set('overview', generated.overview);
    form.set('how_it_works', generated.howItWorks);
    form.set('best_for', JSON.stringify(generated.bestFor.split(',').map((v) => v.trim()).filter(Boolean)));
    form.set('limitations', JSON.stringify(generated.limitations.split(',').map((v) => v.trim()).filter(Boolean)));
    form.set('specifications', '[]');
    form.set('delivery_estimate', '');
    form.set('warranty', fields.warranty);
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
        setFields(initial); setGenerated(initialGenerated); setImage(null); setPreview(''); setShowGenerated(false);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Product could not be saved.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedProduct || !accessToken) return;
    setSaving(true);
    try {
      await deleteManagerProduct(selectedProduct.id, accessToken);
      setMessage(`${selectedProduct.name} deleted.`);
      setProducts(products.filter((p) => p.id !== selectedProduct.id));
      selectProduct(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Product could not be deleted.'); }
    finally { setSaving(false); setShowDeleteConfirm(false); }
  };

  const input = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10';
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter(
    (p) => (selectedCategory === 'all' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr_.7fr]">
      {/* Sidebar list */}
      <aside className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col max-h-[700px]">
        <div className="p-4 border-b border-border bg-surface-alt space-y-3">
          <button type="button" onClick={() => selectProduct(null)} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold">+ Add New Product</button>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 text-xs whitespace-nowrap rounded-full border transition-colors ${selectedCategory === c ? 'bg-primary text-white border-primary' : 'bg-background border-border text-foreground hover:bg-surface'}`}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <input type="search" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary" />
        </div>
        <div className="overflow-y-auto p-2 space-y-1">
          {filteredProducts.map((p) => (
            <button key={p.id} type="button" onClick={() => selectProduct(p)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProduct?.id === p.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-alt'}`}>
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
        <label className="block text-sm">Warranty<input value={fields.warranty} onChange={(e) => update('warranty', e.target.value)} className={input} /></label>

        {/* AI Generate button */}
        {!showGenerated && (
          <button type="button" onClick={handleGenerate} disabled={!canGenerate || generating}
            className="w-full rounded-xl border-2 border-dashed border-agent/30 bg-agent-light px-4 py-3 text-sm font-bold text-agent disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:border-agent/50">
            {generating ? 'Generating details…' : '✨ Generate Details with AI'}
          </button>
        )}
        {generateError && <p className="text-sm text-danger" role="alert">{generateError}</p>}

        {/* Generated fields (editable) */}
        {showGenerated && (
          <div className="space-y-4 rounded-xl border border-agent/20 bg-agent-light/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-agent">AI-Generated Details</h3>
              <button type="button" onClick={() => { setShowGenerated(false); setGenerated(initialGenerated); }}
                className="text-xs text-text-muted hover:text-foreground">Clear</button>
            </div>
            <label className="block text-sm">Overview<textarea rows={3} value={generated.overview} onChange={(e) => updateGenerated('overview', e.target.value)} className={input} /></label>
            <label className="block text-sm">How it works<textarea rows={3} value={generated.howItWorks} onChange={(e) => updateGenerated('howItWorks', e.target.value)} className={input} /></label>
            <label className="block text-sm">Best for <span className="text-text-muted">(comma separated)</span><input value={generated.bestFor} onChange={(e) => updateGenerated('bestFor', e.target.value)} className={input} /></label>
            <label className="block text-sm">Limitations <span className="text-text-muted">(comma separated)</span><input value={generated.limitations} onChange={(e) => updateGenerated('limitations', e.target.value)} className={input} /></label>
          </div>
        )}

        {/* Image */}
        <label className="block text-sm">Product image <span className="text-text-muted">(optional, max 5 MB)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => chooseImage(e.target.files?.[0] ?? null)}
            className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-primary`} />
        </label>

        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        {message && <p className="text-sm text-success" role="status">{message}</p>}
        <button disabled={saving} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
          {saving ? 'Saving product…' : (selectedProduct ? 'Save changes' : 'Add product')}
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
        {generated.overview && <p className="mt-3 text-xs text-text-secondary leading-5">{generated.overview}</p>}
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/mintayza/Desktop/PulseCart/frontend && npm run build 2>&1 | tail -10`

Expected: `Build completed` or similar success message, no TypeScript errors

- [ ] **Step 3: Commit**

```bash
cd /Users/mintayza/Desktop/PulseCart
git add frontend/src/components/dashboard/ProductAdminPanel.tsx
git commit -m "feat: simplify ProductAdminPanel with AI generation flow"
```

---

### Task 7: Final verification and cleanup

**Files:**
- No new files

- [ ] **Step 1: Run full frontend build**

Run: `cd /Users/mintayza/Desktop/PulseCart/frontend && npm run build`

Expected: Build succeeds with no errors

- [ ] **Step 2: Run backend tests**

Run: `cd /Users/mintayza/Desktop/PulseCart/backend && pytest -q`

Expected: All tests pass

- [ ] **Step 3: Verify lint**

Run: `cd /Users/mintayza/Desktop/PulseCart/frontend && npm run lint`

Expected: No errors

- [ ] **Step 4: Commit any remaining changes**

```bash
cd /Users/mintayza/Desktop/PulseCart
git add -A
git commit -m "chore: final verification for UI redesign"
```
