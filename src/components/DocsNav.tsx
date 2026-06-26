import { docPathToHash, nav } from '../lib/nav'

interface DocsNavProps {
  selectedPath?: string
}

export function DocsNav({ selectedPath }: DocsNavProps) {
  return (
    <nav className="docs-nav" aria-label="Documentation">
      {nav.sections.map(section => (
        <div key={section.slug} className="docs-nav-section">
          <div className="docs-nav-section-title">
            {section.title}
          </div>
          <div className="docs-nav-pages">
            {section.pages.map(page => {
              const isSelected = selectedPath === page.path
              return (
                <a
                  key={page.slug}
                  href={docPathToHash(page.path)}
                  className={`docs-nav-link ${isSelected ? 'is-selected' : ''}`}
                >
                  {page.title}
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
