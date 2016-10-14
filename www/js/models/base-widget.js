import { extendModel, Base } from 'models/base';
import { BaseWidgetTable } from 'models/db-schema';


export default extendModel(Base, {
  _fields: BaseWidgetTable.fields,
  tableName: BaseWidgetTable.name,

  create: function(data) {
    if (!data.workspace) {  throw new Error("Widget.create - 'workspace' is a required field"); }
    var instance = Base.create.call(this, data);
    instance.inputs = instance._getInputsContainer();
    return instance;
  },

  instance: {
    inputs: null,

    isRoot: function() {
      return this.parentWidget() === null && this.parentList() === null;
    },

    // TODO: IMPLEMENT THIS.
    // Remove all links & references marking this as a child widget or member of a widget list
    makeRoot: function() {
      console.log('Widget.instance.makeRoot -- TODO: implement this');
    },

    setupInputs: function() {
      throw new Error("Widget.instance -- Widget subclasses must implement 'setupInputs'");
    },

    _getInputsContainer: function() {
      if (!this.inputsClass) {
        return null;
      }

      var inputs = this.inputsClass.findWhere({ parentWidget: this.uid() })
      if (inputs.length === 1) {
        return inputs[0];
      } else if (inputs.length === 0) {
        return this.inputsClass.create({ parentWidget: this.uid() });
      } else {
        throw new Error('This should never happen');
      }
    },

    hasChildWidgets: function() {
      return this.class.findWhere({ parentWidget: this.uid() }).length > 0;
    },

    hasWidgetLists: function() {
      return WidgetList.findWhere({ parentWidget: this.uid() }).length > 0;
    }
  }
});
