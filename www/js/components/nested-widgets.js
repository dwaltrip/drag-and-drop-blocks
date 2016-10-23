import m from 'mithril';

import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';
import { WidgetTypes } from 'models/widget';

import { widgetSlotLayout, widgetListLayout } from 'components/widget-layout';
import WidgetComponent from 'components/widget';

var WidgetSlot = {
  // TODO: we can't set the slotWidget as a controller property
  // because if the slotWidget is moved somewhere else,
  // we don't have a good way of clearing it out in the old controller
  // Thus, in the UI, it will be present in both the old slot and in its new position.
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
        return dragWidget !== slotWidget &&
          dragWidget !== self.parentWidget &&
          !dragWidget.isAncestorOf(self.parentWidget);
      },
      onDrop: function(dragItem) {
        if (dragItem.group === TOOLBOX_WIDGETS) {
          self.parentWidget.createInput(self.inputName, dragItem.getItemData('widgetType'));
        } else {
          var dragWidget = dragItem.getItemData('widget');
          dragWidget.disconnect();
          self.parentWidget.setInput(self.inputName, dragWidget);
        }
      }
    });
    this.onunload = ()=> this.dropzone.destroy();

    this.cssClasses = ()=> {
      return [
        this.dropzone && this.dropzone.isDropTarget() ? '.is-drop-target' : '',
      ].join('');
    };
  },

  view: function(controller, params) {
    var widget = controller.parentWidget.getInput &&
      controller.parentWidget.getInput(controller.inputName);

    var content = widget ? m(WidgetComponent, {
      key: widget.uid(),
      widget,
      widgetToMove: params.widgetToMove,
      createDragItem: params.createDragItem,
      metalDragon: params.metalDragon
    }) : null;

    return widgetSlotLayout(content, {
      cssClasses: controller.cssClasses(),
      key: `widget-slot-${params.inputName}`,
      config: controller.dropzone.attachToElement
    });
    // return m('.widget-slot' + controller.cssClasses(), {
    //   key: `widget-slot-${params.inputName}`,
    //   config: controller.dropzone.attachToElement
    // }, nestedWidget(widget, params));
  }
};

var WidgetList = {
  controller: function(params) {
    var self = this;
    this.parentWidget = params.parentWidget;
    this.listName = params.listName;
    this.widgetList = this.parentWidget.getInputList &&
      this.parentWidget.getInputList(this.listName);

    this.dropzone = params.metalDragon.createDropzone({
      group: 'widget-list',
      isEligible: ()=> this.widgetList.isEmpty(),
      onDrop: function(dragItem) {
        if (dragItem.group === TOOLBOX_WIDGETS) {
          var widgetToAdd = self.widgetList.createWidget(dragItem.getItemData('widgetType'));
        } else {
          var widgetToAdd = dragItem.getItemData('widget');
          widgetToAdd.disconnect();
        }
        self.widgetList.appendWidget(widgetToAdd);
      }
    });
    this.onunload = ()=> this.dropzone.destroy();

    this.cssClasses = ()=> {
      return [
        this.dropzone.isDropTarget() ? '.is-drop-target' : '',
      ].join('');
    };
  },

  view: function(controller, params) {
    var content = controller.widgetList.widgets.map(widget => {
      return m(WidgetComponent, {
        key: widget.uid(),
        widget,
        widgetToMove: params.widgetToMove,
        createDragItem: params.createDragItem,
        metalDragon: params.metalDragon
      });
      // return nestedWidget(widget, params)
    });
    return widgetListLayout(content, {
      cssClasses: controller.cssClasses(),
      config: controller.dropzone.attachToElement
    });
    // return m('.nested-widget-list' + controller.cssClasses(), {
    //   config: controller.dropzone.attachToElement
    // }, controller.widgetList ?
    //   controller.widgetList.widgets.map(widget => nestedWidget(widget, params)) :
    // );
  }
};

export { WidgetSlot, WidgetList };

// function nestedWidget(widget, opts) {
//   return m(WidgetComponent, {
//     key: widget.uid(),
//     widget,
//     widgetToMove: opts.widgetToMove,
//     createDragItem: opts.createDragItem,
//     metalDragon: opts.metalDragon
//   });
// }
