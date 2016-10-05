import m from 'mithril';

import doAll from 'lib/m-utils/do-all';
import on from 'lib/m-utils/on';
import handleWithRedraw from 'lib/m-utils/handle-with-redraw';

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
      var isInWorkspace = this.isInWorkspace = params.isInWorkspace;

      var widget = this.widget = params.widget || {
        uid: m.prop(null),
        pos: m.prop(null),
        name: m.prop('blank')
      };

      this.dragItem = params.createDragItem({
        onDragend: ()=> {
          this.widgetToMoveProp(null);
          params.saveWidgets();
        }
      });

      if (isInWorkspace) {
        this.dropzone = params.createDropzone({
          onMouseenter: ()=> {
            if (this.widgetToMoveProp().uid() !== widget.uid()) {
              // TODO: this only works in the naive case where the user drags directly up and down the list
              // It doesn't work properly when the user drags out of the list and re-enters at a different point :(
              var tmp = this.widgetToMoveProp().pos();
              this.widgetToMoveProp().pos(widget.pos());
              widget.pos(tmp);
            }
          }
        });
      }

      this.configDropzone = (element, isInitialized, context) => {
        if (isInitialized || !isInWorkspace) { return; }
        this.dropzone.attachToElement(element);
      };
    },

    view: function(controller, params) {
      var params = params || {};
      var widget = controller.widget;
      var isInWorkspace = controller.isInWorkspace;
      var widgetToMoveProp = params.widgetToMove;

      var isDragging = controller.dragItem.isDragging();

      var isDraggingClass = isDragging ? '.is-dragging' : '';
      var classList = (className || '') + isDraggingClass;
      var isDraggingOverClass = isInWorkspace && controller.dropzone.isDraggingOver() ?
        '.is-dragging-over' : '';

      return m('.widget-row' + isDraggingOverClass, {
        key: widget.uid(),
        config: controller.configDropzone
      }, m('.widget' + classList, [
        m('.widget-title', {
          onmousedown: function(event) {
            controller.dragItem.startDrag(event);
            // TODO: The rest of this callback should only occur once we start dragging (the mouse has moved a bit)
            // TODO: toolbox widgets don't have this!!!
            // we need to create a widget to be added when we drag from the toolbox
            widgetToMoveProp(controller.widget);
          },
        }, `${title} -- ${widget.uid()} -- ${widget.pos()}`),
        m('.widget-slot')
      ]));
    }
  };
}

function lookupWidgetComponent(name) {
  return WidgetComponents[name];
}


export { lookupWidgetComponent, WidgetComponents };
