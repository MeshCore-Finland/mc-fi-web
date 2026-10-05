import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import { satteri } from '@astrojs/markdown-satteri';
import faqPages from './src/lib/faq-pages.mjs';
import { defaultLocale, locales } from './src/lib/locales';

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
      sidebar: [
        {
          label: 'MeshCoren käyttäjäksi',
          translations: { en: 'Start using MeshCore' },
          // Osion sivujärjestys määritellään tässä
          items: ['guides/landing', 'guides/devices', 'guides/settings', 'guides/regions', 'guides/identity', 'guides/channels', 'guides/dms'],
        },
        {
          label: 'Verkon rakentajaksi',
          translations: { en: 'Build more MeshCore' },
          // Osion sivujärjestys määritellään tässä
          items: ['repeaters/landing', 'repeaters/devices', 'repeaters/flash', 'repeaters/settings', 'repeaters/construction', 'repeaters/regions', 'repeaters/planning', 'repeaters/observers', 'repeaters/tuning'],
        },
      ],
      credits: false,
    }),
    react(),
    faqPages(),
  ],
});
