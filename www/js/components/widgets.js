import m from 'mithril';

import { configForDragItem, configForDropzone } from 'lib/m-utils/metal-dragon-helpers';
import { WidgetNames } from 'models/widget'


var WidgetComponents = {
  [WidgetNames.WIDGET1]: buildWidgetComponent('Widget 1', '.widget-1'),
  [WidgetNames.WIDGET2]: buildWidgetComponent('Widget 2', '.widget-2'),
  [WidgetNames.WIDGET3]: buildWidgetComponent('Widget 3', '.widget-3')
};

function buildWidgetComponent(title, className) {
  return {
    controller: function(params) {
      var self = this;
      var params = params || {};
      this.widgetToMoveProp = params.widgetToMove;

      var widget = this.widget = params.widget || {
        uid: m.prop(null),
        pos: m.prop(null),
        name: m.prop('blank')
      };

      this.dragItem = params.createDragItem({
        onDragStart: ()=> {
          this.dragItem.setDragData('widget', widget);
          this.widgetToMoveProp(widget);
          this.dropzone.disable();
        },
        onDrop: ()=> {
          if (!this.dragItem.isAboveGroup('trashcan')) {
            this.widgetToMoveProp(null);
            params.saveWidgets();
            this.dropzone.enable();
          }
        }
      });

      this.dropzone = params.createDropzone({
        group: 'widget-row',
        onDragEnter: (event, dragItem)=> {
          if (this.widgetToMoveProp().uid() !== widget.uid()) {
            // TODO: this only works in the naive case where the user drags directly up and down the list
            // It doesn't work properly when the user drags out of the list and re-enters at a different point :(
            var tmp = this.widgetToMoveProp().pos();
            this.widgetToMoveProp().pos(widget.pos());
            widget.pos(tmp);
          }
        }
      });

      this.configDragItem = configForDragItem(this.dragItem);
      this.configDropzone = configForDropzone(this.dropzone);

      this.onunload = ()=> {
        this.dragItem.destroy();
        this.dropzone.destroy();
      };
    },

    view: function(controller, params) {
      var params = params || {};
      var widget = controller.widget;

      var isDragging = controller.dragItem.isDragging();
      var isDraggingClass = isDragging ? '.is-dragging' : '';
      var classList = (className || '') + isDraggingClass;
      var isDraggingOverClass = controller.dropzone.isUnderDragItem() ? '.is-dragging-over' : '';

      return m('.widget-row' + isDraggingOverClass, {
        key: widget.uid(),
        config: controller.configDropzone
      }, m('.widget' + classList, { config: controller.configDragItem }, [
        m('.widget-title', `${title} -- ${widget.uid()} -- ${widget.pos()}`),
        m('.widget-slot')
      ]));
    }
  };
}

function lookupWidgetComponent(name) {
  return WidgetComponents[name];
}


export { lookupWidgetComponent, WidgetComponents };
