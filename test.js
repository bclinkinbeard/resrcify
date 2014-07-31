var test = require('tap').test
  , browserify = require('browserify')
  , fs = require('fs')
  , vm = require('vm')
  , resrcify = require('./')
  , read = function (name) {
    return fs.readFileSync(name, 'utf8')
  }

test('basic img tag with src', function (t) {
  t.plan(1)
  runFixture('basic', t)
})

test('multiple refs to different assets', function (t) {
  t.plan(1)
  runFixture('multiple-refs', t)
})

test('multiple refs to the same asset', function (t) {
  t.plan(1)
  runFixture('duplicate-refs', t)
})

test('video and audio tags', function (t) {
  t.plan(1)
  runFixture('multiple-tags', t)
})

test('opts.prefix', function (t) {
  t.plan(1)
  runFixture('multiple-refs', t, 'prefix', {prefix: 'images/'})
})

test('opts.dest', function (t) {
  t.plan(2)
  runFixture('basic', t, null, {dest: 'fixtures/assets/generated'}, function() {
    t.ok(fs.existsSync('./fixtures/assets/generated/390025aef74c5829.jpg'), 'file exists')
  })
})

test('opts.retainName', function (t) {
  t.plan(2)
  runFixture('basic', t, 'retain', {retainName: true, dest: 'fixtures/assets/generated'}, function() {
    t.ok(fs.existsSync('./fixtures/assets/generated/atomify-390025aef74c5829.jpg'), 'file exists')
  })
})

test('opts.retainName with prefix', function (t) {
  t.plan(2)
  runFixture('basic', t, 'prefix', {retainName: true, prefix: 'images/', dest: 'fixtures/assets/generated'}, function() {
    t.ok(fs.existsSync('./fixtures/assets/generated/atomify-390025aef74c5829.jpg'), 'file exists')
  })
})

function runFixture (dir, t, output, opts, cb) {
  output = output || 'output'
  var jsFix = './fixtures/' + dir + '/index.js'
    , htmlFix = read('./fixtures/' + dir + '/' + output + '.html')
    , b = browserify()

  b.add(jsFix)
  if (opts) {
    b.transform(opts, resrcify)
  } else {
    b.transform(resrcify)
  }

  b.bundle(function (err, src) {
    if (err) t.fail(err)
    vm.runInNewContext(src, { console: { log: log } })
    if (cb) cb()
  })

  function log (msg) {
    t.equal(msg, htmlFix)
  }
}
