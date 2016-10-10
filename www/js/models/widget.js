import Base from 'models/base';
import extend from 'lib/object-extend';

import { WidgetTable } from 'models/db-schema';

const WidgetNames = {
  WIDGET1: 'widget1',
  WIDGET2: 'widget2',
  WIDGET3: 'widget3',
  WIDGET4: 'widget4'
};

const WIDGET_INPUT ='WIDGET_INPUT';
const WIDGET_LIST ='WIDGET_LIST';
const TEXT_INPUT = 'TEXT_INPUT';

var Widget = extend(Base, {
  _fields: WidgetTable.fields,
  tableName: WidgetTable.name,

  create: function(data) {
    data.inputs = data.inputs || [];
    var instance = Base.create.call(this, data);
    return instance;
  },

  transforms: {
    inputs: {
      serialize: serializeInputs,
      deserialize: deserializeInputs
    }
  },

  instance: extend(Base.instance, {
    workspace: null,

    getInput: function() { return null; },

    save: function() {
      this.class.maxPos = Math.max(this.class.maxPos, this.pos());
      return Base.instance.save.apply(this, arguments);
    }
  })
});

function deserializeInputs(inputs) {
  return inputs.map(input => {
    var parsedInput = { name: input.name, type: input.type };
    if (input.type === WIDGET_INPUT) {
      parsedInput.widget = Widget.findByUID(input.widgetId);
    } else if (input.type === WIDGET_LIST) {
      parsedInput.widgets = Widget.queryUIDs(input.widgetIds);
    } else if (input.type === TEXT_INPUT) {
      parsedInput.value = input.value;
    }
    return parsedInput;
  });
}

function serializeInputs(inputs) {
  return inputs.map(input => {
    var out = { name: input.name, type: input.type };
    if (input.type === WIDGET_INPUT) {
      out.widgetId = input.widget.uid();
    } else if (input.type === WIDGET_LIST) {
      out.widgetIds = input.widgets.map(w => w.uid());
    } else if (input.type === TEXT_INPUT) {
      out.value = input.value;
    }
    return out;
  });
}

var widgetPosList = Widget.query().map(widget => widget.pos());
// concat with 0 in case the list is empty
Widget.maxPos = Math.max.apply(Math, widgetPosList.concat([0]));

export { Widget as default, WidgetNames };
