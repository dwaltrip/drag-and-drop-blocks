import { argsToArray } from 'lib/utils';
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
    return { name, idField: `${name}Id`, getterFnName: `_get${nameCapitalized}` };
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

    delete: function() {
      var deleteArgs = argsToArray(arguments);
      this.class.widgetInputs.forEach(input => {
        var inputWidget = this[input.name];
        if (inputWidget) {
          inputWidget.delete.apply(inputWidget, deleteArgs);
        }
      });
      this.class.widgetListInputs.forEach(input => {
        var list = this[input.name];
        list.delete.apply(list, deleteArgs);
      });
      return Base.instance.delete.apply(this, deleteArgs);
    },

    getInput: function(inputName) {
      var input = this._fetchInput(inputName);
      return this[input.name];
    },

    setInput: function(inputName, widget) {
      var input = this._fetchInput(inputName);
      var idProp = this[input.idField];
      if (idProp()) {
        var widgetToReplace = this[input.name];
        this.removeInput(widgetToReplace);
        this.getWidget().insertAfterInNearestParentList(widgetToReplace);
      }
      idProp(widget.uid());
      this[input.name] = widget;
      this.save();
      widget.parentWidget(this.parentWidget());
      widget.save();
    },

    createInput: function(inputName, widgetType) {
      var input = this._fetchInput(inputName);
      var idProp = this[input.idField];
      if (idProp()) {
        this.removeInput(this[input.name]);
      }
      var widget = Widget.create({
        type: widgetType,
        parentWidget: this.parentWidget(),
        workspace: this.getWidget().workspace()
      });
      idProp(widget.uid());
      this[input.name] = widget;
      this.save();
      return widget;
    },

    getInputList: function(listName) {
      var input = this.class.widgetListInputs.find(input => input.name === listName);
      if (!input) {
        throw new Error(`Widget '${this.parentWidget()}' does not have an input list with the name '${listName}'`);
      }
      return this[input.name];
    },

    removeInput: function(widget) {
      if (this.isChild(widget)) {
        var input = this.class.widgetInputs.find(input => this[input.name] === widget);
        this[input.name] = null;
        this[input.idField](null);
        this.save();
        widget.parentWidget(null);
        widget.save();
      } else if (this.isInChildList(widget)) {
        var input = this.class.widgetListInputs.find(input => this[input.name].contains(widget));
        this[input.name].remove(widget);
        widget.parentList(null);
        widget.save();
      } else {
        throw new Error('Cannot remove widget that is not an input.');
      }
    },

    isChild: function(widget) {
      return !!this.childWidgets().find(child => child === widget);
    },

    isInChildList: function(widget) {
      return !!this.widgetLists().find(list => list.contains(widget));
    },

    _setupWidgetLists: function() {
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
    },

    _fetchInput: function(inputName) {
      var input = this.class.widgetInputs.find(input => input.name === inputName);
      if (!input) {
        throw new Error(`Widget '${this.parentWidget()}' does not have an input widget with the name '${inputName}'`);
      }
      return input;
    }
  };

  // TODO: get rid of creating a getterFn for each widget input
  // Also, I think having a single generic fetcher fn would be better
  // than having to manage an instance property for each widget input.
  widgetInputs.forEach(input => {
    instancePrototype[input.name] = null;

    instancePrototype[input.getterFnName] = function() {
      var widgetId = this[input.idField]();
      return widgetId ? Widget.findByUID(widgetId) : null;
    };
  });

  widgetListInputs.forEach(input => instancePrototype[input.name] = null);

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
      instance._setupWidgetLists();
      return instance;
    },

    instance: instancePrototype
  });
};

function capitalize1stLetter(str) {
  return `${(str[0] || '').toUpperCase()}${str.substring(1)}`;
}
