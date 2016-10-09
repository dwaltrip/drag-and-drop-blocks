
import Base from 'models/base';
import extend from 'lib/object-extend';

import { WorkspaceTable } from 'models/db-schema';
import { removeFromArray } from 'lib/utils';

import Widget from 'models/widget';
import db from 'db';

export default extend(Base, {
  _fields: WorkspaceTable.fields,
  tableName: WorkspaceTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);

    var uidsAsHash = instance.widgetIds().reduce((memo, uid) => {
      memo[uid] = true;
      return memo;
    }, {});

    instance.widgets = Widget.query({ query: row => !!(row.uid in uidsAsHash) });
    instance.sortWidgets();
    instance.setPrevAndNextRefs();

    return instance;
  },

  instance: extend(Base.instance, {
    widgets: null,

    createWidget: function(name) {
      var widget = Widget.create({ name, inputs: [], pos: null });
      widget.save();
      return widget;
    },

    insertBefore: function(widget, referenceWidget) {
      var refPos = referenceWidget.pos();
      if (!!refPos || refPos === 0) {
        var min = referenceWidget.isFirstWidget ? refPos - 1 : referenceWidget.prevWidget.pos();
        var max = refPos;
        var newPos = (min + max) / 2.0;
        widget.pos(newPos);

        // add to the list if it's not in the list
        if (this.widgetIds().indexOf(widget.uid()) < 0) {
          this.widgets.push(widget);
          this.widgetIds().push(widget.uid())
          this.save();
        }
        // re-order the widgets, so the order matches the new pos values
        workspace.sortWidgets();
      } else {
        throw new Error('Workspace.insertBefore -- referenceWidget must have a valid `pos` value');
      }
    },

    removeWidget: function(widgetToDelete) {
      this.widgets = this.widgets.filter(w => w !== widgetToDelete);
      removeFromArray(this.widgets, widgetToDelete)
      removeFromArray(this.widgetIds(), widgetToDelete.uid());
      this.save();
      widgetToDelete.delete();
      this.setPrevAndNextRefs();
    },

    appendWidget: function(widget) {
      // TODO: this should be workspace.maxPos, not Widget.maxPos
      widget.pos(Widget.maxPos + 1);
      widget.save();
      this.widgetIds().push(widget.uid());;
      this.widgets.push(widget);
      this.save();
      this.setPrevAndNextRefs();
    },

    sortWidgets: function() {
      this.widgets.sort((a,b) => a.pos() - b.pos());
      this.normalizePosValues();
      this.setPrevAndNextRefs();
    },

    // re-normalize pos values to integers (preserving order)
    normalizePosValues: function() {
      this.widgets.forEach((widget, index)=> {
        widget.pos(index + 1);
        widget.save({ isBatch: true });
      });
      db.commit();
    },

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
    }
  })
});
