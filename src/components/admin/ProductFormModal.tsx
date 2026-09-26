import React, { useMemo, useState } from 'react';
import { Eye, ImagePlus, Plus, Trash2, Copy, X } from 'lucide-react';
import { Product, ProductVariant, Category, Specification } from '../../types';
import { supabaseUploadProductImage } from '../../lib/supabase';
import { useShop } from '../../context/ShopContext';

type Props = {
  product: Partial<Product>;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
};

const inputClass = 'w-full bg-white text-stone-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-600';
const labelClass = 'block text-xs font-bold text-stone-700 mb-1.5';

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export const ProductFormModal: React.FC<Props> = ({ product, categories, onClose, onSaved }) => {
  const { addProduct, updateProduct, products, showToast } = useShop();
  const [form, setForm] = useState<Product>({
    id: product.id || crypto.randomUUID(),
    nameBn: product.nameBn || '',
    nameEn: product.nameEn || '',
    categoryId: product.categoryId || '',
    price: product.price ?? 0,
    stock: product.stock ?? 0,
    imageUrl: product.imageUrl || '',
    descriptionBn: product.descriptionBn || '',
    isFeatured: product.isFeatured ?? false,
    isActive: product.isActive !== false,
    ...product,
    categoryIds: product.categoryIds || [],
    tags: product.tags || [],
    galleryUrls: product.galleryUrls || [],
    specifications: product.specifications || [],
    variants: product.variants || [],
    relatedProductIds: product.relatedProductIds || [],
    seoKeywords: product.seoKeywords || [],
    lowStockThreshold: product.lowStockThreshold ?? 3,
    minOrderQty: product.minOrderQty ?? 1,
    whatsappEnabled: product.whatsappEnabled !== false,
  });
  const [tagInput, setTagInput] = useState((product.tags || []).join(', '));
  const [keywordInput, setKeywordInput] = useState((product.seoKeywords || []).join(', '));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const isNewProduct = !product.id;

  const discount = useMemo(() => {
    const regular = Number(form.regularPrice || 0);
    const sale = Number(form.price || 0);
    return regular > sale && regular > 0 ? Math.round(((regular - sale) / regular) * 100) : 0;
  }, [form.regularPrice, form.price]);

  const set = <K extends keyof Product>(key: K, value: Product[K]) => setForm((p) => ({ ...p, [key]: value }));

  const normalizeList = (value: string) => Array.from(new Set(value.split(',').map((v) => v.trim()).filter(Boolean)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameBn.trim()) return showToast('বাংলা পণ্যের নাম দিন।');
    if (!form.categoryId) return showToast('একটি প্রাইমারি ক্যাটাগরি নির্বাচন করুন।');
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) return showToast('সঠিক বিক্রয় মূল্য দিন।');
    if (Number(form.regularPrice || 0) < 0) return showToast('সঠিক রেগুলার মূল্য দিন।');
    if (Number(form.minOrderQty || 1) < 1) return showToast('Minimum order quantity কমপক্ষে ১ হতে হবে।');
    if (form.maxOrderQty && Number(form.maxOrderQty) < Number(form.minOrderQty || 1)) return showToast('Maximum order quantity, minimum-এর চেয়ে কম হতে পারবে না।');
    if (form.sku && products.some((p) => p.id !== form.id && p.sku?.trim().toLowerCase() === form.sku?.trim().toLowerCase())) return showToast('এই SKU ইতিমধ্যে ব্যবহৃত হয়েছে।');

    const finalForm = { ...form, tags: normalizeList(tagInput), seoKeywords: normalizeList(keywordInput), slug: form.slug?.trim() || slugify(form.nameEn || form.nameBn) };
    // Existing product stock is changed only from Inventory so every stock change
    // goes through the stock-history workflow. New products may set their opening stock here.
    const savePayload = isNewProduct
      ? finalForm
      : { ...finalForm, stock: product.stock ?? form.stock };
    setSaving(true);
    try {
      const ok = isNewProduct
        ? await addProduct(savePayload as Omit<Product, 'id'>)
        : await updateProduct(product.id as string, savePayload);
      if (ok) onSaved();
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    const copy: Omit<Product, 'id'> = {
      ...form,
      nameBn: form.nameBn + ' (Copy)',
      nameEn: form.nameEn ? form.nameEn + ' Copy' : '',
      slug: undefined,
      sku: undefined,
      isDraft: true,
      isActive: false,
    };
    setSaving(true);
    try {
      const ok = await addProduct(copy);
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File, gallery = false) => {
    if (!file.type.startsWith('image/')) return showToast('শুধু image file আপলোড করুন।');
    if (file.size > 5 * 1024 * 1024) return showToast('ছবির সর্বোচ্চ সাইজ ৫ MB।');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const url = await supabaseUploadProductImage(file, `${crypto.randomUUID()}.${ext}`);
      if (gallery) set('galleryUrls', [...(form.galleryUrls || []), url]);
      else set('imageUrl', url);
      showToast('ছবি সফলভাবে আপলোড হয়েছে।');
    } catch (error) {
      console.error(error);
      showToast('ছবি আপলোড করা যায়নি।');
    } finally {
      setUploading(false);
    }
  };

  const updateSpec = (index: number, patch: Partial<Specification>) => set('specifications', (form.specifications || []).map((s, i) => i === index ? { ...s, ...patch } : s));
  const updateVariant = (index: number, patch: Partial<ProductVariant>) => set('variants', (form.variants || []).map((v, i) => i === index ? { ...v, ...patch } : v));

  if (preview) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 bg-white/95 backdrop-blur p-4 border-b flex justify-between">
            <h3 className="font-black text-stone-900">Customer Preview</h3>
            <button type="button" onClick={() => setPreview(false)} className="p-2 text-stone-500"><X /></button>
          </div>
          <div className="p-5">
            <img src={form.imageUrl} alt={form.nameBn} className="w-full aspect-square max-h-80 object-contain bg-stone-50 rounded-2xl" />
            <div className="mt-4 text-xs text-stone-500">{form.brand || 'Halal Shop'} · {form.categoryId ? categories.find(c => c.id === form.categoryId)?.nameBn : ''}</div>
            <h2 className="text-xl font-black mt-1">{form.nameBn}</h2>
            <p className="text-sm text-stone-600 mt-2">{form.shortDescription || form.descriptionBn}</p>
            <div className="mt-4 flex items-center gap-3"><span className="text-2xl font-black text-emerald-800">৳{Number(form.price || 0).toLocaleString('bn-BD')}</span>{discount > 0 && <><del className="text-stone-400">৳{Number(form.regularPrice).toLocaleString('bn-BD')}</del><span className="text-xs font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded-full">{discount}% OFF</span></>}</div>
            {(form.specifications || []).length > 0 && <div className="mt-5 border rounded-2xl overflow-hidden">{form.specifications.map((s, i) => <div key={i} className="flex justify-between gap-3 p-3 text-xs border-b last:border-0"><span className="text-stone-500">{s.label}</span><strong>{s.value}</strong></div>)}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur p-4 sm:p-5 border-b flex items-center justify-between gap-3">
          <div><h3 className="text-lg font-black text-stone-900">{form.id ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য'}</h3><p className="text-[11px] text-stone-500">সব গুরুত্বপূর্ণ product data এক জায়গা থেকে পরিচালনা করুন</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreview(true)} className="px-3 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5"><Eye className="w-4 h-4"/> Preview</button>
            {form.id && <button type="button" onClick={() => void duplicate()} disabled={saving} className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold flex items-center gap-1.5"><Copy className="w-4 h-4"/> Duplicate</button>}
            <button type="button" onClick={onClose} className="p-2 text-stone-400"><X /></button>
          </div>
        </div>

        <form onSubmit={save} className="p-4 sm:p-6 space-y-6">
          <section><h4 className="font-black text-sm mb-3">১. Basic Information</h4><div className="grid sm:grid-cols-2 gap-3">
            <div><label className={labelClass}>পণ্যের নাম (বাংলা) *</label><input className={inputClass} value={form.nameBn} onChange={e=>set('nameBn',e.target.value)} required/></div>
            <div><label className={labelClass}>পণ্যের নাম (English)</label><input className={inputClass} value={form.nameEn} onChange={e=>set('nameEn',e.target.value)}/></div>
            <div><label className={labelClass}>SKU</label><input className={inputClass} value={form.sku || ''} onChange={e=>set('sku',e.target.value.toUpperCase())} placeholder="HS-001"/></div>
            <div><label className={labelClass}>Slug</label><div className="flex gap-2"><input className={inputClass} value={form.slug || ''} onChange={e=>set('slug',e.target.value)}/><button type="button" onClick={()=>set('slug',slugify(form.nameEn||form.nameBn))} className="px-3 rounded-xl bg-stone-100 text-xs font-bold">Auto</button></div></div>
            <div><label className={labelClass}>Primary Category *</label><select className={inputClass} value={form.categoryId} onChange={e=>set('categoryId',e.target.value)} required><option value="">ক্যাটাগরি নির্বাচন</option>{categories.map(c=><option key={c.id} value={c.id}>{c.nameBn}{c.isActive?'':' (Inactive)'}</option>)}</select></div>
            <div><label className={labelClass}>Secondary Categories</label><select multiple className={inputClass+' min-h-24'} value={form.categoryIds || []} onChange={e=>set('categoryIds',Array.from(e.target.selectedOptions).map(o=>o.value))}>{categories.filter(c=>c.id!==form.categoryId).map(c=><option key={c.id} value={c.id}>{c.nameBn}</option>)}</select></div>
            <div><label className={labelClass}>Brand</label><input className={inputClass} value={form.brand||''} onChange={e=>set('brand',e.target.value)}/></div>
            <div><label className={labelClass}>Manufacturer</label><input className={inputClass} value={form.manufacturer||''} onChange={e=>set('manufacturer',e.target.value)}/></div>
            <div><label className={labelClass}>Origin / Country</label><input className={inputClass} value={form.originCountry||''} onChange={e=>set('originCountry',e.target.value)}/></div>
            <div><label className={labelClass}>Tags (comma separated)</label><input className={inputClass} value={tagInput} onChange={e=>setTagInput(e.target.value)} placeholder="organic, honey, halal"/></div>
          </div></section>

          <section><h4 className="font-black text-sm mb-3">২. Pricing & Inventory</h4><div className="grid sm:grid-cols-3 gap-3">
            <div><label className={labelClass}>Selling Price (৳) *</label><input type="number" min="0" step="0.01" className={inputClass} value={form.price} onChange={e=>set('price',Number(e.target.value))}/></div>
            <div><label className={labelClass}>Regular Price (৳)</label><input type="number" min="0" step="0.01" className={inputClass} value={form.regularPrice ?? ''} onChange={e=>set('regularPrice',e.target.value===''?undefined:Number(e.target.value))}/></div>
            <div><label className={labelClass}>Discount</label><div className="h-[42px] flex items-center px-3 rounded-xl bg-emerald-50 text-emerald-800 font-black text-sm">{discount ? discount+'% OFF' : 'No discount'}</div></div>
            <div>
              <label className={labelClass}>Stock {isNewProduct ? '(Opening Stock)' : '(Inventory থেকে পরিবর্তন করুন)'}</label>
              <input
                type="number"
                min="0"
                className={inputClass + (isNewProduct ? '' : ' bg-stone-100 text-stone-500 cursor-not-allowed')}
                value={form.stock}
                disabled={!isNewProduct}
                onChange={e=>set('stock',Math.max(0,Number(e.target.value)))}
              />
            </div>
            <div><label className={labelClass}>Low Stock Alert</label><input type="number" min="0" className={inputClass} value={form.lowStockThreshold ?? 3} onChange={e=>set('lowStockThreshold',Number(e.target.value))}/></div>
            <div><label className={labelClass}>Unit</label><input className={inputClass} value={form.unit||''} onChange={e=>set('unit',e.target.value)} placeholder="টি / kg / box"/></div>
            <div><label className={labelClass}>Weight</label><input type="number" min="0" step="0.01" className={inputClass} value={form.weight ?? ''} onChange={e=>set('weight',e.target.value===''?undefined:Number(e.target.value))}/></div>
            <div><label className={labelClass}>Dimensions</label><input className={inputClass} value={form.dimensions||''} onChange={e=>set('dimensions',e.target.value)} placeholder="10 × 5 × 3 cm"/></div>
            <div><label className={labelClass}>Min Order Qty</label><input type="number" min="1" className={inputClass} value={form.minOrderQty ?? 1} onChange={e=>set('minOrderQty',Number(e.target.value))}/></div>
            <div><label className={labelClass}>Max Order Qty</label><input type="number" min="1" className={inputClass} value={form.maxOrderQty ?? ''} onChange={e=>set('maxOrderQty',e.target.value===''?undefined:Number(e.target.value))}/></div>
          </div></section>

          <section><h4 className="font-black text-sm mb-3">৩. Images</h4><div className="grid sm:grid-cols-2 gap-4">
            <div className="border rounded-2xl p-3"><label className={labelClass}>Main Image</label>{form.imageUrl ? <img src={form.imageUrl} className="w-full h-48 object-contain bg-stone-50 rounded-xl mb-2" alt=""/>:<div className="h-48 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 text-xs">No image</div>}<input className={inputClass} value={form.imageUrl||''} onChange={e=>set('imageUrl',e.target.value)} placeholder="Image URL"/><label className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 text-xs font-bold cursor-pointer"><ImagePlus className="w-4 h-4"/>{uploading?'Uploading...':'Upload image'}<input type="file" accept="image/*" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file)}}/></label></div>
            <div className="border rounded-2xl p-3"><label className={labelClass}>Gallery</label><div className="grid grid-cols-3 gap-2 mb-2">{(form.galleryUrls||[]).map((url,i)=><div key={url+i} className="relative"><img src={url} className="w-full aspect-square object-cover rounded-lg" alt=""/><button type="button" onClick={()=>set('galleryUrls',(form.galleryUrls||[]).filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 bg-white/90 rounded p-1 text-rose-600"><Trash2 className="w-3 h-3"/></button></div>)}</div><input className={inputClass} placeholder="Gallery image URL" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();const v=e.currentTarget.value.trim();if(v){set('galleryUrls',[...(form.galleryUrls||[]),v]);e.currentTarget.value=''}}}}/><label className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 text-xs font-bold cursor-pointer"><ImagePlus className="w-4 h-4"/>Upload gallery<input type="file" accept="image/*" multiple className="hidden" onChange={e=>{Array.from(e.target.files||[]).forEach(file=>void upload(file,true))}}/></label></div>
          </div></section>

          <section><h4 className="font-black text-sm mb-3">৪. Description & Specifications</h4><div className="grid gap-3">
            <div><label className={labelClass}>Short Description</label><textarea className={inputClass} rows={2} value={form.shortDescription||''} onChange={e=>set('shortDescription',e.target.value)}/></div>
            <div><label className={labelClass}>বাংলা বিস্তারিত Description</label><textarea className={inputClass} rows={4} value={form.descriptionBn||''} onChange={e=>set('descriptionBn',e.target.value)}/></div>
            <div><label className={labelClass}>English Description</label><textarea className={inputClass} rows={4} value={form.descriptionEn||''} onChange={e=>set('descriptionEn',e.target.value)}/></div>
            <div className="border rounded-2xl p-3"><div className="flex justify-between mb-2"><label className={labelClass}>Specifications</label><button type="button" onClick={()=>set('specifications',[...(form.specifications||[]),{label:'',value:''}])} className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Add</button></div>{(form.specifications||[]).map((s,i)=><div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2"><input className={inputClass} placeholder="Label" value={s.label} onChange={e=>updateSpec(i,{label:e.target.value})}/><input className={inputClass} placeholder="Value" value={s.value} onChange={e=>updateSpec(i,{value:e.target.value})}/><button type="button" onClick={()=>set('specifications',(form.specifications||[]).filter((_,idx)=>idx!==i))} className="px-2 text-rose-600"><Trash2 className="w-4 h-4"/></button></div>)}</div>
          </div></section>

          <section><h4 className="font-black text-sm mb-3">৫. Variants</h4><div className="border rounded-2xl p-3"><div className="flex justify-between mb-2"><span className="text-xs text-stone-500">যেমন: 250g, 500g, 1kg অথবা S/M/L</span><button type="button" onClick={()=>set('variants',[...(form.variants||[]),{id:crypto.randomUUID(),name:'',sku:'',price:Number(form.price||0),regularPrice:form.regularPrice,stock:0,unit:form.unit}])} className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Add Variant</button></div>{(form.variants||[]).map((v,i)=><div key={v.id} className="grid sm:grid-cols-6 gap-2 mb-2"><input className={inputClass+' sm:col-span-2'} placeholder="Variant" value={v.name} onChange={e=>updateVariant(i,{name:e.target.value})}/><input className={inputClass} placeholder="SKU" value={v.sku||''} onChange={e=>updateVariant(i,{sku:e.target.value})}/><input type="number" className={inputClass} placeholder="Price" value={v.price} onChange={e=>updateVariant(i,{price:Number(e.target.value)})}/><input type="number" className={inputClass} placeholder="Stock" value={v.stock} onChange={e=>updateVariant(i,{stock:Number(e.target.value)})}/><button type="button" onClick={()=>set('variants',(form.variants||[]).filter((_,idx)=>idx!==i))} className="px-2 text-rose-600"><Trash2 className="w-4 h-4"/></button></div>)}</div></section>

          <section><h4 className="font-black text-sm mb-3">৬. Related Products & SEO</h4><div className="grid sm:grid-cols-2 gap-3">
            <div><label className={labelClass}>Related Products</label><select multiple className={inputClass+' min-h-28'} value={form.relatedProductIds||[]} onChange={e=>set('relatedProductIds',Array.from(e.target.selectedOptions).map(o=>o.value))}>{products.filter(p=>p.id!==form.id).map(p=><option key={p.id} value={p.id}>{p.nameBn}</option>)}</select></div>
            <div className="space-y-3"><div><label className={labelClass}>SEO Title</label><input className={inputClass} value={form.seoTitle||''} onChange={e=>set('seoTitle',e.target.value)}/></div><div><label className={labelClass}>Meta Description</label><textarea className={inputClass} rows={2} value={form.seoDescription||''} onChange={e=>set('seoDescription',e.target.value)}/></div><div><label className={labelClass}>SEO Keywords (comma separated)</label><input className={inputClass} value={keywordInput} onChange={e=>setKeywordInput(e.target.value)}/></div></div>
          </div></section>

          <section><h4 className="font-black text-sm mb-3">৭. Publishing & Marketing</h4><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([['isActive','সক্রিয়'],['isDraft','Draft'],['isFeatured','Featured'],['isPopular','Popular'],['isNewArrival','New Arrival'],['isBestSeller','Best Seller'],['isSpecialOffer','Special Offer'],['isLimitedStock','Limited Stock'],['whatsappEnabled','WhatsApp Order']] as const).map(([key,text])=><label key={key} className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border text-xs font-semibold cursor-pointer"><input type="checkbox" checked={Boolean(form[key])} onChange={e=>set(key,e.target.checked)} className="w-4 h-4 accent-emerald-700"/>{text}</label>)}
          </div></section>

          <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving||uploading} className="px-4 py-2.5 rounded-xl border text-xs font-bold">বাতিল</button>
            <button type="submit" disabled={saving||uploading} className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold">{saving?'সংরক্ষণ হচ্ছে...':form.isDraft?'Draft সংরক্ষণ করুন':'Publish / Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
