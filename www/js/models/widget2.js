
import { Base, extendModel } from 'models/base';
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Widget2InputsTable }  from 'models/db-schema';

// circular dependency
import Widget from 'models/widget';


var Widget2Inputs = extendModel(Base, {
  _fields: Widget2InputsTable.fields,
  tableName: Widget2InputsTable.name,

  instance: {
    widget: function() {
      return Widget.findByUID(this.fooWidget());
    }
  }
});

var Widget2 = extendModel(BaseWidget, {
  instance: {
    // TODO: what is the best way to ensure that there is at most
    // a single 'fooWidget' for every widget of type 2?
    getFooWidget: function() {
      var input = Widget2Inputs.query({
        query: { parentWidget: this.uid() }
      })[0] || null;
      return input ? input.widget() : null;
    }
  }
});

window.Widget2Inputs = Widget2Inputs;

export { Widget2 as default };
