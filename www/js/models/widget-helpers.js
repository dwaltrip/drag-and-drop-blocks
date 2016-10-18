
import { Base, extendModel } from 'models/base';
import Widget from 'models/widget';


const COMMON_FIELDS = ['parentWidget'];

export function buildWidgetInputClass(opts) {
  var widgetNames = opts.widgetNames || [];
  var widgetListNames = opts.widgetListNames || [];

  var widgetInputs = widgetNames.map(name => {
    var nameCapitalized = capitalize1stLetter(name);
    return {
      name,
      getterFnName: `_get${nameCapitalized}`,
      creatorFnName: `create${nameCapitalized}`,
      idField: `${name}Id`
    };
  });
  var widgetListInputs = widgetListNames.map(name => {
    return { name, nameCapitalized: capitalize1stLetter(name), idField: `${name}Id` };
  });

  var fieldNames = COMMON_FIELDS
    .concat(widgetInputs.map(input => input.idField))
    .concat(widgetListInputs.map(input => input.idField));

  var instancePrototype = {
    widget: null,

    getWidget: function() { return Widget.findByUID(this.parentWidget()); },

    removeInput: function(widget) {
      if (!this.isInput(widget)) {
        throw new Error('Cannot remove widget that is not an input.');
      }
      this.class.widgetInputs.forEach(input => {
        if (this[input.name] === widget) {
          this[input.name] = null;
          this[input.idField](null);
        }
      });
      this.save();
      widget.parentWidget(null);
      widget.save();
    },

    isInput: function(widget) {
      return !!this.class.widgetInputs.find(input => this[input.name] === widget);
    }
  };

  widgetInputs.forEach(input => {
    instancePrototype[input.name] = null;

    instancePrototype[input.getterFnName] = function() {
      var widgetId = this[input.idField]();
      return widgetId ? Widget.findByUID(widgetId) : null;
    };

    instancePrototype[input.creatorFnName] = function(type) {
      var idProp = this[input.idField];
      if (idProp()) {
        this.removeInput(this[input.name]);
      }
      var widget = Widget.create({
        type,
        parentWidget: this.getWidget().uid(),
        workspace: this.getWidget().workspace()
      });
      idProp(widget.uid());
      this.save();
      return widget;
    };
  });

  /* TODO: implement functions for adding and removing widgets from a widget list.
  widgetListInputs.forEach(name => {
    // assign getter fn for widget lists
    instancePrototype[`_${name}Getter`] = ...;
  };*/

  return extendModel(Base, {
    _fields: fieldNames,
    tableName: opts.tableName,
    widgetInputs,
    widgetListInputs,

    create: function(data) {
      var instance = Base.create.call(this, data);
      this.widgetInputs.forEach(input => {
        instance[input.name] = instance[input.getterFnName]();
      });
      return instance;
    },

    instance: instancePrototype
  });
};

function capitalize1stLetter(str) {
  return `${(str[0] || '').toUpperCase()}${str.substring(1)}`;
}
