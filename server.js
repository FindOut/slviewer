var express = require('express');
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpack = require("webpack");
var config = require("./webpack.config.js");
var path = require('path');
var fs = require('fs');

var port = 3010;

var app = express();
app.use(webpackDevMiddleware(webpack(config), {}));

app.get('/proxy', function (request, response) {
  console.log('url', request.query.url);

  // var useCache = false;
  // if (useCache) {
  //   response.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  //   response.header('Pragma', 'no-cache');
  //   response.header('Expires', '0');
  //   response.header('Content-Type', 'application/xml');
  //   response.header('Access-Control-Allow-Origin', '*');
  //   response.send(getFromCache(request.query.url));
  // } else {
  //   http.get({
  //     url: request.query.url,
  //     auth: local_config.auth,
  //     headers: {
  //       'Accept': 'application/rdf+xml'
  //     }
  //   }, function (error, resp, body) {
  //     if (error || resp.statusCode != 200) {
  //       console.error('error', error);
  //       console.error('status', resp && resp.statusCode);
  //       response.status(500).send(error);
  //     } else {
  //       response.header('ETag', 'asdqweasd');
  //       response.header('Content-Type', 'application/xml');
  //       response.header('Access-Control-Allow-Origin', '*');
  //       var result = body
  //         //.replace(/bugzilla/g, 'simulink')
  //         //  .replace(/simulink/g, 'bugzilla')
  //         // .replace(/http:\/\/10\.238\.2\.156:8080\/oslc4jsimulink/g,
  //         //   'https://vservices.offis.de/rtp/simulink/v1.0/services')
  //         // .replace(/http:\/\/10\.238\.2\.156:8080\/oslc4jbugzilla/g,
  //         //   'https://vservices.offis.de/rtp/bugzilla/v1.0/services');
  //       // saveToCache(request.query.url, result);
  //       console.log(result);
  //       response.send(result);
  //     }
  //   });
  // }
});

app.get('/schematic', function(request, response) {
  response.header('Content-Type: text/json');
  fs.readFile('docschematic.json', function(err, data) {
    console.log(err,data);
    if (!err) {
      response.send(String(data));
    }
  });
});

app.use('/', express.static(path.resolve('./app')));
app.listen(port, function() {
  console.log('listening at localhost:' + port);
});
