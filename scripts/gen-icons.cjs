const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'icon.svg'), 'utf8');
const fonts = [
  path.join(root, 'fonts/Paperlogy-8ExtraBold.ttf'),
  path.join(root, 'fonts/Paperlogy-7Bold.ttf')
];

[[192, 'icons/icon-192.png'], [512, 'icons/icon-512.png'], [180, 'apple-touch-icon.png']].forEach(([size, out]) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false, defaultFontFamily: 'Paperlogy', fontFiles: fonts }
  });
  fs.writeFileSync(path.join(root, out), resvg.render().asPng());
  console.log('wrote', out);
});
