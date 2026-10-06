// Keep each page on its own line so individual entries can be commented out.
export default [
  {
    label: 'MeshCoren käyttäjäksi',
    translations: { en: 'Start using MeshCore' },
    // Osion sivujärjestys määritellään tässä
    // prettier-ignore
    items: [
      'users/start',
      'users/devices',
      'users/settings',
      'users/regions',
      'users/identity',
      'users/channels',
      'users/dms',
    ],
  },
  {
    label: 'Verkon rakentajaksi',
    translations: { en: 'Build more MeshCore' },
    // Osion sivujärjestys määritellään tässä
    // prettier-ignore
    items: [
      'repeaters/start',
      'repeaters/devices',
      'repeaters/flash',
      'repeaters/settings',
      'repeaters/regions',
      // 'repeaters/construction',
      // 'repeaters/planning',
      // 'repeaters/tuning',
    ],
  },
  {
    label: 'Työkalut',
    translations: { en: 'Tools' },
    // Osion sivujärjestys määritellään tässä
    // prettier-ignore
    items: [
//      'tools/start',
//      'tools/corescope',
//      'tools/meshmapper',
      'tools/observers',
    ],
  },

];
