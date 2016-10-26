import m from 'mithril';

import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';
import { WidgetTypes } from 'models/widget'

import { viewDetailsForWidgetType, viewFunctionLookup } from 'components/widget-type-details';
import { widgetLayout } from 'components/widget-layout';
import createOrMoveWidgets from 'components/create-or-move-widgets';

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
          return !self.isSelected(params.selectionDetails);
        },
        onDrop: (dragItem)=> createOrMoveWidgets.afterWidgetInList({
          dragItem,
          list: widget.getParentList(),
          referenceWidget: widget
        })
      });
    }

    this.isDropTarget = ()=> {
      return this.dropzone && this.dropzone.isDropTarget();
    }

    this.onunload = ()=> {
      this.dragItem.destroy();
      if (this.dropzone) { this.dropzone.destroy(); }
    };

    this.isSelected = (selectionDetails)=> {
      var selectedIds = params.selectionDetails().widgetUIDs;
      var isDirectlySelected = widget.uid() in selectedIds;
      var isChildOfSelected = !!widget.findAncestorWidget(parent => parent.uid() in selectedIds);
      return isDirectlySelected || isChildOfSelected;
    };
  },

  // TODO: Analyze the complexity of this view... can we simplify these boolean expressions?!
  view: function(controller, params) {
    var params = params || {};
    var widget = controller.widget;
    var isDragging = controller.dragItem.isDragging();
    var isSelected = controller.isSelected(params.selectionDetails);
    var viewDetails = viewDetailsForWidgetType(widget.type());

    var widgetClasses = [
      viewDetails.className || '',
      isDragging ? '.is-dragging' : '',
      isSelected ? '.is-selected' : ''
    ].join('');

    var selectedWidget = params.metalDragon.activeDragItem &&
      params.metalDragon.activeDragItem.getItemData('widget', null);

    var selectedWidget = params.selectionDetails().widgets[0]
    var isRootLevelMultiSelect = (
      selectedWidget &&
      selectedWidget.isRoot() &&
      params.selectionDetails().isMultiSelect
    );
    var isTargetingWorkspaceMargin = !isRootLevelMultiSelect &&
      params.metalDragon.isTargetingDropzoneGroup('bottom-of-workspace');
    var isLastWorkspaceWidget = widget === widget.getWorkspace().getWidgets().slice(-1).pop();

    var isTargetRow = controller.isDropTarget() || (
      isTargetingWorkspaceMargin &&
      isLastWorkspaceWidget &&
      !isDragging
    );

    var lastSelectedWidget = params.selectionDetails().widgets.slice(-1).pop();
    var isLastSelectedWidget = widget === lastSelectedWidget;
    var isBeforeSelectedWidget = selectedWidget && widget.nextWidget() === selectedWidget;

    // TODO: debug this, after some widget re-arrangements it sometimes breaks
    var noBottomConnector = (
      widget.isLastWidget() ||
      controller.isDropTarget() ||
      widget.isInSlot() ||
      (params.metalDragon.isMidDrag() && isBeforeSelectedWidget) ||
      (params.metalDragon.isMidDrag() && isLastSelectedWidget)
    );

    var widgetRowClasses = [
      isTargetRow           ? '.is-drop-target' : '',
      isSelected            ? '.is-selected' : '',
      !noBottomConnector    ? '.has-bottom-connector' : '',
      widget.isInSlot()     ? '.is-in-slot' : ''
    ].join('')

    var viewFn = viewFunctionLookup[widget.type()];
    var content = [
      // m('.widget-title', `${viewDetails.title} -- ${widget.uid()} -- ${widget.pos()}`),
      // m('.widget-title', `${viewDetails.title} -- ${widget.uid()}`),
      m('.widget-title', viewDetails.title),
      viewFn(widget, {
        selectionDetails: params.selectionDetails,
        createDragItem: params.createDragItem,
        metalDragon: params.metalDragon
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
