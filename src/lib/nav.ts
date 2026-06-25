import { createElement } from 'react'
import { FaqPage } from '../components/FaqPage'

interface DocMeta {
  slug?: string
  title?: string
}

export interface NavPage {
  title: string
  path: string
  publicPath: string
  slug: string
  sortKey: number
}

export interface NavSection {
  title: string
  slug: string
  pages: NavPage[]
}

export interface NavStructure {
  sections: NavSection[]
}

export function docPathToHash(path: string): string {
  const publicPath = findPageByPath(path)?.publicPath ?? path

  return `#/${publicPath
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/')}`
}

export function resolveDocPath(path: string): string | undefined {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return findPageByPath(normalizedPath)?.path
}

function formatTitle(text: string): string {
  // Strip leading numbers and dash (e.g., "01-getting-started" -> "getting-started")
  const cleaned = text.replace(/^\d+-/, '')
  return cleaned
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function parseFrontMatter(markdown: string): DocMeta {
  const match = markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)

  if (!match) {
    return {}
  }

  return match[1].split('\n').reduce<DocMeta>((meta, line) => {
    const fieldMatch = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)

    if (!fieldMatch) {
      return meta
    }

    const [, key, rawValue] = fieldMatch
    const value = rawValue.trim().replace(/^['"]|['"]$/g, '')

    if (key === 'slug' || key === 'title') {
      meta[key] = value
    }

    return meta
  }, {})
}

function getSortKey(text: string): number {
  // Extract leading number for sorting
  const match = text.match(/^(\d+)-/)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

function getSlug(text: string): string {
  // Strip leading number for slug
  return text.replace(/^\d+-/, '')
}

function findPageByPath(path: string): NavPage | undefined {
  return nav.sections.flatMap(section => section.pages).find(page => {
    return page.path === path || page.publicPath === path
  })
}

function getRawMarkdown(rawModule: unknown): string | undefined {
  if (typeof rawModule === 'string') {
    return rawModule
  }

  if (rawModule && typeof rawModule === 'object' && 'default' in rawModule) {
    return getRawMarkdown((rawModule as { default: unknown }).default)
  }

  return undefined
}

function generateNav(): NavStructure {
  const mdxDocs = import.meta.glob<{ default: React.ComponentType }>('/src/docs/**/*.mdx', {
    eager: true,
  })
  const mdxRawDocs = import.meta.glob<{ default: string }>('/src/docs/**/*.mdx', {
    eager: true,
    query: '?raw',
  })
  const faqDocs = import.meta.glob<unknown>('/src/docs/**/*.faq.md', {
    eager: true,
    query: '?raw',
  })
  const docPaths = [...Object.keys(mdxDocs), ...Object.keys(faqDocs)]

  console.log('Glob keys:', docPaths)

  const sections: Record<string, { pages: NavPage[]; sortKey: number }> = {}

  docPaths.forEach(path => {
    const match = path.match(/\/src\/docs\/([^/]+)\/([^/]+?)(?:\.faq\.md|\.mdx)$/)

    if (!match) return

    const [, sectionDir, pageFile] = match
    const sectionSlug = getSlug(sectionDir)
    const rawMarkdown = getRawMarkdown(mdxRawDocs[path]) ?? getRawMarkdown(faqDocs[path])
    const meta = rawMarkdown ? parseFrontMatter(rawMarkdown) : {}
    const pageSlug = meta.slug || getSlug(pageFile)

    if (!sections[sectionSlug]) {
      sections[sectionSlug] = { pages: [], sortKey: getSortKey(sectionDir) }
    }

    sections[sectionSlug].pages.push({
      title: meta.title || formatTitle(pageFile),
      path: `/docs/${sectionDir}/${pageFile}`,
      publicPath: `/docs/${sectionSlug}/${pageSlug}`,
      slug: pageSlug,
      sortKey: getSortKey(pageFile),
    })
  })

  const navSections = Object.entries(sections)
    .sort(([slugA, a], [slugB, b]) => {
      return a.sortKey - b.sortKey || formatTitle(slugA).localeCompare(formatTitle(slugB))
    })
    .map(([slug, { pages }]) => ({
      title: formatTitle(slug),
      slug,
      pages: pages.sort((a, b) => {
        return a.sortKey - b.sortKey || a.title.localeCompare(b.title)
      }),
    }))

  return { sections: navSections }
}

function buildComponentMap(): Record<string, React.ComponentType> {
  const mdxDocs = import.meta.glob<{ default: React.ComponentType }>('/src/docs/**/*.mdx', {
    eager: true,
  })
  const faqDocs = import.meta.glob<{ default: string }>('/src/docs/**/*.faq.md', {
    eager: true,
    query: '?raw',
  })

  const components: Record<string, React.ComponentType> = {}

  Object.entries(mdxDocs).forEach(([filePath, mod]) => {
    const match = filePath.match(/\/src\/docs\/([^/]+)\/([^/]+)\.mdx$/)
    if (match) {
      const [, section, page] = match
      components[`/docs/${section}/${page}`] = mod.default
    }
  })

  Object.entries(faqDocs).forEach(([filePath, mod]) => {
    const match = filePath.match(/\/src\/docs\/([^/]+)\/([^/]+)\.faq\.md$/)
    if (match) {
      const [, section, page] = match
      components[`/docs/${section}/${page}`] = () => createElement(FaqPage, { markdown: mod })
    }
  })

  return components
}

export const nav = generateNav()
export const docComponents = buildComponentMap()
