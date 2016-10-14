
import { Base, extendModel } from 'models/base';
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Widget2InputsTable }  from 'models/db-schema';

// circular dependency
import Widget from 'models/widget';


var Widget2Inputs = extendModel(Base, {
  _fields: Widget2InputsTable.fields,
  tableName: Widget2InputsTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.fooWidget = instance.getFooWidget();
    return instance;
  },

  // TODO: what is the best way to ensure that there is at most
  // a single 'fooWidget' for every widget of type 2?
  instance: {
    fooWidget: null,

    getFooWidget: function() {
      return this.fooWidgetId() ? Widget.findByUID(this.fooWidgetId()) : null;
    }
  }
});

var Widget2 = extendModel(BaseWidget, {
  instance: {
    inputsClass: Widget2Inputs,

    setFooWidget: function() {
    },

    createFooWidget: function(type) {
      var widget = Widget.create({
        type,
        parentWidget: this.uid(),
        workspace: this.workspace()
      });
      this.inputs.fooWidgetId(widget.uid());
      this.inputs.save();
      return widget;
    }
  }
});

window.Widget2Inputs = Widget2Inputs;

export { Widget2 as default };
