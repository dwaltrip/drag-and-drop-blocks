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
    isInTransaction: false,
    transactionActions: null,

    // Public methods

    undo: function() {
      var actions = this.undoStack.pop();
      if (!actions) { return; }

      this.redoStack.push(actions);
      // multi-step actions are undone in the reverse order
      return actions.slice().reverse().map(this._performUndo.bind(this));
    },

    redo: function() {
      var actions = this.redoStack.pop();
      if (!actions) { return; }

      this.undoStack.push(actions);
      return actions.map(this._performRedo.bind(this));
    },

    recordAction: function(action) {
      assertRequired(action, ['type', 'source', 'dest', 'count', 'widgetData'], 'recordAction');
      if (this.isInTransaction) {
        this.transactionActions.push(action);
      } else {
        this.undoStack.push([action]);
      }
      // new actions invalidate all of the stored redos (as they may conflict)
      this.redoStack = [];
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

    asTransaction: function(fn) {
      var undoService = this;
      return function() {
        undoService.isInTransaction = true;
        undoService.transactionActions = [];

        fn.apply(this, arguments);
        undoService.undoStack.push(undoService.transactionActions);

        undoService.isInTransaction = false;
        undoService.transactionActions = null;
      };
    },

    // Private methods

    _performUndo: function(action) {
      var fns = {
        [CREATE]: this._undoCreate,
        [DELETE]: this._undoDelete,
        [MOVE]:   this._undoMove
      };
      return fns[action.type].call(this, action);
    },

    _performRedo: function(action) {
      var fns = {
        [CREATE]: this._redoCreate,
        [DELETE]: this._redoDelete,
        [MOVE]:   this._redoMove
      };
      return fns[action.type].call(this, action);
    },

    _undoCreate: function(action) {
      return this._deleteWidgets(action.dest, action.count);
    },
    _redoDelete: function(action) {
      return this._deleteWidgets(action.source, action.count);
    },

    _undoDelete: function(action) {
      return this._createWidgets(action.widgetData, action.source);
    },
    _redoCreate: function(action) {
      return this._createWidgets(action.widgetData, action.dest);
    },

    _undoMove: function(action) {
      // for an undo, source and dest are swapped
      return this._moveWidgets({ source: action.dest, dest: action.source, count: action.count });
    },
    _redoMove: function(action) {
      // for a redo, use source and dest exactly as in the original action
      return this._moveWidgets(action);
    },

    _createWidgets: function(widgetData, coord) {
      var newWidgets = widgetData.map(data => {
        return deserializeWidget(data, this.workspace.uid());
      });
      this._putWidgets(newWidgets, coord);
      return newWidgets;
    },

    _deleteWidgets: function(coord, count) {
      this._findWidgetsAtCoord(coord, count).forEach(widget => {
        widget.disconnect();
        widget.delete();
      });
      return null;
    },

    _moveWidgets: function(opts) {
      var widgets = this._findWidgetsAtCoord(opts.source, opts.count);
      widgets.forEach(widget => widget.disconnect());
      this._putWidgets(widgets, opts.dest);
      return widgets;
    },

    _putWidgets: function(widgets, dest) {
      if (doesPointToSlot(dest)) {
        var parentWidget = this._findSingleWidgetAtCoord(dest.slice(0, -1));
        parentWidget.setInput(getSlotName(dest), widgets[0])
      } else {
        if (dest.length === 1) {
          var list = this.workspace.getWidgetList();
          var pos = dest[0];
        } else {
          var listDetails = getListDetails(dest);
          var parentWidget = this._findSingleWidgetAtCoord(dest.slice(0, -1))
          var list = parentWidget.getInputList(listDetails.name);
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

    _findWidgetsAtCoord: function(coord, count) {
      var firstWidget = this._findSingleWidgetAtCoord(coord);
      if (firstWidget.isInSlot()) {
        assert(count === 1, 'Slots can only have 1 widget');
        return [firstWidget];
      } else {
        var pos = firstWidget.pos();
        return firstWidget.getParentList().slice(pos, pos + count);
      }
    },

    _findSingleWidgetAtCoord: function(parts) {
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

function assertRequired(obj, attrs, prefix) {
  attrs.forEach(name => {
    assert(typeof obj[name] !== 'undefined', `${prefix} -- '${name}' is required.`);
  });
}
