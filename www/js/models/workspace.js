
import { extendBaseModel, Base } from 'models/base';
import { WorkspaceTable } from 'models/db-schema';
import { removeFromArray } from 'lib/utils';

import Widget from 'models/widget';
import db from 'db';

export default extendBaseModel({
  _fields: WorkspaceTable.fields,
  tableName: WorkspaceTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);

    instance.rootWidgets = instance.getRootWidgets();
    instance.sortWidgets();
    instance.setPrevAndNextRefs();

    return instance;
  },

  instance: {
    rootWidgets: null,

    allWidgets: function() {
      return Widget.query({ query: { workspace: this.uid() } });
    },

    getRootWidgets: function() {
      var widgets = this.allWidgets().filter(widget => widget.isRoot());
      widgets.sort((w1, w2) => w1.pos() - w2.pos());
      return widgets;
    },

    createWidget: function(type) {
      return Widget.create({ type, workspace: this.uid() });
    },

    insertBefore: function(widget, referenceWidget) {
      var refPos = referenceWidget.pos();
      if (!!refPos || refPos === 0) {
        var min = referenceWidget.isFirstWidget ? refPos - 1 : referenceWidget.prevWidget.pos();
        var max = refPos;
        var newPos = (min + max) / 2.0;
        widget.pos(newPos);

        this.addWidgetIfNeeded(widget);
        // re-order the widgets, so the order matches the new pos values
        workspace.sortWidgets();
      } else {
        throw new Error('Workspace.insertBefore -- referenceWidget must have a valid `pos` value');
      }
    },

    removeWidget: function(widgetToDelete) {
      removeFromArray(this.rootWidgets, widgetToDelete)
      widgetToDelete.delete();
      this.setPrevAndNextRefs();
    },

    appendWidget: function(widget) {
      widget.pos(this.maxPos() + 1);
      widget.save();
      this.addWidgetIfNeeded(widget);
      this.sortWidgets();
      this.setPrevAndNextRefs();
    },

    sortWidgets: function() {
      this.rootWidgets.sort((w1, w2) => w1.pos() - w2.pos());
      this.normalizePosValues();
      this.setPrevAndNextRefs();
    },

    maxPos: function() {
      var lastWidget = this.rootWidgets.slice(-1).pop();
      return lastWidget ? lastWidget.pos() : 0;
    },

    // TODO: add code to Widget model that removes the need to
    // manually update all of these references. Should just be a function call
    //  [isFirstWidget, isLastWidget, prevWidget, nextWidget]
    setPrevAndNextRefs: function() {
      this.rootWidgets.forEach((widget, index)=> {
        widget.prevWidget = widget.nextWidget = null;
        widget.isFirstWidget = widget.isLastWidget = false;

        if (index > 0) {
          widget.prevWidget = this.rootWidgets[index - 1];
        } else {
          widget.isFirstWidget = true;
        }

        if (index < (this.rootWidgets.length - 1)) {
          widget.nextWidget = this.rootWidgets[index + 1];
        } else {
          widget.isLastWidget = true;
        }
      });
    },

    addWidgetIfNeeded: function(widget) {
      // add to the list if it's not in the list
      if (this.rootWidgets.indexOf(widget) < 0) {
        this.rootWidgets.push(widget);
        widget.workspace(this.uid());
        widget.makeRoot();
        widget.save();
      }
    },

    // re-normalize pos values to integers (preserving order)
    normalizePosValues: function() {
      this.rootWidgets.forEach((widget, index)=> {
        widget.pos(index + 1);
        widget.save({ isBatch: true });
      });
      db.commit();
    }
  }
});
