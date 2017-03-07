#jsreport-nexe

Some minor adaptations to make [nexe](https://github.com/nexe/nexe) working with jsreport

1. Transform bundle and add require.resolve to all modules where it is used
2. Alter bootstrap_node.js and replace throwing errors with doing native require
3. Excluded nexeres from browserify to avoid resources duplication
4. Bundle option which just bundles the js and skip node.js download and compilation to enable quick testing
5. Embedding resources works in differn't way to optimize startup time and compilation of big resoruces.
   Instead of base64 encoding strings into js, it writes binary data inside the exe file into the end.
   These binary data are then read and parsed when nexeres is required
6. Avoid replacing invalid asci characters from the bundle