import { DocsNav } from '../components/DocsNav'
import { DocViewer } from '../components/DocViewer'
import { nav } from '../lib/nav'

interface DocsPageProps {
  selectedPath?: string
}

export function DocsPage({ selectedPath }: DocsPageProps) {
  const defaultPath = nav.sections[0]?.pages[0]?.path || ''
  const currentPath = selectedPath || defaultPath

  return (
    <main className="flex-grow flex gap-8 px-4 py-8">
      <aside className="pt-4">
        <DocsNav selectedPath={currentPath} />
      </aside>
      <div className="flex-grow min-w-0">
        <DocViewer path={currentPath} />
      </div>
    </main>
  )
}
