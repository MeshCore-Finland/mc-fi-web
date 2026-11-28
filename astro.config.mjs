import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { rename } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import { satteri } from '@astrojs/markdown-satteri';
import faqPages from './src/lib/faq-pages.mjs';
import { defaultLocale, locales } from './src/lib/locales';
import { resources } from './src/lib/site';
import sidebar from './sidebar.config.mjs';

// Give Pagefind's runtime and index a new URL whenever the locked dependencies change.
const dependencyHash = createHash('sha256')
  .update(readFileSync(new URL('./package-lock.json', import.meta.url)))
  .digest('hex')
  .slice(0, 12);
const pagefindDirectory = `pagefind-${dependencyHash}`;

export default defineConfig({
  site: 'https://meshcore.fi',
  trailingSlash: 'always',
  markdown: { processor: satteri() },
  vite: {
    build: {
      rolldownOptions: {
        onLog(level, log, defaultHandler) {
          // Astro's generated MDX asset wrapper carries this internal marker.
          // Keep every other directive warning and build diagnostic visible.
          if (
            level === 'warn' &&
            log.code === 'MODULE_LEVEL_DIRECTIVE' &&
            log.message.includes('"use astro:head-inject"') &&
            log.message.includes('?astroPropagatedAssets')
          )
            return;
          defaultHandler(level, log);
        },
      },
    },
  },
  integrations: [
    starlight({
      title: { fi: 'MeshCore Suomi', en: 'MeshCore Finland' },
      description: 'MeshCore Suomessa — yhteisö, verkko ja käytännön oppaat.',
      defaultLocale,
      locales,
      routeMiddleware: './src/routeData.ts',
      head: [
        {
          tag: 'script',
          attrs: { type: 'importmap' },
          content: JSON.stringify({
            imports: {
              '/pagefind/pagefind.js': `/${pagefindDirectory}/pagefind.js`,
            },
          }),
        },
      ],
      // The dedicated src/pages/404.astro route uses our Starlight layout.
      disable404Route: true,
      social: [
        {
          icon: 'discord',
          label: 'Mesh Finland Discord',
          href: resources.discord,
        },
        {
          icon: 'matrix',
          label: 'Meshcore Finland Matrix',
          href: 'https://matrix.to/#/#meshcore-finland:hacklab.fi',
        },
      ],
      customCss: ['./src/styles/site.css'],
      components: {
        PageTitle: './src/components/PageTitle.astro',
        Header: './src/components/Header.astro',
        Footer: './src/components/Footer.astro',
        MarkdownContent: './src/components/MarkdownContent.astro',
      },
      sidebar,
      credits: false,
    }),
    {
      name: 'version-pagefind-assets',
      hooks: {
        // Starlight writes the bundle first. Pagefind loads its worker and index beside the runtime.
        'astro:build:done': ({ dir }) =>
          rename(
            new URL('pagefind/', dir),
            new URL(`${pagefindDirectory}/`, dir),
          ),
      },
    },
    react(),
    faqPages(),
  ],
});
