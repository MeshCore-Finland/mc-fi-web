import { docComponents } from '../lib/nav'

interface DocViewerProps {
  path: string
}

export function DocViewer({ path }: DocViewerProps) {
  const Component = docComponents[path]

  if (!Component) {
    return <div className="p-8 text-gray-500">Page not found</div>
  }

  return (
    <div className="prose max-w-4xl p-8">
      <Component />
    </div>
  )
}
