var partialify = require('partialify');
var through = require('through'),
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  crypto = require('crypto'),
  path = require('path'),
  url = require('url'),
  str2js = require('string-to-js');

var img = /\<img[\S\s]*?src\=[\"\'](.*?)[\"\'][\S\s]*?\>/g,
  res;

module.exports = function (file, opts) {

  if (file.substr(-4) !== 'html') return through();

//  if (!isValidFile(file, opts)) return through();

  var buffer = "";

  return through(function (chunk) {
      buffer += chunk.toString();
    },
    function () {

      while ((res = img.exec(buffer)) !== null) {
        buffer = buffer.replace(res[1], replace(res[1], file, opts))
      }

      fs.writeFileSync('./foo.html', buffer, 'utf8')
      this.queue(str2js(buffer));
      this.queue(null);
    });

};

function replace (asset, file, opts) {
  opts = opts || {};
  var destDir = opts.dest || 'fixtures/images';
  var onError = opts.onError || defaultError;
  var prefix = opts.prefix || 'images/';
  var processed = {};

  var u = url.parse(asset);
  if (u.protocol) {
    return asset;
  }

  asset = u.pathname;

//        var source = this.position && this.position.source;
//        var baseDir = source
//          ? path.resolve(srcDir, path.dirname(source))
//          : srcDir;
  var baseDir = path.dirname(file);

  var srcFile = path.join(baseDir, asset);
//        if (hasOwn(processed, srcFile)) {
//          return destUrl(processed[srcFile], u);
//        }

  var contents;
  try {
    contents = fs.readFileSync(srcFile);
  } catch (err) {
    onError(err);
    return asset;
  }

  var hash = crypto.createHash('sha1')
    .update(contents)
    .digest('hex')
    .substr(0, 16);

  var name = hash + path.extname(asset);
  var destFile = path.join(destDir, name);
  mkdirp.sync(destDir);
  fs.writeFileSync(destFile, contents);

//        processed[srcFile] = name;
  return path.join(prefix, name);
}

function defaultError(err) {
  throw err;
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
