var express = require('express');
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpack = require("webpack");
var config = require("./webpack.config.js");
var path = require('path');
var http = require('request');
var fs = require('fs');

var port = 3010;
var useCache = true;

var app = express();
app.use(webpackDevMiddleware(webpack(config), {}));

app.get('/proxy', function (request, response) {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.header('Pragma', 'no-cache');
  response.header('Expires', '0');
  if (useCache) {
    response.header('Content-Type', 'application/xml');
    response.send(getFromCache(request.query.url));
  } else {
    http.get({
      url: request.query.url,
      headers: copyHeaders(request.headers, ['authorization', 'accept'])
    }, function (error, resp, body) {
      // copy all headers from resp to response
      for (var key in resp.headers) {
        response.header(key, resp.headers[key]);
      }
      var correctedBody = body;
      if (!error) {
        saveToCache(request.query.url, correctedBody);
      }
      response
        .status(resp.statusCode)
        .send(correctedBody);
    });
  }
});

// returns an object containing non-empty headers
// in headerNameList copied from srcHeaders
function copyHeaders(srcHeaders, headerNameList) {
  toHeaders = {};
  for (var namei in headerNameList) {
    var name = headerNameList[namei];
    if (srcHeaders[name]) {
      toHeaders[name] = srcHeaders[name];
    }
  }
  return toHeaders;
}

app.use('/', express.static(path.resolve('./app')));
app.listen(port, function () {
  console.log('listening at localhost:' + port);
});

var cacheFolder = 'cache';
if (!fs.existsSync(cacheFolder)) {
  fs.mkdirSync(cacheFolder);
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function saveToCache(url, result) {
  var queryIndex = url.indexOf('?query=');
  var sparql = queryIndex !== -1 ? decodeURIComponent(url.substring(queryIndex + 7)) : '';
  fs.writeFile(path.join(cacheFolder, 'hash' + url.hashCode()) + '.query', url + '\n' + sparql, 'utf8');
  fs.writeFile(path.join(cacheFolder, 'hash' + url.hashCode()) + '.xml', result, 'utf8');
}
function getFromCache(url) {
  return fs.readFileSync(path.join(cacheFolder, 'hash' + url.hashCode()) + '.xml', 'utf8');
}
