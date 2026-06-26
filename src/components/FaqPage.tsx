import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface FaqItem {
  question: string
  answer: string
}

interface ParsedFaq {
  title: string
  intro: string
  items: FaqItem[]
}

function parseFaq(markdown: string): ParsedFaq {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .replace(/^---\n[\s\S]*?\n---(?:\n|$)/, '')
    .split('\n')
  let title = 'FAQ'
  const intro: string[] = []
  const items: FaqItem[] = []
  let currentItem: FaqItem | null = null
  let hasSeenQuestion = false

  for (const line of lines) {
    const titleMatch = line.match(/^#(?!#)\s+(.+)$/)
    const questionMatch = line.match(/^##(?!#)\s+(.+)$/)

    if (titleMatch && !hasSeenQuestion && !currentItem) {
      title = titleMatch[1].trim()
      continue
    }

    if (questionMatch) {
      hasSeenQuestion = true

      if (currentItem) {
        currentItem.answer = currentItem.answer.trim()
        items.push(currentItem)
      }

      currentItem = {
        question: questionMatch[1].trim(),
        answer: '',
      }
      continue
    }

    if (currentItem) {
      currentItem.answer += `${line}\n`
    } else if (line.trim() || intro.length > 0) {
      intro.push(line)
    }
  }

  if (currentItem) {
    currentItem.answer = currentItem.answer.trim()
    items.push(currentItem)
  }

  return {
    title,
    intro: intro.join('\n').trim(),
    items,
  }
}

function MarkdownContent({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
}

type RawMarkdownSource = string | { default?: RawMarkdownSource }

interface FaqPageProps {
  markdown: RawMarkdownSource
}

function getMarkdownSource(markdown: RawMarkdownSource): string {
  if (typeof markdown === 'string') {
    return markdown
  }

  if (markdown.default) {
    return getMarkdownSource(markdown.default)
  }

  throw new Error('FAQ markdown source could not be loaded')
}

export function FaqPage({ markdown }: FaqPageProps) {
  const faq = parseFaq(getMarkdownSource(markdown))

  return (
    <article className="faq-page">
      <h1>{faq.title}</h1>

      {faq.intro ? (
        <div className="faq-intro">
          <MarkdownContent>{faq.intro}</MarkdownContent>
        </div>
      ) : null}

      <div className="faq-list">
        {faq.items.map(item => (
          <details className="faq-item" key={item.question}>
            <summary>{item.question}</summary>
            <div className="faq-answer">
              <MarkdownContent>{item.answer}</MarkdownContent>
            </div>
          </details>
        ))}
      </div>
    </article>
  )
}
