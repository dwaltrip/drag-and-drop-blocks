import { extendModel, Base } from 'models/base';
import { WidgetListTable } from 'models/db-schema';
import { removeFromArray } from 'lib/utils';

// circular dependency
import Widget from 'models/widget';
import db from 'db';


export default extendModel(Base, {
  _fields: WidgetListTable.fields,
  tableName: WidgetListTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.widgets = instance.getWidgets();
    instance.sort();
    return instance;
  },

  instance: {
    widgets: null,
    workspace: null,

    getParentWidget: function() {
      return Widget.findByUID(this.parentWidget());
    },

    getWidgets: function() {
      return Widget.findWhere(widget => widget.parentList === this.uid());
    },

    contains: function(widget) {
      return widget.parentList() === this.uid();
    },

    remove: function(widget) {
      removeFromArray(this.widgets, widget);
      this.setPrevAndNextRefs();
    },

    createWidget: function(type) {
      var widget = Widget.create({
        type,
        parentList: this.uid(),
        workspace: this.getParentWidget().workspace()
      });
      this.widgets.push(widget);
      return widget;
    },

    insertAfter: function(widget, referenceWidget) {
      var refPos = referenceWidget.pos();
      if (!!refPos || refPos === 0) {
        var min = refPos;
        var max = referenceWidget.isLastWidget ? refPos + 1 : referenceWidget.nextWidget.pos();
        var newPos = (min + max) / 2.0;
        widget.pos(newPos);

        this.addWidgetIfNeeded(widget);
        // re-order the widgets, so the order matches the new pos values
        this.sort();
      } else {
        throw new Error('WidgetList.insertAfter -- referenceWidget must have a valid `pos` value');
      }
    },

    appendWidget: function(widget) {
      widget.pos(this.maxPos() + 1);
      widget.save();
      this.addWidgetIfNeeded(widget);
      this.sort();
      this.setPrevAndNextRefs();
    },

    sort: function() {
      this.widgets.sort((w1, w2) => w1.pos() - w2.pos());
      this.normalizePosValues();
      this.setPrevAndNextRefs();
    },

    maxPos: function() {
      var lastWidget = this.widgets.slice(-1).pop();
      return lastWidget ? lastWidget.pos() : 0;
    },

    // TODO: add code to Widget model that removes the need to
    // manually update all of these references. Should just be a function call
    //  [isFirstWidget, isLastWidget, prevWidget, nextWidget]
    setPrevAndNextRefs: function() {
      this.widgets.forEach((widget, index)=> {
        widget.prevWidget = widget.nextWidget = null;
        widget.isFirstWidget = widget.isLastWidget = false;

        if (index > 0) {
          widget.prevWidget = this.widgets[index - 1];
        } else {
          widget.isFirstWidget = true;
        }

        if (index < (this.widgets.length - 1)) {
          widget.nextWidget = this.widgets[index + 1];
        } else {
          widget.isLastWidget = true;
        }
      });
    },

    addWidgetIfNeeded: function(widget) {
      // add to the list if it's not in the list
      if (this.widgets.indexOf(widget) < 0) {
        this.widgets.push(widget);
        var workspaceUID = this.workspace ? this.workspace.uid()
          : this.getParentWidget().workspace();
        widget.workspace(workspaceUID)
        widget.parentList(this.uid());
        widget.save();
      }
    },

    // re-normalize pos values to integers (preserving order)
    normalizePosValues: function() {
      this.widgets.forEach((widget, index)=> {
        widget.pos(index + 1);
        widget.save({ isBatch: true });
      });
      db.commit();
    }
  }
});
