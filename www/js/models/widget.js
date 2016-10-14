
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


// NOTE: The instances of classes Widget1, Widget2, Widget3, and Widget4
// contain the exact the same data as in the BaseWidget table.
// The different classes allow us to give unique instance methods
// to each different widget type.


// Widget1 doesn't have widget inputs, so it doesn't have any custom behavior.
var Widget1 = BaseWidget;


// var Widget2Inputs = extendModel(Base, {
//   _fields: Widget2InputsTable.fields,
//   tableName: Widget2InputsTable.name
// });

// var Widget2 = extendModel(BaseWidget, {
//   // _fields: Widget2Table.fields,
//   // tableName: Widget2Table.name,
//   instance: {
//     getFooWidget: function() { return null; }
//   }
// });

// var Widget3Inputs = extendModel(Base, {
//   _fields: Widget3InputsTable.fields,
//   tableName: Widget3InputsTable.name
// });

// var Widget3 = extendModel(BaseWidget, {});

// var Widget4Inputs = extendModel(Base, {
//   _fields: Widget4InputsTable.fields,
//   tableName: Widget4InputsTable.name
// });

// var Widget4 = extendModel(BaseWidget, {
//   instance: {
//     getFooWidgetList: function() { return null; }
//   } 
// });


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
      throw new Error(`Widget.create - all Widget instances are required to have a 'type'`)
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
