
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Base, extendModel } from 'models/base';
import { Widget3InputsTable }  from 'models/db-schema';

// circular dependency
import Widget from 'models/widget';
import { buildWidgetGetter, buildInputWidgetCreator } from 'models/widget-helpers';

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
    getFirstWidget: buildWidgetGetter('firstWidgetId'),
    getSecondWidget: buildWidgetGetter('secondWidgetId')
  }
});

var Widget3 = extendModel(BaseWidget, {
  instance: {
    inputsClass: Widget3Inputs,
    createFirstWidget: buildInputWidgetCreator('firstWidgetId'),
    createSecondWidget: buildInputWidgetCreator('secondWidgetId')
  }
});

export { Widget3 as default };
