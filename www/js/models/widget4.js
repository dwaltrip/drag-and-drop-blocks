
import { Base, extendModel } from 'models/base';
import BaseWidget from 'models/base-widget';
import { Widget4InputsTable }  from 'models/db-schema';

// circular dependency
import { buildWidgetInputClass } from 'models/widget-helpers';


var Widget4Inputs = buildWidgetInputClass({
  tableName: Widget4InputsTable.name,
  widgetNames: Widget4InputsTable.widgetNames,
  widgetListNames: Widget4InputsTable.widgetListNames
});

var Widget4 = extendModel(BaseWidget, {
  instance: {
    inputsClass: Widget4Inputs
  } 
});

export { Widget4 as default };
