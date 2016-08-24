var path = require('path');
var http = require('request');
var fs = require('fs');

http.get({
  url: 'https://vservices.offis.de/rtp/fuseki/v1.0/ldr/query?query=select+*+where+{+GRAPH+?g+{+?s+?p+?o+}}+LIMIT+10',
  'auth': {
   'user': 'dag.rende@find-out.se',
   'pass': '98XV\\Qn$IHNk?Lgd'
  }
  ,
  headers: {'Accept': 'application/n-triples'}
}, function (error, resp, body) {
  if (error) {
    console.error(error);
  } else {
    console.log(body);
  }
});
