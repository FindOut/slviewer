var express = require('express');
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpack = require("webpack");
var config = require("./webpack.config.js");
var path = require('path');
var http = require('request');
var fs = require('fs');

var port = 3010;
var useCache = false;

var app = express();
app.use(webpackDevMiddleware(webpack(config), {}));

app.get('/sch', function(request, response) {
  response.header('Content-Type: text/json');
  fs.readFile('docschematic.json', function(err, data) {
    console.log(err,data);
    if (!err) {
      response.send(String(data));
    }
  });
});

app.get('/proxy', function (request, response) {
  console.log('get /proxy');
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.header('Pragma', 'no-cache');
  response.header('Expires', '0');
  if (useCache) {
    response.header('Content-Type', 'application/xml');
    response.send(getFromCache(request.query.url));
  } else {
    console.log('url=',request.query.url);
    http.get({
      url: request.query.url,
      headers: copyHeaders(request.headers, ['authorization', 'accept'])
    }, function (error, resp, body) {
      // copy all headers from resp to response
      for (var key in resp.headers) {
        response.header(key, resp.headers[key]);
      }
      if (!error) {
        saveToCache(request.query.url, body);
      }
      response
        .status(resp.statusCode)
        .send(body);
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

function saveToCache(url, result) {
  fs.writeFile(path.join(cacheFolder, encodeURIComponent(url)) + '.xml', result, 'utf8');
}
function getFromCache(url) {
  return fs.readFileSync(path.join(cacheFolder, encodeURIComponent(url)) + '.xml', 'utf8');
}
