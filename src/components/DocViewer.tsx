import { Component, type ErrorInfo, type ReactNode } from 'react'
import { docComponents } from '../lib/nav'

interface DocViewerProps {
  path: string
}

interface DocErrorBoundaryProps {
  children: ReactNode
}

interface DocErrorBoundaryState {
  error: Error | null
}

class DocErrorBoundary extends Component<DocErrorBoundaryProps, DocErrorBoundaryState> {
  state: DocErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): DocErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Failed to render docs page', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="docs-error" role="alert">
          <h1>Page failed to render</h1>
          <p>
            The selected docs page hit a rendering error. The docs menu is still
            available, so you can switch to another page.
          </p>
          <pre>{this.state.error.message}</pre>
        </div>
      )
    }

    return this.props.children
  }
}

export function DocViewer({ path }: DocViewerProps) {
  const Component = docComponents[path]

  if (!Component) {
    return <div className="p-8 text-gray-500">No pages found, maybe consider creating one on <a href="https://github.com/MeshCore-Finland/mc-fi-web" className="text-blue-500 hover:text-blue-700">GitHub</a> </div>
  }

  return (
    <div className="docs-prose">
      <DocErrorBoundary key={path}>
        <Component />
      </DocErrorBoundary>
    </div>
  )
}
