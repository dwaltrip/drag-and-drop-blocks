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
      this.isDragging = false;
      this.widgetToMoveProp = params.widgetToMove;
      this.isInWorkspace = params.isInWorkspace;

      var widget = this.widget = params.widget || {
        uid: m.prop(null),
        pos: m.prop(null),
        name: m.prop('blank')
      };

      this.dragItem = params.createDragItem({
        onDragend: ()=> {
          this.isDragging = false;
          this.widgetToMoveProp(null);
          params.saveWidgets();
        }
      });

      this.onMouseEnterDuringDrag = ()=> {
        if (this.widgetToMoveProp().uid() !== widget.uid()) {
          // TODO: this only works in the naive case where the user drags directly up and down the list
          // It doesn't work properly when the user drags out of the list and re-enters at a different point
          // :(
          var tmp = this.widgetToMoveProp().pos();
          this.widgetToMoveProp().pos(widget.pos());
          widget.pos(tmp);
        }
        self.isHovering = true;
      };
      // FIXME: if we end the current drag before leaving this widget row,
      // then the mouseleave event will not fire and this widget gets stuck in 'isHovering' mode
      this.onMouseLeaveDuringDrag = ()=> {
        self.isHovering = false;
      }
    },
    view: function(controller, params) {
      var params = params || {};
      var widget = controller.widget;
      var widgetToMoveProp = params.widgetToMove;

      var isDraggingClass = controller.isDragging ? '.is-dragging' : '';
      var classList = (className || '') + isDraggingClass;
      var isDraggingOverClass = controller.isHovering ? '.is-dragging-over' : '';
      var isReadyForDrop = params.isDraggingAWidget && controller.isInWorkspace && !controller.isDragging;

      return m('.widget-row' + isDraggingOverClass, {
        key: widget.uid(),
        onmouseenter: isReadyForDrop ? controller.onMouseEnterDuringDrag : null,
        onmouseleave: isReadyForDrop ? controller.onMouseLeaveDuringDrag : null
      }, m('.widget' + classList, [
        m('.widget-title', {
          onmousedown: function(event) {
            controller.dragItem.startDrag(event);
            // TODO: The rest of this callback should only occur once we start dragging (the mouse has moved a bit)
            controller.isDragging = true;
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
