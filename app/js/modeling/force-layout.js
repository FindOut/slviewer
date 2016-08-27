import * as d3 from './d3';
import _ from 'lodash';
import * as utils from './utils';


export function ForceLayout() {
  let dispatch = d3.dispatch('tick');
  let margin = 5, fill = false;
  let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody());

  function layout(node) {
    console.log('ForceLayout');
    var max = {x: 0, y: 0};
    var gChildren = utils.selectAllImmediateChildNodes(node);

    var size = node.node().fomod.size(node);
    simulation
      .force("center", d3.forceCenter(size.width / 2, size.height / 2))
      .nodes(gChildren.data())
      .on("tick", ticked)
      .on('end', function(d) { console.log('end');})
      .alphaMin(0.5);

    let nodeById = _.keyBy(gChildren.data(), 'id');
    let links = [];
    d3.selectAll('.relation').each(function(d) {
      console.log('d', d);
      let fromObject = nodeById[d.from];
      let toObject = nodeById[d.to];
      if (fromObject && toObject) {
        links.push({source: d.from, target: d.to});
      }
    });
    simulation.force("link").links(links).distance(100);

    function ticked() {
      gChildren.each(function(d) {
        this.fomod.position(d3.select(this), {x: margin + d.x || 0, y: margin + d.y || 0});
      });
      dispatch.call('tick');
    }

    simulation.restart();
  }
  layout.childOffset = function() {
    return {x: margin, y: margin};
  };
  layout.margin = function(size) {
    if (size == undefined) {return margin;}
    margin = size;
    return layout;
  };
  layout.fill = function(t) { // true sets all child height to max child height
    if (t == undefined) {return fill;}
    fill = t;
    return layout;
  };
  layout.on = (type, listener) => {dispatch.on(type, listener); return layout;};

  return layout;
}
