import { docPathToHash, nav } from '../lib/nav'

interface DocsNavProps {
  selectedPath?: string
}

export function DocsNav({ selectedPath }: DocsNavProps) {
  return (
    <div className="flex flex-col gap-6" style={{ width: '220px' }}>
      {nav.sections.map(section => (
        <div key={section.slug} className="flex flex-col gap-2">
          <div
            style={{ color: 'var(--color-heading)' }}
            className="font-semibold px-4 text-sm"
          >
            {section.title}
          </div>
          <div className="flex flex-col gap-1">
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
    </div>
  )
}
