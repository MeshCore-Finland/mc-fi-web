import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import { satteri } from '@astrojs/markdown-satteri';
import faqPages from './src/lib/faq-pages.mjs';
import { defaultLocale, locales } from './src/lib/locales';
import sidebar from './sidebar.config.mjs';

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
      // The dedicated src/pages/404.astro route uses our Starlight layout.
      disable404Route: true,
      social: [
        {
          icon: 'discord',
          label: 'Mesh Finland Discord',
          href: 'https://discord.com/invite/GHnaVAjqed',
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
    react(),
    faqPages(),
  ],
});
