import m from 'mithril';

import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';
import { WidgetTypes } from 'models/widget'

import { viewDetailsForWidgetType, viewFunctionLookup } from 'components/widget-type-details';
import { widgetLayout } from 'components/widget-layout';

export default {
  controller: function(params) {
    var self = this;
    var params = params || {};
    var widget = this.widget = params.widget;

    this.dragItem = params.createDragItem(widget);

    if (widget.isInList()) {
      this.dropzone = params.metalDragon.createDropzone({
        group: MOVE_WIDGET,
        itemData: { widget },
        useDragElementOverlap: true,
        isEligible: function(dragItem) {
          if (dragItem.group === TOOLBOX_WIDGETS) { return true; }
          return widget !== dragItem.getItemData('widget');
        },
        onDrop: function(dragItem) {
          var dropzoneWidget = this.getItemData('widget');
          var targetList = dropzoneWidget.getParentList();
          if (dragItem.group === WORKSPACE_WIDGETS) {
            var dragWidget = dragItem.getItemData('widget');
            dragWidget.disconnect();
            targetList.insertAfter(dragWidget, dropzoneWidget);
          } else {
            var newWidget = targetList.createWidget(dragItem.getItemData('widgetType'))
            targetList.insertAfter(newWidget, dropzoneWidget);
          }
        }
      });
    }

    this.isDropTarget = ()=> {
      return this.dropzone && this.dropzone.isDropTarget();
    }

    this.onunload = ()=> {
      this.dragItem.destroy();
      if (this.dropzone) { this.dropzone.destroy(); }
    };

  },

  view: function(controller, params) {
    var params = params || {};
    var widget = controller.widget;
    var isDragging = controller.dragItem.isDragging();
    var viewDetails = viewDetailsForWidgetType(widget.type());

    var widgetClasses = [
      viewDetails.className || '',
      isDragging ? '.is-selected' : ''
    ].join('');

    var selectedWidget = params.metalDragon.activeDragItem &&
      params.metalDragon.activeDragItem.getItemData('widget', null);

    var isLastWorkSpaceWidget = widget === widget.getWorkspace().getWidgets().slice(-1).pop();
    var isTargetingWorkspaceMargin = params.metalDragon.isTargetingDropzoneGroup('bottom-of-workspace');
    var isBeforeSelectedWidget = selectedWidget && widget.nextWidget() === selectedWidget;

    var isTargetRow = controller.isDropTarget() || (isLastWorkSpaceWidget && isTargetingWorkspaceMargin);
    var noBottomConnector = isDragging || widget.isLastWidget() ||
      controller.isDropTarget() || isBeforeSelectedWidget || widget.isInSlot();

    var widgetRowClasses = [
      isTargetRow        ? '.is-drop-target' : '',
      !noBottomConnector  ? '.has-bottom-connector' : '',
      widget.isInSlot() ? '.is-in-slot' : ''
    ].join('')

    var viewFn = viewFunctionLookup[widget.type()];
    var content = [
      // m('.widget-title', `${viewDetails.title} -- ${widget.uid()} -- ${widget.pos()}`),
      m('.widget-title', viewDetails.title),
      viewFn(widget, {
        metalDragon: params.metalDragon,
        createDragItem: params.createDragItem
      })
    ];

    return widgetLayout(content, {
      key: widget.uid(),
      widgetRowClasses,
      widgetClasses,
      dragItemConfig: controller.dragItem.attachToElement,
      dropzoneConfig: controller.dropzone ? controller.dropzone.attachToElement : null
    });
  }
};
