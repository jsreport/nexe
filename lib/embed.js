/**
 * Copyright (c) 2013 Craig Condon
 * Copyright (c) 2015-2016 Jared Allard
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 **/

'use strict'

let path = require('path'),
  fs = require('fs')

const parseResources = function () {
  var fs = require('fs')
  var totalSize = fs.statSync(process.execPath).size  
  var resourcesSize = 0
  Object.keys(embeddedFiles).forEach(function (f) {
    resourcesSize += embeddedFiles[f]
  })
  
  var fh = fs.openSync(process.execPath, 'r')
  var completeBuffer = new Buffer(resourcesSize)  
  fs.readSync(fh, completeBuffer, 0, resourcesSize, totalSize - resourcesSize)

  var currentPos = 0

  Object.keys(embeddedFiles).forEach(function (f) {    
    embeddedFiles[f] = completeBuffer.slice(currentPos, currentPos + embeddedFiles[f])
    currentPos += embeddedFiles[f].length    
  })
}

/**
 * Embed files.
 *
 * @param {array} resourceFiles - array of files to embed.
 * @param {string} resourceRoot - root of resources.
 * @param {function} compelte   - callback
 **/
function embed (resourceFiles, resourceRoot, options, complete) {
  resourceFiles = resourceFiles || []
  resourceRoot = resourceRoot || ''

  if (!Array.isArray(resourceFiles)) {
    throw new Error('Bad Argument: resourceFiles is not an array')
  }

  let finalContentBuffer = new Buffer([])
  let buffer = 'var embeddedFiles = {\n'
  for (let i = 0; i < resourceFiles.length; ++i) {
    let contentBuffer = fs.readFileSync(resourceFiles[i])
    buffer += JSON.stringify(path.relative(resourceRoot, resourceFiles[i])) + ':' + contentBuffer.length + ',\n'
    finalContentBuffer = Buffer.concat([finalContentBuffer, contentBuffer])
  }

  buffer += '\n};\n\n'
  buffer += 'var parse = ' + parseResources.toString() + '\nparse();\n'
  buffer += 'module.exports.keys = function () { return Object.keys(embeddedFiles); }\n\nmodule.exports = embeddedFiles'
  complete(null, { nexeres: buffer, resourcesBuffer: finalContentBuffer })
}

module.exports = embed
