import assert from 'lib/assert';
import { extendModel, Base } from 'models/base';
import { argsToArray, removeFromArray } from 'lib/utils';
import { TABLES } from 'models/db-schema';

// circular dependency
import Widget from 'models/widget';
import db from 'db';

export default extendModel(Base, {
  _fields: TABLES.widgetLists.fields,
  tableName: TABLES.widgetLists.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.widgets = instance._getWidgets();
    return instance;
  },

  instance: {
    widgets: null,
    workspace: null,

    isEmpty: function() { return this.widgets.length === 0; },
    contains: function(widget) { return this.widgets.indexOf(widget) > -1; },

    // only the top level list does not have a parent widget
    getParentWidget: function() {
      return Widget.findByUID(this.parentWidget()) || null;
    },

    slice:  proxyToWidgetArray('slice'),
    map:    proxyToWidgetArray('map'),

    getPos: function(pos) {
      assert(pos >= 0 && pos < this.widgets.length, 'getPos -- out of range');
      return this.widgets[pos];
    },

    delete: function() {
      var deleteArgs = argsToArray(arguments);
      this.widgets.forEach(widget => {
        widget.delete.apply(widget, deleteArgs);
      });
      return Base.instance.delete.apply(this, deleteArgs);
    },

    remove: function(widget) {
      removeFromArray(this.widgets, widget);
      this.normalizePosValues();
      widget.parentList(null);
      widget.save();
    },

    insertAfter: function(widget, referenceWidget) {
      var refIndex = this.widgets.indexOf(referenceWidget);
      assert(refIndex > -1, 'insertAfter -- referenceWidget is not in list.');
      assert(!this.contains(widget), 'insertAfter -- widget is already in list');
      this.linkToSelf(widget);
      this.widgets.splice(refIndex + 1, 0, widget);
      widget.pos(referenceWidget.pos() + 0.5);
      this.normalizePosValues(); // this calls save on widget
    },

    prepend: function(widget) {
      assert(!this.contains(widget), 'prepend -- widget is already in list');
      this.linkToSelf(widget);
      this.widgets.unshift(widget);
      var firstWidget = this.widgets[0];
      widget.pos(firstWidget ? firstWidget.pos() - 1 : 1);
      this.normalizePosValues(); // this calls save on widget
    },

    append: function(widget) {
      assert(!this.contains(widget), 'append -- widget is already in list');
      this.linkToSelf(widget);
      this.widgets.push(widget);
      var lastWidget = this.widgets.slice(-1).pop();
      widget.pos(lastWidget ? lastWidget.pos() + 1 : 1);
      this.normalizePosValues(); // this calls save on widget
    },

    linkToSelf: function(widget) {
      widget.parentList(this.uid());
      widget.workspace(this.workspaceId());
    },

    workspaceId: function() {
      return this.workspace ? this.workspace.uid() : this.getParentWidget().workspace();
    },

    // re-normalize pos values to equal the widget list indices
    // this allows to easily determine the prev & next widgets for each widget
    normalizePosValues: function() {
      this.widgets.forEach((widget, index)=> {
        widget.pos(index);
        widget.save({ isBatch: true });
      });
      db.commit();
    },

    _getWidgets: function() {
      return Widget.query({
        query: widget => widget.parentList === this.uid(),
        sort: [['pos', 'ASC']]
      });
    }
  }
});

function proxyToWidgetArray(fnName) {
  return function() {
    return this.widgets[fnName].apply(this.widgets, arguments);
  }
}
