import { DocsNav } from '../components/DocsNav'
import { DocViewer } from '../components/DocViewer'
import { nav } from '../lib/nav'

interface DocsPageProps {
  selectedPath?: string
}

function getCurrentPageLabel(path: string): string {
  for (const section of nav.sections) {
    const page = section.pages.find(item => item.path === path)

    if (page) {
      return `${section.title} / ${page.title}`
    }
  }

  return 'Documentation'
}

export function DocsPage({ selectedPath }: DocsPageProps) {
  const defaultPath = nav.sections[0]?.pages[0]?.path || ''
  const currentPath = selectedPath || defaultPath
  const currentPageLabel = getCurrentPageLabel(currentPath)

  return (
    <main className="docs-layout">
      <div className="docs-mobile-nav">
        <details key={currentPath} className="docs-mobile-nav-panel">
          <summary>{currentPageLabel}</summary>
          <DocsNav selectedPath={currentPath} />
        </details>
      </div>

      <aside className="docs-sidebar">
        <DocsNav selectedPath={currentPath} />
      </aside>

      <div className="docs-content">
        <DocViewer path={currentPath} />
      </div>
    </main>
  )
}
