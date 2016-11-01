import { argsToArray } from 'lib/utils';
import assert from 'lib/assert';
import { Base, extendModel } from 'models/base';
import Widget from 'models/widget';
import WidgetList from 'models/widget-list';

export function buildWidgetInputClass(opts) {
  var widgetNames = opts.widgetNames || [];
  var listNames = opts.widgetListNames || [];

  var widgetInputs = widgetNames.map(name =>    ({ name, idField: `${name}Id` }));
  var widgetListInputs = listNames.map(name =>  ({ name, idField: `${name}Id` }));

  return extendModel(Base, {
    _fields: opts.fields,
    tableName: opts.name,
    widgetInputs,
    widgetListInputs,

    create: function(data) {
      var instance = Base.create.call(this, data);
      instance._createWidgetLists();
      instance._setupInputLookups();
      return instance;
    },

    instance: {
      widgetInputs,
      widgetListInputs,
      _inputsByName: null,
      _inputListsByName: null,

      // NOTE: We can't set this during create or else it start an infinite loop!
      // It loops between: Widget.create <--> Widget.inputsClass.create
      // I tried twice now and it was very annoying to debug both times
      widget: function() { return Widget.findByUID(this.parentWidget()); },

      delete: function() {
        var deleteArgs = argsToArray(arguments);
        this.widgetInputs.forEach(input => {
          var inputWidget = this.getInput(input.name);
          if (inputWidget) {
            inputWidget.delete.apply(inputWidget, deleteArgs);
          }
        });
        this.widgetListInputs.forEach(input => {
          var list = this.getInputList(input.name);
          list.delete.apply(list, deleteArgs);
        });
        return Base.instance.delete.apply(this, deleteArgs);
      },

      getInput: function(name) {
        var errorMsg = `Widget '${this.parentWidget()}' has no input widget named '${name}'`;
        assert(name in this._inputsByName, errorMsg);
        return this._inputsByName[name];
      },

      getInputList: function(name) {
        var errorMsg = `Widget '${this.parentWidget()}' has no input list named '${name}'`;
        assert(name in this._inputListsByName, errorMsg);
        return this._inputListsByName[name];
      },

      setInput: function(name, widget) {
        var errorMsg = `Widget '${this.parentWidget()}' has no input list named '${name}'`;
        var input = this._fetchInput(name);
        var idProp = this[input.idField];
        assert(!idProp(), `setInput - the '${name}' slot already has a widget.`);

        idProp(widget.uid());
        this._inputsByName[name] = widget;
        this.save();
        widget.parentWidget(this.parentWidget());
        widget.save();
      },

      createInput: function(name, widgetType) {
        var input = this._fetchInput(name);
        var idProp = this[input.idField];
        assert(!idProp(), `createInput - the '${name}' slot already has a widget.`);

        var widget = Widget.create({
          type: widgetType,
          parentWidget: this.parentWidget(),
          workspace: this.widget().workspace()
        });
        idProp(widget.uid());
        this._inputsByName[name] = widget;
        this.save();
        return widget;
      },

      removeInput: function(widget) {
        var inputListIds = this.widgetListInputs.map(input => this.getInputList(input.name).uid());

        if (widget.getParentWidget() === this.widget()) {
          var input = this.widgetInputs.find(input => this.getInput(input.name) === widget);
          this[input.idField](null);
          this._inputsByName[input.name] = null;
          this.save();
          widget.parentWidget(null);
          widget.save();
        } else if (inputListIds.indexOf(widget.parentList()) > -1) {
          var input = this.widgetListInputs.find(input => {
            return this.getInputList(input.name).uid() === widget.parentList();
          });
          this.getInputList(input.name).remove(widget);
          widget.parentList(null);
          widget.save();
        } else {
          throw new Error('Cannot remove widget that is not an input.');
        }
      },

      _setupInputLookups: function() {
        this._inputsByName = this.widgetInputs.reduce((lookup, input)=> {
          var widgetId = this[input.idField]();
          lookup[input.name] = widgetId ? Widget.findByUID(widgetId) : null;
          return lookup;
        }, {});
        this._inputListsByName = this.widgetListInputs.reduce((lookup, input)=> {
          var listId = this[input.idField]();
          lookup[input.name] = listId ? WidgetList.findByUID(listId) : null;
          return lookup;
        }, {});
      },

      _createWidgetLists: function() {
        this.widgetListInputs.forEach(input => {
          var idProp = this[input.idField];
          if (!idProp()) {
            var list = WidgetList.create({ name: input.name, parentWidget: this.parentWidget() });
            idProp(list.uid());
            this.save();
          }
        });
      },

      _fetchInput: function(name) {
        var input = this.widgetInputs.find(input => input.name === name);
        assert(input, `Widget '${this.parentWidget()}' has no input widget named '${name}'`);
        return input;
      }
    }
  });
};
