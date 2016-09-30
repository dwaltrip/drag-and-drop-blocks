import m from 'mithril';

import { WidgetNames } from 'models/widget'
import DragWithImage from 'lib/drag-with-image';

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
    this.dragWithImage = DragWithImage.create({
      findElementForDragImage: element => findAncestorWithClass(element, 'widget')
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

    var isDraggingClass = controller.isDragging ? '.is-dragging' : '';
    var classList = (className || '') + isDraggingClass;

    return m('.widget-row', { key: widget.uid() }, m('.widget' + classList, [
      m('.widget-title', {
        draggable: true,
        ondragstart: function(event) {
          controller.isDragging = true;
          var dragImage = controller.dragWithImage.prepImage(this);
          event.dataTransfer.setDragImage(dragImage, 0, 0);
          dragImage.classList.add('is-drag-image')
          event.dataTransfer.setData('text/plain', 'This text may be dragged');
          // TODO: toolbox widgets don't have this!!!
          // we need to create a widget to be added when we drag from the toolbox
          widgetToMoveProp(controller.widget);
        },
        ondragend: function() {
          controller.isDragging = false;
          controller.dragWithImage.cleanup();
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

function findAncestorWithClass(el, cls) {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}


export { lookupWidgetComponent, WidgetComponents };
