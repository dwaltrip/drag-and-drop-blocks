import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS } from 'app-constants';

function afterWidgetInList(opts) {
  var dragItem = opts.dragItem;
  var list = opts.list;
  var refWidget = opts.referenceWidget;

  if (dragItem.group === WORKSPACE_WIDGETS) {
    var dragWidget = dragItem.getItemData('widget');
    dragWidget.disconnect();
    list.insertAfter(dragWidget, refWidget);
  } else {
    var newWidget = list.createWidget(dragItem.getItemData('widgetType'))
    list.insertAfter(newWidget, refWidget);
  }
}

function toWidgetSlot(opts) {
  var dragItem = opts.dragItem;

  if (dragItem.group === TOOLBOX_WIDGETS) {
    opts.parentWidget.createInput(opts.slotName, dragItem.getItemData('widgetType'));
  } else {
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
  } else {
    var widgetToAdd = dragItem.getItemData('widget');
    widgetToAdd.disconnect();
  }
  return list.appendWidget(widgetToAdd);
}

export default {
  afterWidgetInList,
  toWidgetSlot,
  toEndOfList
};
