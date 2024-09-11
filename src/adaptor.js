'use strict';
import TableNode from './canvas/node';
import Edge from './canvas/edge';
import * as _ from 'lodash';

// 初始化数据转换
export let transformInitData = (data) => {
  let {
    tables, relations, columns, emptyContent, operator,
    _titleRender, _enableHoverChain, _emptyContent, _emptyWidth
  } = data;

  let result = {
    nodes: tables.map((item) => {
      return _.assign({
        Class: TableNode,
        _columns: columns,
        _emptyContent: emptyContent,
        _operator: operator,
        _titleRender,
        _enableHoverChain,
        _emptyContent,
        _emptyWidth
      }, item);
    }),
    edges: relations.map((item) => {
      return {
        id: item.id || `${item.srcTableId}-${item.tgtTableId}-${item.srcTableColName}-${item.tgtTableColName}`,
        type: 'endpoint',
        sourceNode: item.srcTableId,
        targetNode: item.tgtTableId,
        // source: item.srcTableColName,
        // target: item.tgtTableColName,
        source: (item.srcTableColName !== undefined && item.srcTableColName !== null) ? item.srcTableColName : item.srcTableId + '-right',
        target: (item.tgtTableColName !== undefined && item.tgtTableColName !== null) ? item.tgtTableColName : item.tgtTableId + '-left',
        _isNodeEdge: (item.srcTableColName === undefined || item.srcTableColName === null) && (item.tgtTableColName === undefined || item.tgtTableColName === null),
        Class: Edge
      }
    })
  };
  return result;
};

// 由于展开收缩会影响到线段，所以需要对线段进行转换
export let transformEdges = (nodes, edges) => {

  edges.forEach((item) => {
    if (!item._isNodeEdge) {
      item.source += '-right';
      item.target += '-left';
    }
  })

  nodes.forEach((node) => {
    if (node.isCollapse) {
      let sourceEdges = edges.filter((item) => {
        return node.id === item.sourceNode;
      });
      sourceEdges.forEach((item) => {
        item.source = `${node.id}-right`;
        item.sourceCollaps = true;
      });
      let targetEdges = edges.filter((item) => {
        return node.id === item.targetNode;
      });
      targetEdges.forEach((item) => {
        item.target = `${node.id}-left`;
        item.targetCollaps = true;
      });
    }
  });

  let edgesObj = {};
  let realEdges = [];

  edges.forEach((item) => {

    let existObj = edgesObj[`${item.sourceNode}-${item.source}-${item.targetNode}-${item.target}`];

    if (existObj) {
      _.assign(existObj, item);
    } else {
      edgesObj[`${item.sourceNode}-${item.source}-${item.targetNode}-${item.target}`] = item;
    }
  });

  for (let key in edgesObj) {
    realEdges.push(edgesObj[key]);
  }

  return {
    nodes,
    edges: realEdges
  }
}

export let diffPropsData = (newData, oldData) => {
  const isSameNode = (a, b) => a.id === b.id;
  let addNodes = _.differenceWith(newData.nodes, oldData.nodes, isSameNode);
  let rmNodes = _.differenceWith(oldData.nodes, newData.nodes, isSameNode);

  const isSameEdge = (a, b) => {
    return (
      a.sourceNode === b.sourceNode &&
      a.targetNode === b.targetNode &&
      a.source === b.source &&
      a.target === b.target
    );
  }

  let addEdges = _.differenceWith(newData.edges, oldData.edges, isSameEdge);
  let rmEdges = _.differenceWith(oldData.edges, newData.edges, isSameEdge);

  const isCollapseNodesChange = (a, b) => a.id === b.id && a.isCollapse === b.isCollapse;
  let collapseNodes = _.differenceWith(newData.nodes, oldData.nodes, isCollapseNodesChange);
  collapseNodes = _.differenceWith(collapseNodes, addNodes, isSameNode);

  return {
    addNodes,
    rmNodes,
    addEdges,
    rmEdges,
    collapseNodes,
  };
}

export let updateCanvasData = (newNodes, oldNodes) => {
  oldNodes.forEach((item) => {
    let newNode = _.find(newNodes, (_item) => _item.id === item.id);
    _.assign(item.options, newNode);
  });
}

export let diffActionMenuData = (newMenu, oldMenu) => {
  const isSameMenu = (a, b) => a.key === b.key;
  let addMenu = _.differenceWith(newMenu, oldMenu, isSameMenu);
  let rmMenu = _.differenceWith(oldMenu, newMenu, isSameMenu);
  return addMenu.length !== 0 || rmMenu.length !== 0;
}
