
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { extendModel, Base } from 'models/base';

// circular dependencies
import Widget2 from 'models/widget2';
import Widget3 from 'models/widget3';
import Widget4 from 'models/widget4';


const WidgetTypes = {
  WIDGET1: 'widget1',
  WIDGET2: 'widget2',
  WIDGET3: 'widget3',
  WIDGET4: 'widget4'
};


// Widget1 doesn't have widget inputs, so it doesn't have any custom behavior.
var Widget1 = BaseWidget;
// var Widget1 = extendModel(BaseWidget, {
//   instance: {
//     setupInputs: function() {}
//   }
// });


// NOTE: The instances of classes Widget1, Widget2, Widget3, and Widget4
// contain the exact the same data as in the BaseWidget table.
// The different classes allow us to give unique instance methods
// to each different widget type.

var WidgetClasses = {
  [WidgetTypes.WIDGET1]: Widget1,
  [WidgetTypes.WIDGET2]: Widget2,
  [WidgetTypes.WIDGET3]: Widget3,
  [WidgetTypes.WIDGET4]: Widget4
};

// This exists to provide a single class for querying and creating widgets.
// It doesn't have an instance object defined.
// Instead, we instantiate the appropriate widget type specific class.
var Widget = extend(BaseWidget, {
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
