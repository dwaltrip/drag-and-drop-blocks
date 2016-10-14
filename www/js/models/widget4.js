
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Base, extendModel } from 'models/base';
import { Widget4InputsTable }  from 'models/db-schema';


var Widget4Inputs = extendModel(Base, {
  _fields: Widget4InputsTable.fields,
  tableName: Widget4InputsTable.name
});

var Widget4 = extendModel(BaseWidget, {
  instance: {
    getFooWidgetList: function() { return null; }
  } 
});

export { Widget4 as default };
