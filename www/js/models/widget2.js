
import { Base, extendModel } from 'models/base';
import BaseWidget from 'models/base-widget';
import { Widget2InputsTable }  from 'models/db-schema';

// circular dependency
import { buildWidgetInputClass } from 'models/widget-helpers';


var Widget2Inputs = buildWidgetInputClass({
  tableName: Widget2InputsTable.name,
  widgetNames: Widget2InputsTable.widgetNames,
  widgetListNames: Widget2InputsTable.widgetListNames
});

var Widget2 = extendModel(BaseWidget, {
  instance: {
    inputsClass: Widget2Inputs
  }
});

export { Widget2 as default };
