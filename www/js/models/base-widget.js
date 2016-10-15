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
      if (!this.isRoot()) {
        this.getParent().inputs.removeInput(this);
      } else {
        console.log('Widget.instance.makeRoot -- Widget is already root!! -- widget:', this.uid());
      }
    },

    getParent: function() {
      if (this.parentWidget()) {
        return this.class.findByUID(this.parentWidget());
      } else if (this.parentList()) {
        return WidgetList.findByUID(this.parentList()).getParentWidget();
      }
      return null;
    },

    isAncestorOf: function(widget) {
      var ancestor = widget.getParent();
      while(ancestor && ancestor !== this) {
        ancestor = ancestor.getParent();
      }
      return ancestor === this;
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
