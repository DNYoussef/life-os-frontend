# Life OS Dashboard Theme - Tweakcn Integration

## Quick Customization with Tweakcn

1. Visit [tweakcn.com](https://tweakcn.com)
2. Customize colors, radius, typography visually
3. Click "Copy Code"
4. Paste the HSL values into `src/index.css` `@theme` block

## Theme Structure (Tailwind v4)

This project uses Tailwind CSS v4's new `@theme` directive for theming.

### Main Theme File: `src/index.css`

```css
@import "tailwindcss";

@theme {
  /* Core colors - modify these for different themes */
  --color-background: hsl(222 47% 5%);
  --color-foreground: hsl(210 40% 98%);
  --color-primary: hsl(187 86% 43%);
  --color-accent: hsl(239 84% 67%);
  /* ... etc */
}
```

### Current Theme: Cyber Cyan

| Token | Color | HSL |
|-------|-------|-----|
| Background | Dark navy | `222 47% 5%` |
| Foreground | Light gray | `210 40% 98%` |
| Primary | Cyan | `187 86% 43%` |
| Accent | Indigo | `239 84% 67%` |
| Success | Green | `160 84% 39%` |
| Warning | Amber | `38 92% 50%` |
| Error | Red | `0 84% 60%` |

## Using Theme Colors

### In Tailwind Classes
```tsx
// Background
<div className="bg-background" />
<div className="bg-card" />
<div className="bg-primary" />

// Text
<p className="text-foreground" />
<p className="text-muted-foreground" />
<p className="text-primary" />

// Borders
<div className="border-border" />
<div className="border-primary" />

// With opacity (Tailwind v4 syntax)
<div className="bg-primary/20" />
```

### In CSS
```css
.my-component {
  background: var(--color-card);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
}
```

## Changing Themes

### Option 1: Tweakcn Visual Editor
1. Go to [tweakcn.com](https://tweakcn.com)
2. Adjust sliders for colors, radius, typography
3. Try presets: Doom 64, Amethyst, Neon, Sapphire
4. Copy CSS and update `@theme` block

### Option 2: AI Theme Generation
1. Screenshot a website you like
2. Upload to tweakcn.com's "Generate" tab
3. It extracts the color palette automatically
4. Copy and paste

### Option 3: Manual Adjustment
Edit the HSL values directly in `src/index.css`:

```css
@theme {
  /* Change primary from cyan to purple */
  --color-primary: hsl(280 80% 55%);

  /* Warmer background */
  --color-background: hsl(20 10% 8%);
}
```

## File Structure

```
src/
  index.css          <- Main theme (@theme directive)
  styles/
    tokens.css       <- Design tokens (spacing, z-index)
  App.css            <- Component styles
```

## Backward Compatibility

Legacy CSS variables are mapped in `:root`:
- `--bg-base` -> `var(--color-background)`
- `--text-primary` -> `var(--color-foreground)`
- `--color-accent` -> `var(--color-primary)`

Components using old variable names will continue to work.

## Chart Colors

For data visualization:
```css
--color-chart-1: hsl(187 86% 43%);  /* Primary */
--color-chart-2: hsl(239 84% 67%);  /* Indigo */
--color-chart-3: hsl(160 84% 39%);  /* Green */
--color-chart-4: hsl(38 92% 50%);   /* Amber */
--color-chart-5: hsl(0 84% 60%);    /* Red */
```

## Utility Classes

Built-in utility classes use the theme:

| Class | Effect |
|-------|--------|
| `.glass-card` | Glassmorphism card with hover glow |
| `.gradient-text` | Gradient text using accent colors |
| `.badge-*` | Colored badges (success, warning, error) |
| `.status-dot.*` | Glowing status indicators |
| `.glow-primary` | Primary color glow effect |
