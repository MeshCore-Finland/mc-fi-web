export interface NavPage {
  title: string
  path: string
  slug: string
}

export interface NavSection {
  title: string
  slug: string
  pages: NavPage[]
}

export interface NavStructure {
  sections: NavSection[]
}

function formatTitle(text: string): string {
  // Strip leading numbers and dash (e.g., "01-getting-started" -> "getting-started")
  const cleaned = text.replace(/^\d+-/, '')
  return cleaned
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getSortKey(text: string): string {
  // Extract leading number for sorting
  const match = text.match(/^(\d+)-/)
  return match ? match[1] : '999'
}

function getSlug(text: string): string {
  // Strip leading number for slug
  return text.replace(/^\d+-/, '')
}

function generateNav(): NavStructure {
  const docs = import.meta.glob<{ default: React.ComponentType }>(
    '/docs/**/*.mdx',
    { eager: true }
  )

  const sections: Record<string, { pages: NavPage[]; sortKey: string }> = {}

  Object.keys(docs).forEach(path => {
    const match = path.match(/\/docs\/([^/]+)\/([^/]+)\.mdx$/)
    if (!match) return

    const [, sectionDir, pageFile] = match
    const sectionSlug = getSlug(sectionDir)

    if (!sections[sectionSlug]) {
      sections[sectionSlug] = { pages: [], sortKey: getSortKey(sectionDir) }
    }

    sections[sectionSlug].pages.push({
      title: formatTitle(pageFile),
      path: `/docs/${sectionDir}/${pageFile}`,
      slug: getSlug(pageFile),
    })
  })

  const navSections = Object.entries(sections)
    .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
    .map(([slug, { pages }]) => ({
      title: formatTitle(slug),
      slug,
      pages: pages.sort((a, b) => {
        // Sort by original file name (with numbers) to preserve order
        return a.slug.localeCompare(b.slug)
      }),
    }))

  return { sections: navSections }
}

function buildComponentMap(): Record<string, React.ComponentType> {
  const docs = import.meta.glob<{ default: React.ComponentType }>(
    '/docs/**/*.mdx',
    { eager: true }
  )

  const components: Record<string, React.ComponentType> = {}

  Object.entries(docs).forEach(([filePath, mod]) => {
    const match = filePath.match(/\/docs\/([^/]+)\/([^/]+)\.mdx$/)
    if (match) {
      const [, section, page] = match
      components[`/docs/${section}/${page}`] = mod.default
    }
  })

  return components
}

export const nav = generateNav()
export const docComponents = buildComponentMap()
