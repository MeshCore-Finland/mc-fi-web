import { docComponents } from '../lib/nav'

interface DocViewerProps {
  path: string
}

export function DocViewer({ path }: DocViewerProps) {
  const Component = docComponents[path]

  if (!Component) {
    return <div className="p-8 text-gray-500">No pages found, maybe consider creating one on <a href="https://github.com/MeshCore-Finland/mc-fi-web" className="text-blue-500 hover:text-blue-700">GitHub</a> </div>
  }

  return (
    <div className="prose max-w-4xl p-8">
      <Component />
    </div>
  )
}
