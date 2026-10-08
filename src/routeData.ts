import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware((context) => {
  const { starlightRoute } = context.locals;

  // Keep untranslated fallback URLs out of search until a translation exists.
  if (starlightRoute.isFallback) {
    starlightRoute.head.push({
      tag: 'meta',
      attrs: { name: 'robots', content: 'noindex, follow' },
    });
  }
});
