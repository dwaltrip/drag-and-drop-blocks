import { extendModel, Base } from 'models/base';
import { WidgetListTable } from 'models/db-schema';

// circular dependency
import Widget from 'models/widget';

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

    // what pos should it have?
    createWidgetInList: function(type) {
      var widget = Widget.create({ type, parentList: this.uid() });
      this.widgets.push(widget);
      return widget;
    }
  }
});
