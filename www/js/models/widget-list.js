import { extendModel, Base } from 'models/base';
import { WidgetListTable } from 'models/db-schema';
import { removeFromArray } from 'lib/utils';

// circular dependency
import Widget from 'models/widget';

// TODO: Move all list functionality from workspace into here
// And turn workspace.rootWidgets into a widget-list
export default extendModel(Base, {
  _fields: WidgetListTable.fields,
  tableName: WidgetListTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.widgets = Widget.findWhere(widget => widget.parentList === instance.uid());
    // instance.widgets = Widget.findWhere({ parentList: instance.uid() });
    return instance;
  },

  instance: {
    widgets: null,

    getParentWidget: function() {
      return Widget.findByUID(this.parentWidget());
    },

    contains: function(widget) {
      return widget.parentList() === this.uid();
    },

    remove: function(widget) {
      removeFromArray(this.widgets, widget);
    },

    // what pos should it have?
    createWidgetInList: function(type) {
      var widget = Widget.create({
        type,
        parentList: this.uid(),
        workspace: this.getParentWidget().workspace()
      });
      this.widgets.push(widget);
      return widget;
    }
  }
});
