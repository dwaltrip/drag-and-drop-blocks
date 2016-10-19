
import { Base, extendModel } from 'models/base';
import BaseWidget from 'models/base-widget';
import { Widget3InputsTable }  from 'models/db-schema';

// circular dependency
import { buildWidgetInputClass } from 'models/widget-helpers';


var Widget3Inputs = buildWidgetInputClass({
  tableName: Widget3InputsTable.name,
  widgetNames: Widget3InputsTable.widgetNames,
  widgetListNames: Widget3InputsTable.widgetListNames
});

var Widget3 = extendModel(BaseWidget, {
  instance: {
    inputsClass: Widget3Inputs
  }
});

export { Widget3 as default };
