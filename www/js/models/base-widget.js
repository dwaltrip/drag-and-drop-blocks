import assert from 'lib/assert';
import { extendModel, Base } from 'models/base';
import { TABLES } from 'models/db-schema';

// circular dependency
import WidgetList from 'models/widget-list';
import Workspace from 'models/workspace';

export default extendModel(Base, {
  _fields: TABLES.baseWidgets.fields,
  tableName: TABLES.baseWidgets.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance.inputs = instance._getInputsContainer();
    return instance;
  },

  instance: {
    inputs: null,

    disconnect: function() {
      if (this.parentList()) {
        this.getParentList().remove(this);
      } else if (this.parentWidget()) {
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

    isRoot: function() {
      return this.getParentList() === this.getWorkspace().widgetList();
    },

    isInList: function() { return !!this.parentList(); },
    isInSlot: function() { return !!this.parentWidget(); },

    slotName: function() {
      if (!this.isInSlot()) { return null; }
      var parentWidget = this.getParentWidget();
      return parentWidget.inputs.widgetInputs.find(input => {
        return parentWidget.getInput(input.name) === this;
      }).name;
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

    isFirstWidget:  function() { return !!this.parentList() && !this.prevWidget(); },
    isLastWidget:   function() { return !!this.parentList() && !this.nextWidget(); },

    // is inclusive, includes this widget itself
    getRestOfParentList: function() {
      if (!this.isInList()) {
        return [this];
      }
      return this.getParentList().widgets.slice(this.pos());
    },

    setInput:       proxyToInputs('setInput'),
    getInput:       proxyToInputs('getInput'),
    createInput:    proxyToInputs('createInput'),
    getInputList:   proxyToInputs('getInputList'),

    // TODO: should this also call disconnect?
    delete: function() {
      // In the actual code-blocks app, I think all blocks will have an input
      if (this.inputs) {
        this.inputs.delete.apply(this.inputs, arguments);
      }
      return Base.instance.delete.apply(this, arguments);
    },

    isAncestorOf: function(widget) {
      var ancestor = widget.getContainingWidget();
      while(ancestor && ancestor !== this) {
        ancestor = ancestor.getContainingWidget();
      }
      return ancestor === this;
    },

    insertAfterInNearestParentList: function(widgetToInsert) {
      var referenceWidget = this;
      var parentList = referenceWidget.getParentList();
      while (!parentList) {
        referenceWidget = referenceWidget.getParentWidget();
        if (!referenceWidget) { throw new Error('This should not happen!'); }
        parentList = referenceWidget.getParentList();
      }
      parentList.insertAfter(widgetToInsert, referenceWidget);
    },

    findAncestorWidget: function(filterFn) {
      var ancestor = this.getContainingWidget();
      while (ancestor) {
        if (filterFn(ancestor)) { return ancestor; }
        ancestor = ancestor.getContainingWidget();
      }
      if (ancestor && filterFn(ancestor)) { return ancestor; }
    },

    _getInputsContainer: function() {
      if (!this.class.inputsClass) { return null; }
      var results = this.class.inputsClass.findWhere({ parentWidget: this.uid() });
      assert(results.length === 0 || results.length === 1, 'This should never happen');
      return results.length === 1 ? results[0] :
        this.class.inputsClass.create({ parentWidget: this.uid() });
    }
  }
});

function proxyToInputs(fnName) {
  return function() {
    return this.inputs[fnName].apply(this.inputs, arguments);
  }
}
