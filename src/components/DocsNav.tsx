import { nav } from '../lib/nav'

interface DocsNavProps {
  onPageSelect: (path: string) => void
  selectedPath?: string
}

export function DocsNav({ onPageSelect, selectedPath }: DocsNavProps) {
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
            {section.pages.map(page => (
              <button
                key={page.slug}
                onClick={() => onPageSelect(page.path)}
                style={{
                  backgroundColor: selectedPath === page.path ? 'var(--color-link)' : 'transparent',
                  color: selectedPath === page.path ? 'white' : 'var(--color-text-muted)',
                }}
                className="px-4 py-2 rounded text-left text-sm transition hover:opacity-75"
              >
                {page.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
