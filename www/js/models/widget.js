import Base from 'models/base';
import extend from 'lib/object-extend';

import { WidgetTable } from 'models/db-schema';

const WidgetNames = {
  WIDGET1: 'widget1',
  WIDGET2: 'widget2',
  WIDGET3: 'widget3',
  WIDGET4: 'widget4'
}

var Widget = extend(Base, {
  _fields: WidgetTable.fields,
  tableName: WidgetTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    // instance.inputs = parseInputs(instance.inputsJSON);
    return instance;
  },

  instance: extend(Base.instance, {
    workspace: null,

    save: function() {
      this.class.maxPos = Math.max(this.class.maxPos, this.pos());
      return Base.instance.save.apply(this, arguments);
    }
  })
});

function parseInputs(inputs) {
  return inputs.map(input => {
    if (input.type === WIDGET_INPUT) {
      // fetch the widget...
    } else if (input.type === WIDGET_LIST) {
      // fetch all the widgets
    } else if (input.type === TEXT_INPUT) {
      // blah
    }
  });
}

var widgetPosList = Widget.query().map(widget => widget.pos());
// concat with 0 in case the list is empty
Widget.maxPos = Math.max.apply(Math, widgetPosList.concat([0]));

export { Widget as default, WidgetNames };
