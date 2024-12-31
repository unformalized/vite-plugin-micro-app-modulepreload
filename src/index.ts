import type { Plugin } from 'vite';

const getScriptTagCode = (links: string[]) => {
  return `
  <script type="application/javascript">
  const scripts = [
    ${links.map((link) => `'${link}'`).join(',')}
  ];
  const links = [];
  document.querySelectorAll('link[rel="modulepreload"]').forEach(item => {
    if (item.href) {
      links.push(item.href);
    }
  });
  if (!links.length) {
    const startPrefix = location.href;
    Promise.all(scripts.map(link => {
      return import(link);
    }))
  }
</script>
  `;
};

export default (): Plugin => {
  return {
    name: 'vite-plugin-micro-app-js-preload',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const name in bundle) {
        let bundleItem = bundle[name];
        if (
          bundleItem.type === 'asset' &&
          bundleItem.fileName.endsWith('.html') &&
          typeof bundleItem.source === 'string'
        ) {
          const links = bundleItem.source.match(/<link rel="modulepreload" crossorigin href="(.+?)">/g);
          if (links && links.length) {
            const scriptTagCode = getScriptTagCode(
              links.flatMap((link) => {
                const matchRes = link.match(/<link rel="modulepreload" crossorigin href="(.+?)">/);
                if (matchRes && matchRes[1]) {
                  return [matchRes[1]];
                } else {
                  return [];
                }
              }),
            );
            bundleItem.source = bundleItem.source.replace(/<\/head>/, `${scriptTagCode}</head>`);
          }
        }
      }
    },
  };
};
