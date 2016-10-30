import assert from 'lib/assert';
import { merge } from 'lib/utils';

import { deserializeWidget, serializeWidget } from 'models/widget-serializer';

const CREATE = 'CREATE';
const MOVE = 'MOVE';
const DELETE = 'DELETE';

export default {
  ACTION_TYPES: {
    [CREATE]: CREATE,
    [MOVE]: MOVE,
    [DELETE]: DELETE
  },

  create: function(data) {
    var instance = Object.create(this.instance);
    instance.class = this;
    instance.workspace = data.workspace;
    instance.undoStack = [];
    instance.redoStack = [];
    return instance;
  },

  instance: {
    workspace: null,
    undoStack: null,
    redoStack: null,

    // Public methods

    undo: function() {
      var action = this.undoStack.pop();
      if (!action) { return; }
      assert(action.type in this.class.ACTION_TYPES,
        `UndoService.undo -- invalid action type '${action.type}'`);

      if      (action.type === CREATE)  { this._undoCreate(action); }
      else if (action.type === DELETE)  { this._undoDelete(action); }
      else if (action.type === MOVE)    { this._undoMove(action); }

      this.redoStack.push(action);
    },

    redo: function() {
      // the opposite of undo!
    },

    recordAction: function(action) {
      assertRequired(action, ['type', 'source', 'dest', 'count', 'widgetData'], 'recordAction');
      this.undoStack.push(action);
    },

    recordCreateAction: function(opts) {
      this.recordAction({
        type: CREATE,
        source: null,
        dest: this.getCoord(opts.widgets[0]),
        count: opts.widgets.length,
        widgetData: opts.widgets.map(serializeWidget)
      });
    },

    recordDeleteAction: function(opts) {
      this.recordAction({
        type: DELETE,
        source: this.getCoord(opts.widgets[0]),
        dest: null,
        count: opts.widgets.length,
        widgetData: opts.widgets.map(serializeWidget)
      });
    },

    recordMoveAction: function(opts) {
      this.recordAction(merge(opts, { type: MOVE, widgetData: null }));
    },

    getCoord: function(widget) {
      var parts = [];
      var parent = widget;
      while (parent) {
        if (parent.isRoot()) {
          parts.push(parent.pos());
        }
        else if (parent.isInList()) {
          parts.push(`list=${parent.getParentList().name()}&pos=${parent.pos()}`);
        }
        else if (parent.isInSlot()) {
          parts.push(`slot=${parent.slotName()}`);
        }
        parent = parent.getContainingWidget();
      }
      return parts.reverse();
    },

    // Private methods

    _undoCreate: function(action) {
      var widgets = this._fetchWidgetsFromActionDest(action);
      widgets.forEach(widget => {
        widget.disconnect();
        widget.delete();
      });
    },

    _undoDelete: function(action) {
      var undeletedWidgets = action.widgetData.map(data => {
        return deserializeWidget(data, this.workspace.uid());
      });
      this._moveWidgets(undeletedWidgets, action.source);
    },

    _undoMove: function(action) {
      var widgets = this._fetchWidgetsFromActionDest(action);
      widgets.forEach(widget => widget.disconnect());
      this._moveWidgets(widgets, action.source);
    },

    _moveWidgets: function(widgets, dest) {
      if (doesPointToSlot(dest)) {
        var parentWidget = this._findWidgetAtCoord(dest.slice(0, -1));
        parentWidget.setInput(getSlotName(dest), widgets[0])
      } else {
        if (dest.length === 1) {
          var list = this.workspace.getWidgetList();
          var pos = dest[0];
        } else {
          var listDetails = getListDetails(dest);
          var list = this._findWidgetAtCoord(dest.slice(0, -1)).getInputList(listDetails.name);
          var pos = listDetails.pos;
        }

        if (pos === 0) {
          widgets.reverse().forEach(widget => list.prepend(widget));
        } else {
          var refWidget = list.getPos(pos - 1);
          widgets.reverse().forEach(widget => list.insertAfter(widget, refWidget));
        }
      }
    },

    _fetchWidgetsFromActionDest: function(action) {
      var firstWidget = this._findWidgetAtCoord(action.dest);
      if (firstWidget.isInSlot()) {
        assert(action.count === 1, 'Slots can only have 1 widget');
        return [firstWidget];
      } else {
        var pos = firstWidget.pos();
        return firstWidget.getParentList().slice(pos, pos + action.count);
      }
    },

    _findWidgetAtCoord: function(parts) {
      var rootPos = parseInt(parts[0]);
      var currentWidget = this.workspace.getWidgetList().widgets[rootPos];
      parts.slice(1).forEach(part => {
        if (part.substr(0,4) === 'slot') {
          var slotName = part.split('=')[1];
          currentWidget = currentWidget.getInput(slotName);
        } else if (part.substr(0,4) === 'list') {
          var attrs = part.split('&');
          var listName = attrs[0].split('=')[1];
          var pos = parseInt(attrs[1].split('=')[1]);
          currentWidget = currentWidget.getInputList(listName).getPos(pos);
        }
      });
      return currentWidget;
    }
  }
};

function doesPointToSlot(coord) {
  var lastPart = coord[coord.length - 1];
  return lastPart.substr && lastPart.substr(0,4) === 'slot';
}

function getSlotName(coord) {
  if (!doesPointToSlot(coord)) { return null; }
  var lastPart = coord[coord.length - 1];
  return lastPart.split('=')[1];
}

function doesPointToListPos(coord) {
  var lastPart = coord[coord.length - 1];
  return coord.length == 1 || lastPart.substr(0,4) === 'list';
}

function getListDetails(coord) {
  if (!doesPointToListPos(coord)) { return null; }
  var lastPart = coord[coord.length - 1];
  var [name, pos] = lastPart.split('&').map(attr => attr.split('=')[1]);
  return { name, pos: parseInt(pos) };
}

/*
do a -- undo: [a]
        redo: [a]
do b -- undo: [a, b]
        redo: [b]
do c -- undo: [a, b, c]
        redo: [c]

undo -- undo: [a, b, c]
        redo: [c]

CAN_REPEAT_REDOS: false // if we have done one or more undos since the last new action
CAN_REPEAT_REDOS: true // if we have zero undos since the last new actinon (no restriction on redos)
*/

function assertRequired(obj, attrs, prefix) {
  attrs.forEach(name => {
    assert(typeof obj[name] !== 'undefined', `${prefix} -- '${name}' is required.`);
  });
}
