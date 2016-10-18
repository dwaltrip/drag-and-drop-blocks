
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Base, extendModel } from 'models/base';
import { Widget3InputsTable }  from 'models/db-schema';

// circular dependency
import Widget from 'models/widget';
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
