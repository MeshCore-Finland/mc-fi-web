import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    mdx({ include: /\.mdx$/, remarkPlugins: [remarkFrontmatter, remarkGfm] }),
    react(),
    tailwindcss(),
  ],
})
