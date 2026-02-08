# Fitur Ekspor Quotation ke PDF dan DOCX

**Status**: ✅ SELESAI

**Tanggal**: 8 Februari 2026

## Overview

Fitur ekspor quotation memungkinkan pengguna untuk mengunduh penawaran harga dalam format PDF dan DOCX dengan layout profesional yang mencakup space untuk header perusahaan.

## Fitur yang Ditambahkan

### 1. Ekspor ke PDF (Ditingkatkan)

**File**: `nas/src/lib/pdf/quotation-template.tsx`

**Peningkatan**:
- ✅ Space untuk logo perusahaan (60px height dengan background abu-abu)
- ✅ Header perusahaan lengkap dengan:
  - Nama perusahaan (PT PELAYARAN NUSANTARA)
  - Alamat lengkap
  - Telepon dan email
  - Website
- ✅ Layout bilingual (Indonesia & English)
- ✅ Desain profesional dengan border dan spacing yang rapi
- ✅ Status badge dengan warna sesuai status
- ✅ Tabel material & jasa yang rapi
- ✅ Lingkup pekerjaan (scope of work)
- ✅ Ringkasan biaya detail
- ✅ Footer dengan terms & conditions

**Struktur Layout PDF**:
```
┌─────────────────────────────────────┐
│  [SPACE UNTUK LOGO PERUSAHAAN]      │
│                                     │
│  PT PELAYARAN NUSANTARA             │
│  Jl. Pelabuhan Raya No. 123...      │
│  Telp: (021) 1234-5678              │
│  Email: info@pelayarannusantara.com │
│  Website: www.pelayarannusantara.com│
├─────────────────────────────────────┤
│  PENAWARAN HARGA / QUOTATION        │
│  No: Q-20260208-0001                │
│  Tanggal: 8 Februari 2026           │
│  Status: DRAFT                      │
├─────────────────────────────────────┤
│  Kepada / To:                       │
│  Perusahaan: ...                    │
│  Kontak: ...                        │
├─────────────────────────────────────┤
│  Detail Proyek / Project Details    │
│  ...                                │
├─────────────────────────────────────┤
│  Material & Jasa / Materials        │
│  [Tabel dengan kolom:]              │
│  No | Deskripsi | Qty | Harga | Total│
├─────────────────────────────────────┤
│  Lingkup Pekerjaan / Scope of Work  │
│  1. ...                             │
│  2. ...                             │
├─────────────────────────────────────┤
│  Ringkasan Biaya / Cost Summary     │
│  Biaya Material: ...                │
│  Biaya Tenaga Kerja: ...            │
│  Margin Keuntungan: ...             │
│  TOTAL HARGA: ...                   │
├─────────────────────────────────────┤
│  Footer dengan terms & conditions   │
└─────────────────────────────────────┘
```

### 2. Ekspor ke DOCX (Baru)

**File**: `nas/src/app/api/quotations/[id]/docx/route.ts`

**Fitur**:
- ✅ Format Microsoft Word (.docx)
- ✅ Layout identik dengan PDF
- ✅ Space untuk logo perusahaan dengan background abu-abu
- ✅ Header perusahaan lengkap
- ✅ Bilingual (Indonesia & English)
- ✅ Tabel material & jasa yang dapat diedit
- ✅ Formatting profesional dengan heading levels
- ✅ Dapat diedit setelah diunduh

**Library yang Digunakan**:
- `docx` v8.5.0 - untuk generate file DOCX

### 3. UI - Tombol Download

**File**: `nas/src/app/(dashboard)/quotations/[id]/page.tsx`

**Tombol yang Ditambahkan**:
- ✅ **Download PDF** - dengan icon PDF dan loading state
- ✅ **Download DOCX** - dengan icon DOCX dan loading state
- ✅ Posisi di header halaman detail quotation
- ✅ Tersedia untuk semua status quotation
- ✅ Loading indicator saat proses download

**Tampilan**:
```
┌────────────────────────────────────────────────┐
│  ← Back    Q-20260208-0001                     │
│            test quote                          │
│                                                │
│  [Download PDF] [Download DOCX] [Send] [Delete]│
└────────────────────────────────────────────────┘
```

## API Endpoints

### 1. GET /api/quotations/[id]/pdf

**Deskripsi**: Generate dan download quotation sebagai PDF

**Response**:
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="quotation-{quote_number}.pdf"`

**Error Handling**:
- 401: Tidak terotorisasi
- 404: Quotation tidak ditemukan
- 500: Gagal membuat PDF

### 2. GET /api/quotations/[id]/docx (Baru)

**Deskripsi**: Generate dan download quotation sebagai DOCX

**Response**:
- Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Content-Disposition: `attachment; filename="quotation-{quote_number}.docx"`

**Error Handling**:
- 401: Tidak terotorisasi
- 404: Quotation tidak ditemukan
- 500: Gagal membuat DOCX

## Cara Menggunakan

### Untuk User:

1. **Buka halaman detail quotation**:
   - Navigasi ke `/quotations/[id]`

2. **Download PDF**:
   - Klik tombol "Download PDF"
   - File akan otomatis terunduh dengan nama `quotation-{quote_number}.pdf`

3. **Download DOCX**:
   - Klik tombol "Download DOCX"
   - File akan otomatis terunduh dengan nama `quotation-{quote_number}.docx`
   - File dapat diedit di Microsoft Word atau aplikasi pengolah kata lainnya

### Untuk Developer:

**Menambahkan Logo Perusahaan**:

1. **Untuk PDF** (`nas/src/lib/pdf/quotation-template.tsx`):
   ```tsx
   // Ganti bagian companyLogoSpace dengan:
   <View style={styles.companyLogoSpace}>
     <Image src="/path/to/logo.png" style={{ width: 150, height: 50 }} />
   </View>
   ```

2. **Untuk DOCX** (`nas/src/app/api/quotations/[id]/docx/route.ts`):
   ```typescript
   // Ganti paragraph logo dengan:
   new Paragraph({
     children: [
       new ImageRun({
         data: fs.readFileSync("path/to/logo.png"),
         transformation: {
           width: 150,
           height: 50,
         },
       }),
     ],
     alignment: AlignmentType.CENTER,
   })
   ```

**Mengubah Informasi Perusahaan**:

Edit bagian company header di kedua file:
- PDF: `nas/src/lib/pdf/quotation-template.tsx`
- DOCX: `nas/src/app/api/quotations/[id]/docx/route.ts`

Cari dan ubah:
```typescript
"PT PELAYARAN NUSANTARA"
"Jl. Pelabuhan Raya No. 123, Jakarta Utara 14440"
"Telp: (021) 1234-5678"
"Email: info@pelayarannusantara.com"
"Website: www.pelayarannusantara.com"
```

## Dependencies Baru

**Package yang Ditambahkan**:
```json
{
  "docx": "^8.5.0"
}
```

**Instalasi**:
```bash
npm install docx --save
```

## Testing Checklist

### Manual Testing:

- [x] Download PDF dari quotation dengan status draft
- [x] Download PDF dari quotation dengan status sent
- [x] Download PDF dari quotation dengan status approved
- [x] Download DOCX dari quotation dengan status draft
- [x] Download DOCX dari quotation dengan status sent
- [x] Download DOCX dari quotation dengan status approved
- [x] Verifikasi layout PDF rapi dan profesional
- [x] Verifikasi layout DOCX rapi dan dapat diedit
- [x] Verifikasi space untuk logo perusahaan ada
- [x] Verifikasi header perusahaan lengkap
- [x] Verifikasi tabel material & jasa tampil dengan benar
- [x] Verifikasi scope of work tampil dengan benar
- [x] Verifikasi ringkasan biaya akurat
- [x] Verifikasi bilingual (Indonesia & English)
- [x] Verifikasi loading state saat download
- [x] Verifikasi error handling jika quotation tidak ditemukan

### Browser Testing:

- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari

## Customization Guide

### Mengubah Warna Brand:

**PDF** (`nas/src/lib/pdf/quotation-template.tsx`):
```typescript
// Ubah warna primary (biru) menjadi warna brand Anda
color: "#1e40af" // Ganti dengan warna brand
borderBottom: "2pt solid #1e40af" // Ganti dengan warna brand
```

**DOCX**: Warna akan mengikuti default Word, dapat diubah setelah file dibuka.

### Mengubah Font:

**PDF**:
```typescript
// Register custom font
Font.register({
  family: 'CustomFont',
  src: 'https://path-to-font.ttf'
})

// Gunakan di styles
fontFamily: "CustomFont"
```

### Menambahkan Field Baru:

1. Tambahkan field di query database
2. Tambahkan di interface TypeScript
3. Tambahkan di template PDF dan DOCX
4. Update dokumentasi

## Troubleshooting

### Error: "Failed to generate PDF"

**Solusi**:
- Periksa apakah semua data quotation lengkap
- Periksa console untuk error detail
- Pastikan @react-pdf/renderer terinstall dengan benar

### Error: "Failed to generate DOCX"

**Solusi**:
- Periksa apakah library docx terinstall
- Periksa console untuk error detail
- Pastikan semua data dalam format yang benar

### File tidak terdownload

**Solusi**:
- Periksa browser settings untuk download
- Periksa apakah ada popup blocker
- Coba browser lain

### Layout tidak rapi

**Solusi**:
- Periksa data yang terlalu panjang
- Sesuaikan width kolom tabel
- Sesuaikan spacing dan padding

## Future Enhancements

Fitur yang dapat ditambahkan di masa depan:

1. **Upload Logo Perusahaan**:
   - Interface untuk upload logo
   - Simpan logo di database atau storage
   - Tampilkan logo di PDF dan DOCX

2. **Template Customization**:
   - Multiple template designs
   - User dapat memilih template
   - Custom colors dan fonts

3. **Email Integration**:
   - Send quotation via email
   - Attach PDF automatically
   - Email template

4. **Digital Signature**:
   - Add signature field
   - E-signature integration
   - Signature verification

5. **Multi-language Support**:
   - More language options
   - User can select language
   - Translation management

6. **Watermark**:
   - Add watermark for draft
   - Custom watermark text
   - Watermark position

## Files Modified/Created

### Created:
- `nas/src/app/api/quotations/[id]/docx/route.ts` - DOCX export API
- `nas/QUOTATION_EXPORT_FEATURE.md` - Dokumentasi fitur

### Modified:
- `nas/src/lib/pdf/quotation-template.tsx` - Enhanced PDF template
- `nas/src/app/(dashboard)/quotations/[id]/page.tsx` - Added download buttons
- `nas/package.json` - Added docx dependency

## Conclusion

Fitur ekspor quotation ke PDF dan DOCX telah berhasil diimplementasikan dengan:

✅ Layout profesional dan rapi
✅ Space untuk header perusahaan dan logo
✅ Bilingual (Indonesia & English)
✅ Format yang dapat diedit (DOCX)
✅ Error handling yang baik
✅ Loading states untuk UX yang lebih baik
✅ Dokumentasi lengkap

Fitur ini siap digunakan untuk production dan dapat dikustomisasi sesuai kebutuhan perusahaan.

---

**Dibuat**: 8 Februari 2026
**Status**: ✅ PRODUCTION READY
