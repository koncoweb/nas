# Quick Styling Reference

## 🎨 Warna Utama

### Primary (Biru Utama)
```
bg-primary-600    #2563eb  - Background button, highlight
hover:bg-primary-700        - Hover state
text-primary-600            - Text link, icon
border-primary-600          - Border
```

### Neutral (Abu-abu)
```
bg-neutral-50     #fafafa  - Background page
bg-neutral-100               - Background card hover
text-neutral-900  #171717  - Text utama
text-neutral-600            - Text secondary
border-neutral-300          - Border default
```

## 🔘 Button Quick Copy

```jsx
// Primary
<button className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
  Simpan
</button>

// Secondary
<button className="bg-white hover:bg-neutral-50 text-primary-600 font-medium px-4 py-2 rounded-lg border border-primary-600 transition-all duration-200">
  Batal
</button>

// Outline
<button className="bg-transparent hover:bg-neutral-50 text-neutral-700 font-medium px-4 py-2 rounded-lg border border-neutral-300 transition-all duration-200">
  Detail
</button>
```

## 📦 Card Quick Copy

```jsx
<div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 transition-all duration-200 hover:shadow-md">
  {/* Content */}
</div>
```

## 📝 Input Quick Copy

```jsx
<input
  type="text"
  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
  placeholder="Enter text..."
/>
```

## 🏷️ Badge Quick Copy

```jsx
// Primary
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
  Active
</span>

// Success
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
  Success
</span>

// Warning
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
  Pending
</span>

// Danger
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
  Rejected
</span>
```

## 🎯 Icon Quick Copy (Line Style)

```jsx
// Check Icon
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
</svg>

// Plus Icon
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
</svg>

// Edit Icon
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
</svg>

// Delete Icon
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
</svg>
```

## 📊 Table Quick Copy

```jsx
<table className="w-full">
  <thead className="bg-neutral-50 border-b border-neutral-200">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-neutral-100">
    <tr className="hover:bg-neutral-50 transition-colors duration-150">
      <td className="px-6 py-4 text-sm text-neutral-900">
        Data
      </td>
    </tr>
  </tbody>
</table>
```

## 🚨 Alert Quick Copy

```jsx
// Info
<div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
  <div className="flex">
    <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="ml-3">
      <p className="text-sm text-primary-700">Message</p>
    </div>
  </div>
</div>
```

## 💡 Tips

1. **Konsistensi**: Gunakan `rounded-lg` untuk elemen kecil, `rounded-xl` untuk card
2. **Spacing**: Gunakan `px-4 py-2` untuk button, `p-6` untuk card
3. **Transition**: Selalu tambahkan `transition-all duration-200`
4. **Focus**: Gunakan `focus:ring-2 focus:ring-primary-500` untuk input
5. **Hover**: Gunakan `hover:bg-primary-700` untuk button, `hover:shadow-md` untuk card

## 📚 Dokumentasi Lengkap

- `STYLING_GUIDE.md` - Panduan lengkap
- `MODERN_STYLING_UPDATE.md` - Detail update
- `STYLING_CHANGES_SUMMARY.md` - Summary perubahan
- `/ui-demo` - Demo semua komponen
