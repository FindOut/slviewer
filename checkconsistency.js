var data = require('./all.json');
var _ = require('lodash');

var
  listFirstCount = 5,
  genIdCount = 0;
  var inputPortTotals = {existing: 0, nonExisting: 0};
  var outputPortTotals = {existing: 0, nonExisting: 0};
var subjById = _.keyBy(data, '@id');
console.log('subjects', data.length,'subjects with @id', Object.keys(subjById).length);
_.forEach(data, function(subj) {
  var subjId = subj['@id'];
  if (subjId.substring(0, 7) =='_:genid') {
    genIdCount++;
  } else {
    if (subj['@type'] == 'http://mathworks.com/simulink/rdf#Model') {
      console.log('model',subjId);
      checkModelLines(subj);
    }

    // checkRefs(subj, 'input ports', 'http://mathworks.com/simulink/rdf#Block/outputPort', subjId, inputPortTotals);
    // checkRefs(subj, 'output ports', 'http://mathworks.com/simulink/rdf#Block/outputPort', subjId, outputPortTotals);
  }
});

function checkModelLines(model) {
  var lines = model['http://mathworks.com/simulink/rdf#Model/line'];

    // find lines without definition
    var lineNoDefCount = 0;
    _.forEach(lines, function(lineRef) {
      if (!subjById[lineRef['@id']]) {
        console.log('  missing line def:',lineRef['@id']);
        lineNoDefCount++;
      }
    });
    console.log(' ',lineNoDefCount,'lines of',lines.length);

    // find lines with undefined ends
    var lineNoDefCount = 0;
    _.forEach(lines, function(lineRef) {
      var line = subjById[lineRef['@id']];
      if (line) {
        _.forEach(line['http://mathworks.com/simulink/rdf#Line/sourcePort'], function(sourcePortRef) {
          if (!subjById[sourcePortRef['@id']]) {
            console.log('  missing line sourcePort def:',sourcePortRef['@id'],'in line',lineRef['@id']);
          }
      });
    }
    });
}

function checkRefs(subj, label, predName, subjId, totals) {
  var objects = subj[predName];
  if (objects) {
    _.forEach(objects, function(objRef) {
      var objId = objRef['@id'];
      if (subjById[objId]) {
        totals.existing++;
      } else {
        listFirstFew(label + ' without definition', objId + ' of ' + subjId, totals.nonExisting, listFirstCount);
        totals.nonExisting++;
      }
    })
  }
}

// print obj when i is < maxCount, and print ... when i == maxCount
function listFirstFew(label, obj, i, maxCount) {
  if (i == 0) {
    console.log(label);
  }
  if (i < maxCount) {
    console.log(' ',obj);
  } else if (i == maxCount) {
    console.log('  ...');
  }
}
