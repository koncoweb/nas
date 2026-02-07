# Panduan Styling Modern - Aplikasi Korporat

## Palet Warna

### Primary (Biru Utama)
Digunakan untuk elemen utama seperti tombol primary, link, dan highlight.
- `primary-50` hingga `primary-950`: Gradasi biru dari terang ke gelap
- Warna utama: `primary-600` (#2563eb)
- Hover: `primary-700` (#1d4ed8)

### Accent (Biru Aksen)
Digunakan untuk elemen sekunder dan aksen.
- `accent-50` hingga `accent-900`: Gradasi biru cyan
- Warna utama: `accent-500` (#0ea5e9)

### Neutral (Abu-abu)
Digunakan untuk teks, border, dan background.
- `neutral-50` hingga `neutral-900`: Gradasi abu-abu
- Background: `neutral-50` (#fafafa)
- Teks: `neutral-900` (#171717)

## Komponen Utility Classes

### Tombol
```jsx
// Primary Button
<button className="btn-primary">Simpan</button>

// Secondary Button
<button className="btn-secondary">Batal</button>

// Outline Button
<button className="btn-outline">Lihat Detail</button>
```

### Card
```jsx
<div className="card">
  <h3>Judul Card</h3>
  <p>Konten card...</p>
</div>
```

### Input
```jsx
<input type="text" className="input-modern" placeholder="Masukkan teks..." />
```

### Badge
```jsx
<span className="badge badge-primary">Aktif</span>
<span className="badge badge-success">Berhasil</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Ditolak</span>
```

### Table
```jsx
<table className="table-modern">
  <thead>
    <tr>
      <th>Kolom 1</th>
      <th>Kolom 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

## Migrasi dari Warna Lama

### Penggantian Warna
- `bg-blue-500` → `bg-primary-600`
- `bg-blue-600` → `bg-primary-700`
- `text-blue-500` → `text-primary-600`
- `border-blue-500` → `border-primary-600`
- `bg-gray-50` → `bg-neutral-50`
- `text-gray-900` → `text-neutral-900`
- `border-gray-300` → `border-neutral-300`

### Icon Line Style
Untuk menggunakan icon dengan style line (outline), gunakan library seperti:
- Lucide React (recommended)
- Heroicons (outline variant)
- Feather Icons

Contoh dengan Lucide React:
```jsx
import { User, Settings, LogOut } from 'lucide-react';

<User className="w-5 h-5 text-primary-600" />
```

## Best Practices

1. **Konsistensi**: Gunakan utility classes yang sudah didefinisikan
2. **Spacing**: Gunakan padding/margin yang konsisten (4, 6, 8, 12, 16)
3. **Rounded**: Gunakan `rounded-lg` atau `rounded-xl` untuk elemen modern
4. **Shadow**: Gunakan `shadow-sm` untuk card, `shadow-md` untuk hover
5. **Transition**: Selalu tambahkan `transition-all duration-200` untuk interaksi smooth
6. **Focus State**: Pastikan semua input memiliki focus ring yang jelas

## Fitur Modern

- Scrollbar custom dengan styling modern
- Focus ring dengan warna primary
- Hover effects yang smooth
- Shadow yang subtle
- Border radius yang konsisten
- Spacing yang harmonis
