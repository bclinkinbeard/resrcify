var test = require('tap').test
  , browserify = require('browserify')
  , fs = require('fs')
  , vm = require('vm')
  , resrcify = require('./')
  , read = function (name) {
    return fs.readFileSync(name, 'utf8')
  }

function runFixture (name, t) {
  var jsFix = './fixtures/' + name + '.js'
    , htmlFix = read('./fixtures/' + name + '-output.html')
    , b = browserify();

  b.add(jsFix);
  b.transform(resrcify);

  b.bundle(function (err, src) {
    if (err) t.fail(err);
    vm.runInNewContext(src, { console: { log: log } });
  });

  function log (msg) {
    t.equal(msg, htmlFix);
  }
}

test('dupes', function (t) {
  t.plan(1);
  runFixture('duplicate-refs', t);
});
