import m from 'mithril';

import doAll from 'lib/m-utils/do-all';
import on from 'lib/m-utils/on';
import handleWithRedraw from 'lib/m-utils/handle-with-redraw';

import { WidgetNames } from 'models/widget'


// var Dropzone = {
//   create: {
//     return Object.create(this.instance);
//   },

//   instance: {
//     addListeners: function(el, isInitialized, context) {
//       if (isInitialized) { return; }

//       var handler = handleWithRedraw(this.onDrop.bind(this));
//       el.addEventListener
//     }
//   }
// };

var Widget1 = {
  controller: widgetControllerBuilder(),
  view: widgetViewBuilder('Widget 1', '.widget-1')
};

var Widget2 = {
  controller: widgetControllerBuilder(),
  view: widgetViewBuilder('Widget 2', '.widget-2')
};

var Widget3 = {
  controller: widgetControllerBuilder(),
  view: widgetViewBuilder('Widget 3', '.widget-3')
};

function widgetControllerBuilder() {
  return function(params) {
    var params = params || {};
    var self = this;
    this.isDragging = false;
    this.dragItem = params.createDragItem({
      onDragend: function() {
        self.isDragging = false;
      }
    });
    this.widget = params.widget || {
      uid: m.prop(null),
      pos: m.prop(null),
      name: m.prop('blank')
    };
  };
}

function widgetViewBuilder(title, className) {
  var className = className || '';
  return function(controller, params) {
    var params = params || {};
    var widget = controller.widget;
    var widgetToMoveProp = params.widgetToMove;

    var isDraggingClass = controller.isDragging ? '.is-dragging' : '';
    var classList = (className || '') + isDraggingClass;
    var isDraggingOverClass = controller.isHovering ? '.is-dragging-over' : '';

    return m('.widget-row' + isDraggingOverClass, {
      key: widget.uid(),
      // config: doAll(
        // configDropzone,
        // FIX: toolbox widgets are not drop zones
        // on({
        //   'dragster:enter': () => {
        //     if (widgetToMoveProp().uid() !== widget.uid()) {
        //       // TODO: this only works in the naive case where the user drags directly up and down the list
        //       // It doesn't work properly when the user drags out of the list and re-enters at a different point
        //       // :(
        //       var tmp = widgetToMoveProp().pos();
        //       widgetToMoveProp().pos(widget.pos());
        //       widget.pos(tmp);
        //     }
        //     controller.isHovering = true;
        //   },
        //   'dragster:leave': () => {
        //     controller.isHovering = false;
        //   }
        // })
      // ),
    }, m('.widget' + classList, [
      m('.widget-title', {
        onmousedown: function(event) {
          controller.isDragging = true;
          controller.dragItem.startDrag(event);
          // TODO: toolbox widgets don't have this!!!
          // we need to create a widget to be added when we drag from the toolbox
          widgetToMoveProp(controller.widget);
        },
        // ondragend: function() {
        //   controller.isDragging = false;
        //   controller.dragWithImage.cleanup();
        //   widgetToMoveProp(null);
        //   params.saveWidgets();
        // }
      }, `${title} -- ${widget.uid()} -- ${widget.pos()}`),
      m('.widget-slot')
    ]));
  };
}

var WidgetComponents = {
  [WidgetNames.WIDGET1]: Widget1,
  [WidgetNames.WIDGET2]: Widget2,
  [WidgetNames.WIDGET3]: Widget3
};

function lookupWidgetComponent(name) {
  return WidgetComponents[name];
}


export { lookupWidgetComponent, WidgetComponents };
