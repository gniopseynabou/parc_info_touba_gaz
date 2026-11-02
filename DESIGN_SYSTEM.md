# Design System — Touba Gaz IT Asset Management
**Version 2.0 — Thème Clair Professionnel**

---

## 1. Palette de Couleurs (Light Mode)

### Couleurs Principales
| Élément | Couleur HEX | Variable CSS / Usage |
|---|---|---|
| Fond principal | `#FFFFFF` | `--background` |
| Fond zone de contenu | `#F8FAFC` | Main shell (`bg-[#F8FAFC]`) |
| Fond des cartes | `#FFFFFF` | `--card` |
| Sidebar | `#FFFFFF` | `--sidebar` |
| Couleur principale | `#16A34A` | `--primary` |
| Vert clair (éléments actifs) | `#DCFCE7` | `--sidebar-accent`, `--accent` |
| Texte principal | `#17231B` | `--foreground` |
| Texte secondaire | `#64748B` | `--muted-foreground` |
| Bordures | `#E2E8F0` | `--border`, `--input` |
| Rouge (erreurs / suppression) | `#E11D48` | `--destructive` |
| Orange (avertissements) | `#D97706` | `--chart-3` |

### Couleurs de Statuts (Badges sobres & lisibles)
| Statut | Texte | Fond | Bordure |
|---|---|---|---|
| En service | `text-emerald-700` | `bg-emerald-50` | `border-emerald-200` |
| En panne | `text-rose-700` | `bg-rose-50` | `border-rose-200` |
| En maintenance | `text-amber-700` | `bg-amber-50` | `border-amber-200` |
| Réformé | `text-slate-600` | `bg-slate-100` | `border-slate-200` |
| Nouveau (ticket) | `text-sky-700` | `bg-sky-50` | `border-sky-200` |
| En cours | `text-amber-700` | `bg-amber-50` | `border-amber-200` |
| En attente | `text-purple-700` | `bg-purple-50` | `border-purple-200` |
| Résolu | `text-emerald-700` | `bg-emerald-50` | `border-emerald-200` |
| Clôturé | `text-slate-600` | `bg-slate-100` | `border-slate-200` |

---

## 2. Typographie

- **Police principale :** Inter (système de secours : -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif)
- **Taille de base :** 0.9375rem (15px)
- **Titres de pages :** 24–28px, `font-bold`, `tracking-tight text-slate-900`
- **Sous-titres de section :** 12px, `font-semibold uppercase tracking-wider text-slate-500`
- **Corps :** 14px, `text-slate-700`, `leading-6`
- **Labels formulaires :** 12px, `text-slate-700 font-semibold`
- **Codes/Références :** `font-mono font-bold text-emerald-700` (ex: `EQ-0001`, `DA-00001`)

---

## 3. Composants UI

### Boutons
```tsx
// Bouton primaire (action principale)
<Button className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 font-semibold shadow-xs">

// Bouton secondaire (outline)
<Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs">

// Bouton destructif / déconnexion
<Button variant="outline" className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50 shadow-2xs">

// Bouton ghost (action discrète dans tableau)
<Button variant="ghost" size="xs" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
```

### Cartes (Cards)
```tsx
<Card className="border border-slate-200 bg-white shadow-xs rounded-xl">
  <CardHeader className="border-b border-slate-100 px-6 py-4">
    <CardTitle className="text-base font-semibold text-slate-900">...</CardTitle>
    <CardDescription className="text-sm text-slate-500">...</CardDescription>
  </CardHeader>
  <CardContent className="p-6">...</CardContent>
</Card>
```

### Tableaux
```tsx
<table className="w-full text-left text-sm">
  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
    <tr>
      <th className="py-3 px-4">Colonne</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100 text-slate-700">
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="py-3 px-4">...</td>
    </tr>
  </tbody>
</table>
```

### Formulaires et Champs de saisie
```tsx
<Input className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/20 shadow-xs" />
```
