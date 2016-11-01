import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { extendModel } from 'models/base';
import { WIDGET_INPUTS } from 'models/db-schema';

// circular dependencies
import { buildWidgetInputClass } from 'models/widget-helpers';

const WidgetTypes = {
  WIDGET1: 'widget1',
  WIDGET2: 'widget2',
  WIDGET3: 'widget3',
  WIDGET4: 'widget4',
  WIDGET5: 'widget5'
};

// Widget1 doesn't have widget inputs, so it doesn't have any custom behavior.
var WidgetClasses = {
  [WidgetTypes.WIDGET1]: BaseWidget,
  [WidgetTypes.WIDGET2]: defineWidgetClass(WIDGET_INPUTS.widget2),
  [WidgetTypes.WIDGET3]: defineWidgetClass(WIDGET_INPUTS.widget3),
  [WidgetTypes.WIDGET4]: defineWidgetClass(WIDGET_INPUTS.widget4),
  [WidgetTypes.WIDGET5]: defineWidgetClass(WIDGET_INPUTS.widget5)
};

// This class exists to provide a single interface for querying and creating widgets.
// It doesn't have an instance prototype defined.
// Instead, we instantiate via appropriate widget type specific class.
// All widget data is stored in the BaseWidget table, regardless of the widget type
// The different widget classes enable the different behavior between widget types.
var Widget = extend(BaseWidget, {
  types: Object.keys(WidgetTypes).map(name => WidgetTypes[name]),

  create: function(data) {
    if (!data.type) {
      throw new Error(`Widget.create - 'type' is a required field`);
    }
    var WidgetClass = WidgetClasses[data.type];
    if (!WidgetClass) {
      throw new Error(`Widget.create - Invalid 'type' value received: ${data.type}`);
    }
    return WidgetClass.create(data);
  },
  instance: null
});

export { Widget as default, WidgetTypes };

function defineWidgetClass(opts) {
  return extendModel(BaseWidget, {
    inputsClass: buildWidgetInputClass(opts)
  });
}
