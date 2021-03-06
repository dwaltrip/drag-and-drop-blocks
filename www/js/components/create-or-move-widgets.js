import { deserializeWidget } from 'models/widget-serializer';
import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS } from 'app-constants';
import { UndoService } from 'services';

import Widget from 'models/widget';

export default {
  afterWidgetInList: function(opts) {
    var dragItem = opts.dragItem;
    var list = opts.list;
    var refWidget = opts.referenceWidget;

    if (dragItem.group === TOOLBOX_WIDGETS) {
      var newWidget = Widget.create({ type: dragItem.getItemData('widgetType') });
      list.insertAfter(newWidget, refWidget);
      dragItem.setDragData('newWidget', newWidget);
      UndoService.recordCreateAction({ widgets: [newWidget] });
    }
    else if (dragItem.group === WORKSPACE_WIDGETS) {
      var widgets = dragItem.getDragData('widgets');
      var source = UndoService.getCoord(widgets[0]);
      widgets.forEach(widget => {
        widget.disconnect();
        list.insertAfter(widget, refWidget);
        refWidget = widget;
      });
      UndoService.recordMoveAction({
        source,
        dest: UndoService.getCoord(widgets[0]),
        count: widgets.length
      });
    }
  },

  toWidgetSlot: UndoService.asTransaction(function(opts) {
    var dragItem = opts.dragItem;
    var parent = opts.parentWidget;

    var widgetToReplace = parent.getInput(opts.slotName);
    if (widgetToReplace) {
      var source = UndoService.getCoord(widgetToReplace);
      widgetToReplace.disconnect();
      parent.insertAfterInNearestParentList(widgetToReplace);
      UndoService.recordMoveAction({
        source,
        dest: UndoService.getCoord(widgetToReplace),
        count: 1
      });
    }

    if (dragItem.group === TOOLBOX_WIDGETS) {
      var newWidget = parent.createInput(opts.slotName, dragItem.getItemData('widgetType'));
      dragItem.setDragData('newWidget', newWidget);
      UndoService.recordCreateAction({ widgets: [newWidget] });
    }
    else if (dragItem.group === WORKSPACE_WIDGETS) {
      var dragWidget = dragItem.getItemData('widget');
      var source = UndoService.getCoord(dragWidget);
      dragWidget.disconnect();
      parent.setInput(opts.slotName, dragWidget);
      UndoService.recordMoveAction({
        source,
        dest: UndoService.getCoord(dragWidget),
        count: 1
      });
    }
  }),

  toEndOfList: function(opts) {
    var dragItem = opts.dragItem;
    var list = opts.list;

    if (dragItem.group === TOOLBOX_WIDGETS) {
      var widgetToAdd = Widget.create({ type: dragItem.getItemData('widgetType') });
      list.append(widgetToAdd);
      dragItem.setDragData('newWidget', widgetToAdd);
      UndoService.recordCreateAction({ widgets: [widgetToAdd] });
    }
    else if (dragItem.group === WORKSPACE_WIDGETS) {
      var widgets = dragItem.getDragData('widgets');
      var source = UndoService.getCoord(widgets[0]);
      widgets.forEach(widgetToAdd => {
        widgetToAdd.disconnect();
        list.append(widgetToAdd);
      });
      var workspaceId = widgets[0].workspace();
      UndoService.recordMoveAction({
        source,
        dest: UndoService.getCoord(widgets[0]),
        count: widgets.length
      });
    }
  },

  fromClipboard: function(opts) {
    var newWidgets = opts.copiedWidgetData.map(widgetData => {
      return deserializeWidget(widgetData, opts.workspace.uid());
    });

    if (opts.referenceWidget) {
      newWidgets.slice().reverse().forEach(widget => {
        opts.referenceWidget.insertAfterInNearestParentList(widget);
      });
    } else {
      newWidgets.slice().forEach(widget => opts.workspace.append(widget));
    }
    UndoService.recordCreateAction({ widgets: newWidgets });
    return newWidgets;
  }
};
