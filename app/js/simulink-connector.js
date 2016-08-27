import * as d3 from './modeling/d3';
import _ from 'lodash';
import Promise from 'promise';
import RdfXmlParser from 'rdf-parser-rdfxml';
import {fetchXml, fetchGraph, matchForEachTriple, getOneObject, getOneObjectString, getOneSubject, getOneSubjectString, addTriple, renderHtmlPropsTable, getPropsProps, graphToString} from './rdf-utils';
import {VBoxLayout, ForceLayout, RelationComponent} from './modeling/index.js';

import ModelComponent from './model-component';
import ResourceTypeComponent from './resource-type-component';

let OSLC = suffix => 'http://open-services.net/ns/core#' + suffix;
let RDF = suffix => 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' + suffix;
let SIMULINK = suffix => 'http://mathworks.com/simulink/rdf#' + suffix;

var parser = new RdfXmlParser();

let currentGraph;

export var modelComponent = new ModelComponent('domain', modelNameInfoGetter).layout(new VBoxLayout().margin(10));
export var blockComponent = new ModelComponent('block', blockNameInfoGetter).layout(new VBoxLayout().margin(10));
var relationComponent = new RelationComponent('relation', d => [d.text]);

function modelNameInfoGetter(dn) {
  let prefix = getOneObjectString(currentGraph, dn, SIMULINK('Model/name'));
  return {
    name: prefix,
    domain: dn
  }
}

function blockNameInfoGetter(dn) {
  let prefix = getOneObjectString(currentGraph, dn, SIMULINK('Block/name'));
  return {
    name: prefix,
    domain: dn
  }
}

export function getRdfType(s) {
  let typeTriples = currentGraph.match(s, RDF('type'), null);
  if (typeTriples.length > 0) {
    return typeTriples.toArray()[0].object.toString();
  } else {
    return undefined;
  }
}

let modelId = 'https://vservices.offis.de/rtp/simulink/v1.0/services/model11/model/';

// returns a list of children of parentData
// parentData=undefined: list of domain URIs
// parentData=a domain uri: list of resource type uris in this domain
// other: empty list
export function getModelChildren(parentData, allData, level) {
  if (parentData) {
    let type = getRdfType(parentData.id);
    if (type === SIMULINK('Model')) {
      let resourceTypeTriples = currentGraph.match(parentData.id, SIMULINK('Model/block'), null);
      let arr = _.map(resourceTypeTriples.toArray(), t => {return {id: t.object.toString()}});
      // return _.uniq(arr);
      return _.uniq(_.filter(arr, d=>d.id.indexOf('::') === -1));
    } else {
      return [];
    }
  } else {
    // top level - return list of models
    let modelTriples = currentGraph.match(null, RDF('type'), SIMULINK('Model'));
    return _.uniq(_.map(modelTriples.toArray(), t => {return {id: t.subject.toString()}}));
  }
}

export function getModelComponent(d) {
  return {
    'http://mathworks.com/simulink/rdf#Model': modelComponent,
    'http://mathworks.com/simulink/rdf#Block': blockComponent
  }[getRdfType(d.id)];
}

// returns all relations as a list of {type: 'relation', from: sourceResourceTypeUri, to: targetResourceTypeUri}
export function getModelRelations(parentData) {
  if (parentData) {
    return [];
  } else {
    let rels = [];
    matchForEachTriple(currentGraph, modelId, SIMULINK('Model/line'), null, function(modelLineTriple) {
      let lineUri = modelLineTriple.object.toString();
      let sourcePortUri = getOneObjectString(currentGraph, lineUri, SIMULINK('Line/sourcePort'));
      let sourceBlockUri = getOneSubjectString(currentGraph, sourcePortUri, SIMULINK('Block/outputPort'));
      matchForEachTriple(currentGraph, lineUri, SIMULINK('Line/targetPort'), null, function(targetPortTriple) {
        let targetPortUri = targetPortTriple.object.toString();
        let targetBlockUri = getOneSubjectString(currentGraph, targetPortUri, SIMULINK('Block/inputPort'));

        if (sourceBlockUri && targetBlockUri) {
          let id = sourceBlockUri + '-' + targetBlockUri;
          let relationItem = {id: id, type: 'relation', text: '', from: sourceBlockUri, to: targetBlockUri};
          rels.push(relationItem);
        }
      });
    });
    return rels;
  }
}

export function getRelationComponent(d) {
  return {'relation': relationComponent}[d.type];
}

export function SimulinkConnector() {
  var listeners = [];

  function open(catalogUrls) {
    fireEvent('read-begin');
    currentGraph = parser.rdf.createGraph();

    function getResourceUrl(resourceId) {
      return fusekiUrl(`construct {?s ?p ?o.}
        where {graph ?g {
          ?s ?p ?o.
          ${resourceId} ?p ?o.}
        }`)
    }

    fetchGraph(getResourceUrl('<' + modelId + '>')).then(function(graph) {
      currentGraph = graph;
      // fetch model blocks
      let blockTriples = currentGraph.match(null, SIMULINK('Model/block'), null);
      let blockIds = _.map(blockTriples.toArray(), blockTriple => blockTriple.object.toString());
      return Promise.all(_.map(blockIds, blockId => fetchGraph(getResourceUrl('<' + blockId + '>'))));
    }).then(function(blockGraphs) {
      for (let blockGraph of blockGraphs) {
        currentGraph.addAll(blockGraph.toArray());
      }
      // fetch model lines
      let lineTriples = currentGraph.match(null, SIMULINK('Model/line'), null);
      let lineIds = _.map(lineTriples.toArray(), lineTriple => lineTriple.object.toString());
      return Promise.all(_.map(lineIds, lineId => fetchGraph(getResourceUrl('<' + lineId + '>'))));
    }).then(function(lineGraphs) {
      for (let lineGraph of lineGraphs) {
        currentGraph.addAll(lineGraph.toArray());
      }
      // console.log('currentGraph', graphToString(currentGraph));
      fireEvent('read-end');
    });


  }

  function fireEvent(type, data) {
    _.each(listeners, function(listener) {
      listener(type, data);
    });
  }

  return {
    on: function(listener) {
      listeners.push(listener);
    },
    open: open
  };

}

function fusekiUrl(sparql) {
  return 'https://vservices.offis.de/rtp/fuseki/v1.0/ldr/query?query='
    + encodeURIComponent(sparql);
}
