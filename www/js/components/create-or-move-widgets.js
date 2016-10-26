import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS } from 'app-constants';

function afterWidgetInList(opts) {
  var dragItem = opts.dragItem;
  var list = opts.list;
  var refWidget = opts.referenceWidget;

  if (dragItem.group === TOOLBOX_WIDGETS) {
    var newWidget = list.createWidget(dragItem.getItemData('widgetType'))
    list.insertAfter(newWidget, refWidget);
    dragItem.setDragData('newWidget', newWidget);
  }
  else if (dragItem.group === WORKSPACE_WIDGETS) {
    dragItem.getDragData('widgets').forEach(widget => {
      widget.disconnect();
      list.insertAfter(widget, refWidget);
      refWidget = widget;
    });
  }
}

function toWidgetSlot(opts) {
  var dragItem = opts.dragItem;

  if (dragItem.group === TOOLBOX_WIDGETS) {
    var newWidget = opts.parentWidget.createInput(opts.slotName, dragItem.getItemData('widgetType'));
    dragItem.setDragData('newWidget', newWidget);
  }
  else if (dragItem.group === WORKSPACE_WIDGETS) {
    var dragWidget = dragItem.getItemData('widget');
    dragWidget.disconnect();
    opts.parentWidget.setInput(opts.slotName, dragWidget);
  }
}

function toEndOfList(opts) {
  var dragItem = opts.dragItem;
  var list = opts.list;

  if (dragItem.group === TOOLBOX_WIDGETS) {
    var widgetToAdd = list.createWidget(dragItem.getItemData('widgetType'));
    dragItem.setDragData('newWidget', widgetToAdd);
    list.appendWidget(widgetToAdd);
  }
  else if (dragItem.group === WORKSPACE_WIDGETS) {
    dragItem.getDragData('widgets').forEach(widgetToAdd => {
      widgetToAdd.disconnect();
      list.appendWidget(widgetToAdd);
    });
  }
}

export default { afterWidgetInList, toWidgetSlot, toEndOfList };
