import { useState } from 'react'
import { DocsNav } from '../components/DocsNav'
import { DocViewer } from '../components/DocViewer'
import { nav } from '../lib/nav'

export function DocsPage() {
  const defaultPath = nav.sections[0]?.pages[0]?.path || ''
  const [selectedPath, setSelectedPath] = useState(defaultPath)

  return (
    <main className="flex-grow flex gap-8 px-4 py-8">
      <aside className="pt-4">
        <DocsNav onPageSelect={setSelectedPath} selectedPath={selectedPath} />
      </aside>
      <div className="flex-grow min-w-0">
        <DocViewer path={selectedPath} />
      </div>
    </main>
  )
}
