
import BaseWidget from 'models/base-widget';
import extend from 'lib/object-extend';
import { Base, extendModel } from 'models/base';
import { Widget3InputsTable }  from 'models/db-schema';

// circular dependency
import Widget from 'models/widget';
import { buildWidgetGetter, buildInputWidgetCreator } from 'models/widget-helpers';

var Widget3Inputs = extendModel(Base, {
  _fields: Widget3InputsTable.fields,
  tableName: Widget3InputsTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.firstWidget = instance._getFirstWidget();
    instance.secondWidget = instance._getSecondWidget();
    return instance;
  },

  instance: {
    firstWidget: null,
    secondWidget: null,
    _getFirstWidget: buildWidgetGetter('firstWidgetId'),
    _getSecondWidget: buildWidgetGetter('secondWidgetId'),
    removeInput: function(widget) {
      if (!this.isInput(widget)) {
        throw new Error('Cannot remove widget that is not an input.');
      }
      if (this.firstWidget === widget) {
        this.firstWidgetId(null);
        this.firstWidget = null;
      }
      if (this.secondWidget === widget) {
        this.secondWidgetId(null);
        this.secondWidget = null;
      }
      this.save();
      widget.parentWidget(null);
      widget.save();
    },
    isInput: function(widget) {
      return widget === this.firstWidget || widget === this.secondWidget;
    }
  }
});

var Widget3 = extendModel(BaseWidget, {
  instance: {
    inputsClass: Widget3Inputs,
    createFirstWidget: buildInputWidgetCreator('firstWidgetId'),
    createSecondWidget: buildInputWidgetCreator('secondWidgetId')
  }
});

export { Widget3 as default };
