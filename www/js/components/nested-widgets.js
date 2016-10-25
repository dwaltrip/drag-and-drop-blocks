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
    createDragItem: params.createDragItem,
    metalDragon: params.metalDragon
  });
}

export { WidgetSlot, WidgetList };
