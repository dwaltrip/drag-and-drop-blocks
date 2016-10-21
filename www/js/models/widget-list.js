import { extendModel, Base } from 'models/base';
import { removeFromArray } from 'lib/utils';
import { TABLES } from 'models/db-schema';

// circular dependency
import Widget from 'models/widget';
import db from 'db';


export default extendModel(Base, {
  _fields: TABLES.widgetLists.fields,
  tableName: TABLES.widgetLists.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.widgets = instance.getWidgets();
    return instance;
  },

  instance: {
    widgets: null,
    workspace: null,

    getParentWidget: function() {
      return Widget.findByUID(this.parentWidget());
    },

    getWidgets: function() {
      return Widget.query({
        query: widget => widget.parentList === this.uid(),
        sort: [['pos', 'ASC']]
      });
    },

    contains: function(widget) {
      return widget.parentList() === this.uid();
    },

    remove: function(widget) {
      removeFromArray(this.widgets, widget);
      this.normalizePosValues();
      widget.parentList(null);
      widget.save();
    },

    createWidget: function(type) {
      return Widget.create({
        type,
        parentList: this.uid(),
        workspace: this.workspaceUID()
      });
    },

    insertAfter: function(widget, referenceWidget) {
      widget.pos(referenceWidget.pos() + 0.5);
      this.addWidgetIfNeeded(widget);
      this.sort();
    },

    prepend: function(widget) {
      var firstWidget = this.widgets[0];
      widget.pos(firstWidget ? firstWidget.pos() - 1 : 1);
      widget.save();
      this.addWidgetIfNeeded(widget);
      this.sort();
    },

    appendWidget: function(widget) {
      var lastWidget = this.widgets.slice(-1).pop();
      widget.pos(lastWidget ? lastWidget.pos() + 1 : 1);
      widget.save();
      this.addWidgetIfNeeded(widget);
      this.sort();
    },

    sort: function() {
      this.widgets.sort((w1, w2) => w1.pos() - w2.pos());
      this.normalizePosValues();
    },

    addWidgetIfNeeded: function(widget) {
      // add to the list if it's not in the list
      if (this.widgets.indexOf(widget) < 0) {
        this.widgets.push(widget);
        widget.workspace(this.workspaceUID());
        widget.parentList(this.uid());
        widget.save();
      }
    },

    workspaceUID: function() {
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
    }
  }
});
