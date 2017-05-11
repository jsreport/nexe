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

// function which is stringified and appended to the resource file
// it should read the jsreport.exe, find the appropriate resources and read them
const parseResources = function (seekFromEnd) {
  var fs = require('fs')
  var totalSize = fs.statSync(process.execPath).size  
  var resourcesSize = 0
  Object.keys(embeddedFiles).forEach(function (f) {
    resourcesSize += embeddedFiles[f]
  })
  
  var fh = fs.openSync(process.execPath, 'r')
  var completeBuffer = new Buffer(resourcesSize)  
  fs.readSync(fh, completeBuffer, 0, resourcesSize, totalSize - seekFromEnd)

  var currentPos = 0

  Object.keys(embeddedFiles).forEach(function (f) {    
    embeddedFiles[f] = completeBuffer.slice(currentPos, currentPos + embeddedFiles[f])
    currentPos += embeddedFiles[f].length    
  })
}

function readFiles(resourceFiles) { 
  return resourceFiles.map((r) => ({
    path: r,
    buffer: fs.readFileSync(r)
  }))
}

/**
 * Embed files.
 *
 * @param {array} resourceFiles - array of files to embed.
 * @param {string} resourceRoot - root of resources.
 * @param {function} compelte   - callback
 **/
// create content of the file which, when required reads resources from the jsreport.exe
function createResourceFileContent(files, seekFromEnd, resourceRoot) {  
  var content = 'var embeddedFiles = {\n'
  content += files.reduce((a, f) => a + JSON.stringify(path.relative(resourceRoot, f.path)) + ':' + f.buffer.length + ',\n', '')  

  content += '\n};\n\n'
  content += 'var parse = ' + parseResources.toString() + '\nparse(' + seekFromEnd + ');\n'
  content += 'module.exports.keys = function () { return Object.keys(embeddedFiles); }\n\nmodule.exports = embeddedFiles'
  return content
}

function embed(resourceFiles, resourceRoot, options, complete) {  
  try {  
    // TODO remove this unused branch
    if (typeof resourceFiles !== 'object' || Array.isArray(resourceFiles)) {       
      const files = readFiles(resourceFiles)      
      return complete(null, {
         nexeres : createResourceFileContent(files, files.length, resourceRoot || ''),
         resourcesBuffer: files.reduce((a, f) => Buffer.concat([a, f.buffer]), new Buffer([]))
      })  
    }

    // read recource files
    let resources = Object.keys(resourceFiles).map((f => ({ resource: f, files: readFiles(resourceFiles[f]) })))      
    // calculate length of all resource groups
    resources.forEach((r) => (r.length = r.files.reduce((a, f) => a + f.buffer.length, 0), 0))    
    // the resource groups are stored at the end of jsreport.exe
    let seekFromEnd = resources.reduce((a, r) => a + r.length, 0) 

    const result = resources.map((r) => {
      const ret = {
        name: r.resource,
        content: {
          nexeres : createResourceFileContent(r.files, seekFromEnd, resourceRoot || ''),
          resourcesBuffer: r.files.reduce((a, f) => Buffer.concat([a, f.buffer]), new Buffer([]))
        }
      }
      // switch to next group, seek from end less
      seekFromEnd -= r.length
      return ret
    })

    complete(null, result)  
  } catch(e) {
    console.error(e)
    complete(e)
  }  
}

module.exports = embed
