import { extendModel, Base } from 'models/base';
import { TABLES } from 'models/db-schema';

// circular dependency
import WidgetList from 'models/widget-list';


export default extendModel(Base, {
  _fields: TABLES.baseWidgets.fields,
  tableName: TABLES.baseWidgets.name,

  create: function(data) {
    if (!data.workspace) {  throw new Error("Widget.create - 'workspace' is a required field"); }
    var instance = Base.create.call(this, data);
    instance.inputs = instance._getInputsContainer();
    return instance;
  },

  instance: {
    inputs: null,

    disconnect: function() {
      if (this.parentList()) {
        this.getParentList().remove(this);
      } else {
        this.getParentWidget().inputs.removeInput(this);
      }
    },

    getWorkspace: function() {
      return Workspace.findByUID(this.workspace());
    },

    getParentWidget: function() {
      return this.parentWidget() ? this.class.findByUID(this.parentWidget()) : null;
    },

    getParentList: function() {
      return this.parentList() ? WidgetList.findByUID(this.parentList()) : null;
    },

    getContainingWidget: function() {
      return this.getParentWidget() || this.getParentList().getParentWidget();
    },

    prevWidget: function() {
      if (!this.parentList()) { return; }
      var index = this.pos();
      return index > 0 ? this.getParentList().widgets[index - 1] : null;
    },

    nextWidget: function() {
      if (!this.parentList()) { return; }
      var widgets = this.getParentList().widgets;
      var index = this.pos();
      return index >= 0 && index < widgets.length - 1 ? widgets[index + 1] : null;
    },

    isFirstWidget: function() { return !!this.parentList() && !this.prevWidget(); },
    isLastWidget: function()  { return !!this.parentList() && !this.nextWidget(); },

    isAncestorOf: function(widget) {
      var ancestor = widget.getContainingWidget();
      while(ancestor && ancestor !== this) {
        ancestor = ancestor.getContainingWidget();
      }
      return ancestor === this;
    },

    _getInputsContainer: function() {
      if (!this.class.inputsClass) {
        return null;
      }

      var inputs = this.class.inputsClass.findWhere({ parentWidget: this.uid() })
      if (inputs.length === 1) {
        return inputs[0];
      } else if (inputs.length === 0) {
        return this.class.inputsClass.create({ parentWidget: this.uid() });
      } else {
        throw new Error('This should never happen');
      }
    }
  }
});
