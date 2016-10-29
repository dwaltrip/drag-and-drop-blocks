import { merge } from 'lib/utils';

import Widget from 'models/widget';

/*
  This code was created to support the copy + paste functionality
  It is not used for serializing/deserializing to and from the backend API
*/

function serializeWidget(widget) {
  var data = { type: widget.type(), inputs: null };
  if (!widget.inputs) {
    return data;
  }

  var slots = widget.inputs.class.widgetInputs.map(input => {
    var inputWidget = widget.getInput(input.name);
    return inputWidget ? {
      name: input.name,
      widget: serializeWidget(inputWidget)
    } : null;
  }).filter(slot => !!slot);

  var lists = widget.inputs.class.widgetListInputs.map(input => {
    var widgets = widget.getInputList(input.name).getWidgets();
    return { name: input.name, widgets: widgets.map(serializeWidget) };
  });

  data.inputs = { slots, lists };
  return data;
}

function deserializeWidget(opts, workspace) {
  var type = opts.type;
  var parentWidget = opts.parentWidget || null;
  var parentList = opts.parentList || null;
  var inputs = opts.inputs || {};

  // here, 'workspace', 'parentWidget', and 'parentList' are IDs
  var widget = Widget.create({ type, workspace, parentWidget, parentList });

  deserializeInputWidgets(widget, inputs.slots, workspace);
  deserializeInputLists(widget, inputs.lists, workspace);

  return widget;
}

function deserializeInputWidgets(widget, inputWidgets, workspaceId) {
  (inputWidgets || []).forEach(inputData => {
    var childWidget = deserializeWidget({
      type: inputData.widget.type,
      workspace: workspaceId,
      parentWidget: widget.uid(),
      inputs: inputData.widget.inputs
    }, workspaceId);
    widget.setInput(inputData.name, childWidget);
  });
}

function deserializeInputLists(widget, inputLists, workspaceId) {
  (inputLists || []).forEach(inputData => {
    var list = widget.getInputList(inputData.name);
    inputData.widgets.forEach(childWidgetData => {
      var childWidget = deserializeWidget({
        type: childWidgetData.type,
        workspace: workspaceId,
        parentList: list.uid(),
        inputs: childWidgetData.inputs
      }, workspaceId);
      list.appendWidget(childWidget);
    });
  });
}

export { serializeWidget, deserializeWidget };
