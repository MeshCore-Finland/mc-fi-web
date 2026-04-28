# Contributing

Contributions welcome! Follow these guidelines.

## Getting Started
1. fork this repo
2. Clone the repo
3. `npm install`
4. `npm run dev`
5. Make changes
6. Test locally
7. Submit PR

## Documentation

### Adding Pages

Create `.mdx` files in `/docs`:

```bash
docs/section-name/page-name.mdx
```

Navigation auto-generates from folder structure. Section and page names are formatted automatically (kebab-case → Title Case).

### MDX Syntax

Write standard Markdown with JSX support:

```mdx
# Heading

Regular paragraph with **bold** and *italic*.

- Bullet point
- Another point

```jsx
export const Example = () => <button>Click me</button>

<Example />
```

Code blocks:

```bash
npm install
```

Links and images:

```markdown
[Link text](https://example.com)
![Alt text](./image.png)
```

### Prose Styling

MDX content automatically inherits theme colors via `.prose` styles. All elements (headings, links, code) adapt to light/dark mode.

## Code Changes

### Component Guidelines

- Functional components with hooks
- Props typed with TypeScript
- Keep components focused
- Use Tailwind for styling

Example:

```tsx
interface Props {
  title: string
  children: React.ReactNode
}

export function Card({ title, children }: Props) {
  return (
    <div style={{ color: 'var(--color-text)' }}>
      <h2 style={{ color: 'var(--color-heading)' }}>{title}</h2>
      {children}
    </div>
  )
}
```

### Theme Colors

Use CSS variables for consistent theming:

```tsx
<div style={{ color: 'var(--color-text)' }}>
<div style={{ backgroundColor: 'var(--color-surface)' }}>
```

Available variables in `src/index.css`:
- `--color-heading`
- `--color-text`
- `--color-text-muted`
- `--color-link`
- `--color-link-hover`
- `--color-bg`
- `--color-surface`
- `--color-surface-2`
- `--color-border`

## Testing

- TypeScript: `npm run build` checks types
- Lint: `npm run lint`
- Manual: Test in dev server, both light and dark modes

## Git

- Branch naming: `feature/foo`, `fix/bar`, `docs/baz`
- Commit messages: Clear, concise
- Keep commits logical
- Rebase before submitting

## PR Requirements

- Tests pass: `npm run build && npm run lint`
- Responsive design tested
- Both light/dark themes working
- Descriptive title and description
- Link any related issues

## Questions?

Open an issue to discuss major changes before coding.
