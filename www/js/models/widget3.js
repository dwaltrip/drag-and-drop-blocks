
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Base, extendModel } from 'models/base';
import { Widget3InputsTable }  from 'models/db-schema';


var Widget3Inputs = extendModel(Base, {
  _fields: Widget3InputsTable.fields,
  tableName: Widget3InputsTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.firstWidget = instance.getFirstWidget();
    instance.secondWidget = instance.getSecondWidget();
    return instance;
  },

  instance: {
    firstWidget: null,
    secondWidget: null,

    getFirstWidget: function() {
      return this.firstWidgetId() ? Widget.findByUID(this.firstWidgetId()) : null;
    },
    getSecondWidget: function() {
      return this.secondWidgetId() ? Widget.findByUID(this.secondWidgetId()) : null;
    }
  }
});

var Widget3 = extendModel(BaseWidget, {
  instance: {
    inputsClass: Widget3Inputs,
  }
});

export { Widget3 as default };
