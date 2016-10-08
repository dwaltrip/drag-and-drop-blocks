// NOTE: this model doesn't have direct access to pre

import Widget from 'models/widget';
import db from 'db';

export default {
  create: function() {
    var instance = Object.create(this.instance);
    instance.widgets = Widget.query();
    instance.sortWidgets();
    instance.setPrevAndNextRefs();
    return instance;
  },

  instance: {
    widgets: null,

    createWidget: function(name) {
      return Widget.create({ name, data: 'foo', pos: null });
    },

    insertBefore: function(widget, referenceWidget) {
      var refPos = referenceWidget.pos();
      if (!!refPos || refPos === 0) {
        var min = referenceWidget.isFirstWidget ? refPos - 1 : referenceWidget.prevWidget.pos();
        var max = refPos;
        var newPos = (min + max) / 2.0;
        widget.pos(newPos);

        // add to the list if it's not in the list
        if (this.widgets.indexOf(widget) < 0) {
          this.widgets.push(widget);
        }
        // re-order the widgets, so the order matches the new pos values
        workspace.sortWidgets();
      } else {
        throw new Error('Workspace.insertBefore -- referenceWidget must have a valid `pos` value');
      }
    },

    removeWidget: function(widgetToDelete) {
      this.widgets = this.widgets.filter(w => w !== widgetToDelete);
      widgetToDelete.delete();
      this.setPrevAndNextRefs();
    },

    appendWidget: function(widget) {
      widget.pos(Widget.maxPos + 1);
      widget.save();
      this.widgets.push(widget);
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
  }
};
