import m from 'mithril';

import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';
import { WidgetTypes } from 'models/widget';

import createOrMoveWidgets from 'components/create-or-move-widgets';
import { widgetSlotLayout, widgetListLayout } from 'components/widget-layout';
import WidgetComponent from 'components/widget';

var WidgetSlot = {
  // TODO: we can't set the slotWidget as a controller property
  // because if the slotWidget is moved somewhere else,
  // we don't have a good way of clearing it out in the old controller
  // Thus, in the UI, it will be present in both the old slot and in its new position.
  // So we must re-fetch the widget input in the view for each render (as we don't know if it's been removed or not)
  controller: function(params) {
    var self = this;
    this.parentWidget = params.parentWidget;
    this.inputName = params.inputName;

    this.dropzone = params.metalDragon.createDropzone({
      group: 'widget-slot',
      itemData: { parentWidget: this.parentWidget },
      // TODO: rename 'isEligible' to 'canDrop'
      isEligible: function(dragItem) {
        if (dragItem.group === TOOLBOX_WIDGETS) { return true; }
        var dragWidget = dragItem.getItemData('widget')
        var slotWidget = self.parentWidget.getInput(self.inputName);
        return !params.selectionDetails().isMultiSelect &&
          dragWidget !== slotWidget &&
          dragWidget !== self.parentWidget &&
          !dragWidget.isAncestorOf(self.parentWidget);
      },
      onDrop: (dragItem)=> createOrMoveWidgets.toWidgetSlot({
        dragItem,
        parentWidget: this.parentWidget,
        slotName: this.inputName
      })
    });
    this.onunload = ()=> this.dropzone.destroy();

    this.cssClasses = ()=> {
      return [
        this.dropzone && this.dropzone.isDropTarget() ? '.is-drop-target' : '',
        !!this.parentWidget.getInput(params.inputName) ? '.has-widget' : ''
      ].join('');
    };
  },

  view: function(controller, params) {
    var widget = controller.parentWidget.getInput(controller.inputName);
    return widgetSlotLayout(widget ? nestedWidget(widget, params) : null, {
      cssClasses: controller.cssClasses(),
      key: `widget-slot-${params.inputName}`,
      config: controller.dropzone.attachToElement
    });
  }
};

var WidgetList = {
  controller: function(params) {
    var self = this;
    this.parentWidget = params.parentWidget;
    this.widgetList = this.parentWidget.getInputList(params.listName);

    this.dropzone = params.metalDragon.createDropzone({
      group: 'widget-list',
      isEligible: ()=> {
        var parentWidget = this.widgetList.getParentWidget();
        var selectedIds = params.selectionDetails().widgetUIDs;
        var parentWidgetIsSelected = parentWidget && (
          parentWidget.uid() in selectedIds ||
          parentWidget.findAncestorWidget(parent => parent in selectedIds)
        );
        return this.widgetList.isEmpty() && !parentWidgetIsSelected;
      },
      onDrop: (dragItem)=> createOrMoveWidgets.toEndOfList({
        dragItem,
        list: this.widgetList
      })
    });
    this.onunload = ()=> this.dropzone.destroy();

    this.cssClasses = ()=> {
      return [
        this.dropzone.isDropTarget() ? '.is-drop-target' : '',
      ].join('');
    };
  },

  view: function(controller, params) {
    var widgets = controller.widgetList.widgets;
    return widgetListLayout(widgets.map(widget => nestedWidget(widget, params)), {
      cssClasses: controller.cssClasses(),
      config: controller.dropzone.attachToElement
    });
  }
};

function nestedWidget(widget, params) {
  return m(WidgetComponent, {
    key: widget.uid(),
    widget,
    selectionDetails: params.selectionDetails,
    createDragItem: params.createDragItem,
    metalDragon: params.metalDragon
  });
}

export { WidgetSlot, WidgetList };

// TODO: potentially delete this
// function isNestedUnderSelectedWidget(widget, selectionDetails) {
//   var parentWidget = widget;
//   var isParentSelected = parentWidget.uid() in selectionDetails().widgetUIDs;
//   while(parentWidget && !isParentSelected) {
//     parentWidget = parentWidget.getContainingWidget()
//     isParentSelected = parentWidget && parentWidget.uid() in selectionDetails().widgetUIDs;
//   }
//   return isParentSelected;
// }
