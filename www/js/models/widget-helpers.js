import { Base, extendModel } from 'models/base';
import Widget from 'models/widget';
import WidgetList from 'models/widget-list';

window.globals = (window.globals || {});
window.globals.WidgetList = WidgetList;

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
    var nameCapitalized = capitalize1stLetter(name);
    return { name, idField: `${name}Id` };
  });

  var instancePrototype = {
    widget: null,

    getWidget: function() { return Widget.findByUID(this.parentWidget()); },

    childWidgets: function() {
      return this.class.widgetInputs.map(input => this[input.name]);
    },
    widgetLists: function() {
      return this.class.widgetListInputs.map(input => this[input.name]);
    },

    removeInput: function(widget) {
      if (this.isChild(widget)) {
        this.class.widgetInputs.forEach(input => {
          if (this[input.name] === widget) {
            this[input.name] = null;
            this[input.idField](null);
          }
        });
        this.save();
        widget.parentWidget(null);
        widget.save();
      } else if (this.isInChildList(widget)) {
        this.class.widgetListInputs.forEach(input => {
          var list = this[input.name];
          if (list.contains(widget)) {
            list.remove(widget);
          }
          widget.parentList(null);
          widget.save();
        });
      } else {
        throw new Error('Cannot remove widget that is not an input.');
      }
    },

    isChild: function(widget) {
      return !!this.childWidgets().find(child => child === widget);
    },

    isInChildList: function(widget) {
      return !!this.widgetLists().find(list => list.contains(widget));
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

  widgetListInputs.forEach(input => instancePrototype[input.name] = null);

  instancePrototype.setupWidgetLists = function() {
    this.class.widgetListInputs.forEach(input => {
      var idProp = this[input.idField];
      if (!idProp()) {
        var list = WidgetList.create({ name: input.name, parentWidget: this.parentWidget() });
        idProp(list.uid());
        this.save();
      } else {
        var list = WidgetList.findByUID(idProp());
      }
      this[input.name] = list;
    });
  };

  return extendModel(Base, {
    _fields: opts.fields,
    tableName: opts.name,
    widgetInputs,
    widgetListInputs,

    create: function(data) {
      var instance = Base.create.call(this, data);
      this.widgetInputs.forEach(input => {
        instance[input.name] = instance[input.getterFnName]();
      });
      instance.setupWidgetLists();
      return instance;
    },

    instance: instancePrototype
  });
};

function capitalize1stLetter(str) {
  return `${(str[0] || '').toUpperCase()}${str.substring(1)}`;
}
