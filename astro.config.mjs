import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://meshcore.fi',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: { fi: 'MeshCore Suomi', en: 'MeshCore Finland' },
      description: 'MeshCore Suomessa — yhteisö, verkko ja käytännön oppaat.',
      defaultLocale: 'fi',
      locales: {
        fi: { label: 'Suomi', lang: 'fi' },
        en: { label: 'English', lang: 'en' },
      },
      social: [{ icon: 'discord', label: 'Mesh Finland Discord', href: 'https://discord.com/invite/GHnaVAjqed' }],
      customCss: ['./src/styles/site.css'],
      components: { PageTitle: './src/components/PageTitle.astro' },
      sidebar: [
        { label: 'Aloita tästä', translations: { en: 'Start here' }, items: ['guides/getting-started', 'faq/general'] },
        { label: 'Toistimet', translations: { en: 'Repeaters' }, items: ['repeaters/name', 'repeaters/placement'] },
      ],
      credits: false,
    }),
    react(),
  ],
});
