const FS = require('fs')
    , PATH = require('path')
    , sass = require('sass')
    , postcss = require('postcss')
    , autoprefixer = require('autoprefixer')
    , asset = require('postcss-assets')({
    basePath: PATH.resolve(__dirname, '../src/stylesheet'),
    loadPaths: [ PATH.resolve(__dirname, '../src/stylesheet') ]
})
    , cssnano = require('cssnano')({
    preset: [
        'default', {
            discardComments: { removeAll: true },
            normalizeUnicode: false
        }
    ]
});

const outDir = PATH.resolve(__dirname, '../dist');

const compiled = sass.compile(
    PATH.resolve(__dirname, '../src/stylesheet/index.scss'),
    {
        sourceMap: false,
        verbose: true,
        style: 'expanded'
    }
);

postcss([ asset, autoprefixer ])
    .process(compiled.css, {
        from: PATH.resolve(__dirname, '../dist/index.css'),
        to: PATH.resolve(outDir, 'index.css'),
        map: false
    })
    .then(value => {
        const path = PATH.resolve(outDir, 'index.css');
        FS.writeFileSync(path, value.css, 'utf8');
    });

postcss([ asset, autoprefixer, cssnano ])
    .process(compiled.css, {
        from: PATH.resolve(__dirname, '../dist/index.css'),
        to: PATH.resolve(outDir, 'index.min.css'),
        map: {
            inline: false,
            sourcesContent: true,
            annotation: true,
            absolute: false,
            prev: false
        }
    })
    .then(value => {
        const path = PATH.resolve(outDir, 'index.min.css');
        FS.writeFileSync(path, value.css, 'utf8');
        FS.writeFileSync(`${path}.map`, value.map.toString(), 'utf8');
    });
