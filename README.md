# business-web-template-v2

A React + Vite + Tailwind CSS v4 business website template with 21st.dev-inspired component variants.

## Stack

- **React 19** — component model
- **Vite 6** — bundler
- **Tailwind CSS v4** — styling
- **motion (framer-motion v12)** — animations
- **lucide-react** — icons
- **TypeScript** — type safety

## Structure

```
src/
  types.ts                    — TypeScript interfaces (same schema as v1)
  i18nDefaults.ts             — Static UI label defaults (he/en)
  context/
    BusinessContext.tsx       — Business data provider + useBusiness() hook
    I18nContext.tsx           — i18n provider + useI18n() hook
  components/                 — Default section implementations
    Header.tsx
    Hero.tsx
    About.tsx
    Services.tsx
    Gallery.tsx
    Reviews.tsx
    Contact.tsx
    Location.tsx
    Footer.tsx
    WhatsappFab.tsx
  component-variants/         — 4 variants per section (a/b/c/d)
    hero/   HeroA–D.tsx
    nav/    NavA–D.tsx
    about/  AboutA–D.tsx
    services/ ServicesA–D.tsx
    reviews/  ReviewsA–D.tsx
    contact/  ContactA–D.tsx
  App.tsx
  main.tsx
  styles.css
public/
  data/
    business.json             — Business data (same format as v1)
```

## Variant Styles

### Hero
- **A** — Animated word cycle (dark gradient, framer-motion AnimatePresence)
- **B** — Aurora background (radial gradient blobs, noise overlay)
- **C** — Split layout (text + emoji visual with floating stat cards)
- **D** — Shape landing (SVG path animation, gradient text, white background)

### Nav
- **A** — Glassmorphism floating pill (backdrop-blur, scrolled transition)
- **B** — Dark elite with glow accent (active pill indicator)
- **C** — Two-tier (info bar + main nav)
- **D** — Minimal elegant (dot separators, border on scroll)

### Services
- **A** — Bento grid (mixed-size cards, colorful)
- **B** — Feature cards with colored icon circles
- **C** — Numbered steps list
- **D** — Accordion expandable

### About
- **A** — Animated stats counter (count-up animation)
- **B** — Split with large emoji visual
- **C** — Dark metric dashboard
- **D** — Timeline / story milestones

### Reviews
- **A** — Animated masonry columns (infinite scroll upward)
- **B** — Featured review + grid
- **C** — Horizontal scroll carousel
- **D** — Minimal stagger list

### Contact
- **A** — Floating action cards + form
- **B** — Split dark/light panels
- **C** — Bold CTA with pulsing buttons
- **D** — Minimal centered + underline form

## Generator Integration

When the site generator selects variants, it copies the chosen variant file to replace the default component:

```
component-variants/hero/HeroA.tsx → src/components/Hero.tsx
component-variants/nav/NavA.tsx   → src/components/Header.tsx
...
```

All variant files import from `@/context/...` using the Vite path alias, so no path replacement is needed.

## Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
```

## Data Format

Same `business.json` schema as `business-web-template` (v1). Drop any v1 JSON into `public/data/business.json`.
