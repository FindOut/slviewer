var request = require('request');
var _ = require('lodash');

var q = 'http://localhost:8080/openrdf-sesame/repositories/SIMULINK?query=PREFIX%20ns1%3A%20%3Chttp%3A%2F%2Fmathworks.com%2Fsimulink%2Frdf%23%3E%0APREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0Aconstruct%20%7B%3Fs%20%3Fr%20%3Fo.%7D%20%0Awhere%20%7B%0A%20%20%3Fs%20%3Fr%20%3Fo%3B%0A%20%20%20%20rdf%3Atype%20ns1%3AModel%3B%0A%20%20%3Chttp%3A%2F%2Fmathworks.com%2Fsimulink%2Frdf%23Model%2Fname%3E%20%22sldemo_househeat%22%5E%5Erdf%3AXMLLiteral%20.%0A%7D%0A';

ldJsonRequest(q, function (v) {
  var blockById = new Map();
  var blocks = v[0]['http://mathworks.com/simulink/rdf#Model/block'];
  _.forEach(blocks, function(block) {
    console.log('block:',block['@id']);

    var blockQuery = 'http://localhost:8080/openrdf-sesame/repositories/SIMULINK?query=<' + block['@id'] + '>';
    ldJsonRequest(q, function (v) {
      // console.log('block:',v[0]);
    });
  });
});

function ldJsonRequest(url, f) {
  request({
    url: url,
    headers: {
      'Accept': 'application/ld+json'
    }
  }, function (error, response, body) {
    if (error || response.statusCode != 200) {
      throw 'error' + error;
    } else {
      f(JSON.parse(body));
    }
  });
}
