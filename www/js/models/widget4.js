
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Base, extendModel } from 'models/base';
import { Widget4InputsTable }  from 'models/db-schema';

// circular dependency
import WidgetList from 'models/widget-list';


window.WidgetList = WidgetList;

var Widget4Inputs = extendModel(Base, {
  _fields: Widget4InputsTable.fields,
  tableName: Widget4InputsTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.setupBazWidgetList();
    return instance;
  },

  instance: {
    bazWidgetList: null,

    setupBazWidgetList: function() {
      if (!this.bazWidgetListId()) {
        var list = WidgetList.create({ name: 'baz', parentWidget: this.parentWidget() });
        this.bazWidgetListId(list.uid());
        this.save();
        this.bazWidgetList = list;
      } else {
        this.bazWidgetList = WidgetList.findByUID(this.bazWidgetListId());
      }
    }
  }
});
window.Widget4Inputs = Widget4Inputs;

var Widget4 = extendModel(BaseWidget, {
  instance: {
    inputsClass: Widget4Inputs,

    getFooWidgetList: function() {
      return this.inputs ? this.inputs.widgetList() : null;
    }
  } 
});

export { Widget4 as default };
