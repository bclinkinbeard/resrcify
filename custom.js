var through = require('through')
  , str2js = require('string-to-js')
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , crypto = require('crypto')
  , path = require('path')
  , url = require('url')

var types = ['html']
  , tag = /\<[img|video|audio][\S\s?!\<]*?src\=[\"\'](.*?)[\"\'][\S\s]*?\>/g
  , res

function resrcify (file, opts) {

  if (!isValidFile(file, opts)) return through()

  var buffer = ''

  return through(function (chunk) {
      buffer += chunk.toString()
    },
    function () {
      while ((res = tag.exec(buffer)) !== null) {
        buffer = buffer.replace(res[1], resrc(res[1], file, opts))
      }

      if (buffer.indexOf('module.exports') === 0) {
        this.queue(buffer); // prevent "double" transforms
      } else {
        this.queue(str2js(buffer));
      }
      this.queue(null)
    })

}

function resrc (asset, file, opts) {
  opts = opts || {}

  var destDir = opts.dest || ''
    , prefix = opts.prefix || ''
    , retainName = !!opts.retainName
    , onError = opts.onError || defaultError
    , processed = {}
    , u = url.parse(asset)

  // ignore abs urls
  if (u.protocol) {
    return asset
  }

  asset = u.pathname

  var baseDir = path.dirname(file)
    , srcFile = path.join(baseDir, asset)
    , contents

  if (hasOwn(processed, srcFile)) {
    return processed[srcFile]
  }

  try {
    contents = fs.readFileSync(srcFile)
  } catch (err) {
    onError(err)
    return asset
  }

  var hash = crypto.createHash('sha1')
    .update(contents)
    .digest('hex')
    .substr(0, 16)

  var ext = path.extname(asset)
    , origName = path.basename(asset, ext)
    , name = (retainName ? origName + '-' : '') + hash + ext
    , destFile = path.join(destDir, name)

  mkdirp.sync(destDir)
  fs.writeFileSync(destFile, contents)

  // ensure forward slashes on win
  processed[srcFile] = path.join(prefix, name).split('\\').join('/')
  return processed[srcFile]
}

exports.resrc = resrc

function isValidFile (file, opts) {
  var validTypes = types
  if (opts && opts.onlyAllow) validTypes = opts.onlyAllow
  if (opts && opts.alsoAllow) validTypes = validTypes.concat(opts.alsoAllow)
  if (!Array.isArray(validTypes)) validTypes = [validTypes]

  return validTypes.some(function (type) {
    return file.substr(-(type.length)) === type
  })
}

function defaultError (err) {
  throw err
}

function hasOwn (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

exports.onlyAllow = function (extensions) {
  if (extensions) {
    if (!Array.isArray(extensions)) extensions = Array.prototype.slice.call(arguments, 0)

    types = extensions
  }
  return resrcify
}

exports.alsoAllow = function (extensions) {
  if (!Array.isArray(extensions)) extensions = Array.prototype.slice.call(arguments, 0)
  types = types.concat(extensions)
  return resrcify
}
