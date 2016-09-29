import m from 'mithril';

import on from 'lib/m-utils/on';
import doAll from 'lib/m-utils/do-all';
import { WidgetNames } from 'models/widget'

function configDropzone(el, isInitialized, context) {
  if (isInitialized) { return; }

  var dropzone = new Dragster(el);
  context.onunload = () => dropzone.removeListeners();
};

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
    this.dragImages = [];
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
      config: doAll(
        configDropzone,
        on({
          'dragster:enter': () => {
            if (widgetToMoveProp().uid() !== widget.uid()) {
              // TODO: this only works in the naive case where the user drags directly up and down the list
              // It doesn't work properly when the user drags out of the list and re-enters at a different point
              // :(
              var tmp = widgetToMoveProp().pos();
              widgetToMoveProp().pos(widget.pos());
              widget.pos(tmp);
            }
            controller.isHovering = true;
          },
          'dragster:leave': () => {
            controller.isHovering = false;
          }
        })
      ),
    }, m('.widget' + classList, [
      m('.widget-title', {
        draggable: true,
        ondragstart: function(event) {
          controller.isDragging = true;
          var dragImage = findAncestorWithClass(this, 'widget').cloneNode(true);
          dragImage.classList.add('is-drag-image')
          document.body.appendChild(dragImage);
          pushOffScreen(dragImage);
          controller.dragImages.push(dragImage);
          event.dataTransfer.setDragImage(dragImage, 0, 0)
          event.dataTransfer.setData('text/plain', 'This text may be dragged');
          widgetToMoveProp(controller.widget);
        },
        ondragend: function() {
          controller.dragImages.forEach(dragImage => dragImage.remove());
          controller.dragImages = [];
          controller.isDragging = false;
          widgetToMoveProp(null);
          params.saveWidgets();
        }
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


function pushOffScreen(el) {
  el.style.position = 'absolute';
  el.style.top = `-${el.offsetHeight}px`;
  el.style.left = `-${el.offsetWidth}px`;
}

function findAncestorWithClass(el, cls) {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}
