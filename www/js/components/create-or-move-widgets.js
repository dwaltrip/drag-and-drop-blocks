import { deserializeWidget } from 'models/widget-serializer';
import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS } from 'app-constants';
import { UndoService } from 'services';

function afterWidgetInList(opts) {
  var dragItem = opts.dragItem;
  var list = opts.list;
  var refWidget = opts.referenceWidget;

  if (dragItem.group === TOOLBOX_WIDGETS) {
    var newWidget = list.createWidget(dragItem.getItemData('widgetType'))
    list.insertAfter(newWidget, refWidget);
    dragItem.setDragData('newWidget', newWidget);
    // UndoService.recordCreateAction({ widgets: [newWidget] });
  }
  else if (dragItem.group === WORKSPACE_WIDGETS) {
    var widgets = dragItem.getDragData('widgets');
    widgets.forEach(widget => {
      widget.disconnect();
      list.insertAfter(widget, refWidget);
      refWidget = widget;
    });
    // UndoService.recordCreateAction({ widgets });
  }
}

function toWidgetSlot(opts) {
// var toWidgetSlot = UndoService.asTransaction(function(opts) {
  var dragItem = opts.dragItem;
  var parent = opts.parentWidget;

  var widgetToReplace = parent.getInput(opts.slotName);
  if (widgetToReplace) {
    // var source = getCoords(widgetToReplace);
    widgetToReplace.disconnect();
    // insertAfterInNearestParentList(widgetToReplace, parent);
    parent.insertAfterInNearestParentList(widgetToReplace);
    // UndoService.recordMoveAction({
    //   widgetData: [deserializeWidget(widgetToReplace)],
    //   source: source,
    //   dest: getCoords(widgetToReplace)
    // });
  }

  if (dragItem.group === TOOLBOX_WIDGETS) {
    var newWidget = parent.createInput(opts.slotName, dragItem.getItemData('widgetType'));
    dragItem.setDragData('newWidget', newWidget);
    // UndoService.recordCreateAction({ widgets: [newWidget] });
  }
  else if (dragItem.group === WORKSPACE_WIDGETS) {
    var dragWidget = dragItem.getItemData('widget');
    // var dragWidgetSource = getCoords(dragWidget);
    dragWidget.disconnect();
    parent.setInput(opts.slotName, dragWidget);
    // UndoService.recordMoveAction({
    //   widgetData: [deserializeWidget(dragWidget)],
    //   source: dragWidgetSource,
    //   dest: getCoords(dragWidget)
    // });
  }
}
// });

function toEndOfList(opts) {
  var dragItem = opts.dragItem;
  var list = opts.list;

  if (dragItem.group === TOOLBOX_WIDGETS) {
    var widgetToAdd = list.createWidget(dragItem.getItemData('widgetType'));
    dragItem.setDragData('newWidget', widgetToAdd);
    list.appendWidget(widgetToAdd);
    // UndoService.recordCreateAction({ widgets: [widgetToAdd] });
  }
  else if (dragItem.group === WORKSPACE_WIDGETS) {
    var widgets = dragItem.getDragData('widgets');
    // var source = getCoords(widgets[0]);
    widgets.forEach(widgetToAdd => {
      widgetToAdd.disconnect();
      list.appendWidget(widgetToAdd);
    });
    // UndoService.recordMoveAction({
    //   widgetData: newWidgets.map(deserializeWidgets),
    //   source,
    //   dest: getCoords(widgets[0])
    // });
  }
}

// part of this method we will want to use to carry out "redos"
// as they both are operating on 'widgetData', not widgets
function afterTargetFromClipboard(opts) {
  var newWidgets = opts.copiedWidgets.map(widgetData => {
    return deserializeWidget(widgetData, workspace.uid());
  });

  if (opts.referenceWidget) {
    newWidgets.reverse().forEach(widget => {
      // insertAfterInNearestParentList(widget, otps.referenceWidget);
      opts.referenceWidget.insertAfterInNearestParentList(widget);
    });
  } else {
    newWidgets.reverse().forEach(widget => opts.workspace.appendChild(widget));
  }
  // UndoService.recordCreateAction({ widgets: newWidgets });
}

export default { afterWidgetInList, toWidgetSlot, toEndOfList, afterTargetFromClipboard };

function getCoords(widget) {
  return null;
}
