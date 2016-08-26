import * as d3 from './modeling/d3';
import {
  SvgComponent, HBoxLayout, VBoxLayout, HierarchyComponent, Manipulator,
  MoveNodeTool, CreateMoveRelationTool, SelectTool, utils
} from './modeling/index.js';
import {SimulinkConnector, getModelChildren, getModelComponent, getRelations, getRelationComponent, getRdfType, renderHtml} from './simulink-connector.js';

let connector = new SimulinkConnector();

// set up and listen to url field
let urlField = d3.select('#urlField').node();
urlField.value = 'https://vservices.offis.de/rtp/bugzilla/v1.0/services/catalog/singleton';
urlField.onchange = function() {connector.open(urlField.value);};

let svgComponent = new SvgComponent('top').layout(new HBoxLayout().margin(10));
let nodeHierarchyComponent = new HierarchyComponent(getModelChildren, getModelComponent);
let relationHierarchyComponent = new HierarchyComponent(getRelations, getRelationComponent);

function renderModel() {
  try {
    svgComponent(d3.select('#graph'), [{id: 'ws'}]);
    nodeHierarchyComponent(d3.select('#graph svg'));
    svgComponent.layout()(d3.select('#graph svg'));
    //relationHierarchyComponent(d3.select('#graph svg'));

    d3.selectAll('.node').call(nodeManipulator);
  } catch (e) {
    console.error('renderModel', e, e.stack);
  }
}

connector.on(function(eventType) {
  if (eventType === 'read-end') {
    renderModel();
  }
});

var nodeManipulator = new Manipulator()
  .add(new SelectTool()
    .on('select', (el, deselectEls) => {
      console.log('selection event');
    })
  );

connector.open(urlField.value);
