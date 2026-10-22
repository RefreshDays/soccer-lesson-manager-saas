const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

[
  ['icon.svg', 192, 'icons/icon-192.png'],
  ['icon.svg', 512, 'icons/icon-512.png'],
  ['icon.svg', 180, 'apple-touch-icon.png'],
  ['icon-maskable.svg', 512, 'icons/icon-maskable-512.png']
].forEach(([src, size, out]) => {
  const resvg = new Resvg(read(src), { fitTo: { mode: 'width', value: size } });
  fs.writeFileSync(path.join(root, out), resvg.render().asPng());
  console.log('wrote', out);
});
