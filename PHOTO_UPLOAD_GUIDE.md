# Foto-upload gids – Supabase Storage met compressie

Deze gids beschrijft hoe je foto-upload met automatische bestandsverkleining in de BST-app implementeert. De benodigde utilities zijn al aanwezig; hieronder staat hoe je ze gebruikt en waar nodig uitbreidt.

---

## 1. Wat is er al beschikbaar?

| Bestand | Doel |
|---------|------|
| `src/lib/imageCompression.ts` | Client-side compressie (resize + quality) zonder extra dependencies |
| `src/services/storageService.ts` | Upload naar Supabase Storage met optionele compressie |

---

## 2. Supabase Storage instellen

### 2.1 Bucket aanmaken

1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard) → je project
2. **Storage** in het linkermenu → **New bucket**
3. Naam: `uploads` (of een andere naam; pas dan `bucket` in je code aan)
4. **Public bucket**: aan als bestanden via een publieke URL bereikbaar moeten zijn (bijv. profielfoto’s, afbeeldingen bij radios/storingen)
5. Klik **Create bucket**

### 2.2 RLS-policies (Row Level Security)

Beveilig wie mag uploaden, lezen en verwijderen.

**Storage policies** (Supabase Dashboard → Storage → Policies):

```sql
-- Toegestaan: uploaden voor ingelogde gebruikers
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Toegestaan: publiek lezen (als bucket public is)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Toegestaan: verwijderen voor ingelogde gebruikers
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');
```

Pas `bucket_id` en rechten aan naar je eigen vereisten.

---

## 3. Gebruik van de utilities

### 3.1 Alleen uploaden (compressie standaard aan)

```ts
import { uploadFile } from '../services/storageService'

const handleUpload = async (file: File, radioId: string) => {
  const path = `radios/${radioId}/${Date.now()}.jpg`
  const { path: storedPath, url, error } = await uploadFile(file, path)

  if (error) {
    console.error('Upload mislukt:', error)
    return
  }

  // Sla `url` of `storedPath` op in je database (bijv. radios.foto_url)
  return { path: storedPath, url }
}
```

### 3.2 Upload met aangepaste compressie

```ts
import { uploadFile } from '../services/storageService'

await uploadFile(file, 'storingen/456/foto.jpg', {
  compress: true,
  compressionOptions: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    maxSizeKB: 300,
    outputType: 'image/jpeg',  // of 'image/png' voor transparantie
  },
})
```

### 3.3 Zonder compressie (origineel bestand)

```ts
await uploadFile(file, 'documenten/scan.pdf', { compress: false })
```

### 3.4 Alleen compressie (zonder upload)

```ts
import { compressImage, isImageFile } from '../lib/imageCompression'

if (isImageFile(file)) {
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    maxSizeKB: 500,
  })
  // Gebruik `compressed` voor verdere verwerking of upload
}
```

---

## 4. Databasekolom voor foto-URL

Voeg een kolom toe aan de tabel waar je foto’s aan koppelt:

```sql
-- Voorbeeld: foto bij radio
ALTER TABLE radios ADD COLUMN foto_url TEXT;

-- Voorbeeld: foto's bij storing (meerdere foto's)
-- Maak een aparte tabel:
CREATE TABLE storing_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storing_id UUID REFERENCES storingen(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Stappen om foto-upload toe te voegen

### Stap 1: Upload-component

```tsx
// Voorbeeld: ImageUpload.tsx
import { useState } from 'react'
import { uploadFile } from '../services/storageService'

export function ImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const path = `uploads/${Date.now()}-${file.name}`
    const { url, error: uploadError } = await uploadFile(file, path)

    setUploading(false)
    if (uploadError) {
      setError(uploadError.message)
      return
    }
    if (url) onUploaded(url)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChange} disabled={uploading} />
      {uploading && <span>Bezig met uploaden...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  )
}
```

### Stap 2: Koppel aan je pagina

Integreer `ImageUpload` in het formulier of de detailpagina (bijv. RadioDetails, Storing-detail) en sla de teruggegeven URL op in je database.

### Stap 3: Foto tonen

```tsx
<img src={radio.foto_url} alt="Radio" style={{ maxWidth: 300 }} />
```

---

## 6. Compressie-opties

| Optie | Standaard | Beschrijving |
|-------|-----------|--------------|
| `maxWidth` | 1920 | Maximale breedte (px) |
| `maxHeight` | 1920 | Maximale hoogte (px) |
| `quality` | 0.85 | JPEG-kwaliteit (0–1) |
| `maxSizeKB` | 500 | Doel-max bestandsgrootte (KB); quality wordt verlaagd tot dit bereikt is |
| `outputType` | `'image/jpeg'` | `'image/jpeg'` (meeste besparing) of `'image/png'` (transparantie) |

---

## 7. Verwijderen van bestanden

```ts
import { deleteFile } from '../services/storageService'

await deleteFile('radios/123/foto.jpg')
```

---

## 8. Bestandsgrootte-limiet in Supabase

- Gratis tier: o.a. 1 GB storage
- Per bestand: standaard 50 MB (aanpasbaar in Supabase Dashboard → Storage → Configuration)
- Door compressie blijven bestanden meestal onder 500 KB, waardoor je meer foto’s kunt opslaan

---

## 9. Checklist implementatie

- [ ] Bucket `uploads` aangemaakt in Supabase
- [ ] RLS-policies ingesteld voor upload/read/delete
- [ ] Databasekolom `foto_url` (of vergelijkbaar) toegevoegd waar nodig
- [ ] `ImageUpload`-component (of vergelijkbaar) toegevoegd en gekoppeld
- [ ] URL opslaan na succesvolle upload
- [ ] Afbeelding tonen op detailpagina’s
