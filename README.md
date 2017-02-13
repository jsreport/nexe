#jsreport-nexe

Some minor adaptations to make [nexe](https://github.com/nexe/nexe) working with jsreport

1. Transform bundle and add require.resolve to all modules where it is used
2. Alter bootstrap_node.js and replace throwing errors with doing native require
3. Excluded nexeres from browserify to avoid resources duplication
4. Bundle option which just bundles the js and skip node.js download and compilation to enable quick testing