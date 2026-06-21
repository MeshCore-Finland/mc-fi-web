# MeshCore Finland Website

Regional MeshCore community site for Finland. Built with React, Vite, Tailwind CSS, and MDX for documentation.

## Features

- **Light/Dark Theme** - Automatic theme detection with manual override
- **MDX Documentation** - Write docs in Markdown with JSX support
- **Auto-Generated Nav** - Documentation structure generates navigation automatically
- **Responsive Design** - Mobile-first with Tailwind CSS
- **Fast Development** - Vite with hot module replacement

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens http://localhost:5173

### Build

```bash
npm run build
```

Outputs to `dist/`

### Preview

```bash
npm run preview
```

Preview production build locally.

## Project Structure

```
src/
  components/          # React components
  pages/              # Page components
  lib/                # Utilities (nav generation)
  App.tsx             # Main app routing
  index.css           # Global styles
  docs/
    [section]/          # Documentation sections
      [page].mdx        # MDX pages
```

## Theme System

Uses CSS custom properties for theming:
- Light theme: `--color-heading`, `--color-text`, `--color-link`, etc.
- Dark theme: Defined in `[data-theme="dark"]`

Theme toggles via button in navbar. MDX prose styles adapt automatically.

## Technology

- **React 19** - UI framework
- **Vite 8** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **@mdx-js/rollup** - MDX support
- **FontAwesome** - Icons

## License

See LICENSE file.
