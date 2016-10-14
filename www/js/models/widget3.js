
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Base, extendModel } from 'models/base';
import { Widget3InputsTable }  from 'models/db-schema';


var Widget3Inputs = extendModel(Base, {
  _fields: Widget3InputsTable.fields,
  tableName: Widget3InputsTable.name
});

var Widget3 = extendModel(BaseWidget, {});

export { Widget3 as default };
