import m from 'mithril';


var Widget1 = {
  controller: function() {
    this.ghostImages = [];
  },
  view: function(controller) {
    return widgetLayout(controller, 'Widget 1', { classes: '.widget-1' });
  }
};

var Widget2 = {
  controller: function() {
    this.ghostImages = [];
  },
  view: function(controller) {
    return widgetLayout(controller, 'Widget 2', { classes: '.widget-2' });
  }
};

function widgetLayout(controller, content, params) {
  var params = params || {};

  var isDraggingClass = controller.isDragging ? '.is-dragging' : '';
  var classes = (params.classes || '') + isDraggingClass;

  return m('.widget' + classes, [
    m('.widget-content', {
      draggable: true,
      ondragstart: function(event) {
        controller.isDragging = true;
        // var ghost = createDiv();
        // document.body.appendChild(ghost);
        // controller.ghostImages.push(ghost);
        // event.dataTransfer.setDragImage(ghost, 0, 0);

        var ghost = findAncestorWithClass(this, 'widget').cloneNode(true);
        ghost.classList.add('is-drag-image')
        document.body.appendChild(ghost);
        pushOffScreen(ghost);
        controller.ghostImages.push(ghost);
        event.dataTransfer.setDragImage(ghost, 0, 0)
        event.dataTransfer.setData('text/plain', 'This text may be dragged');
      },
      ondragend: function() {
        controller.ghostImages.forEach(ghost => ghost.remove());
        controller.ghostImages = [];
        controller.isDragging = false;
      }
    }, content),
    m('.widget-slot')
  ]);
};


var Widgets = [
  { name: 'widget1', component: Widget1 },
  { name: 'widget2', component: Widget2 }
];

var lookupWidgetComponent = (function() {
  var widgetHash = Widgets.reduce((memo, widget) => {
    memo[widget.name] = widget;
    return memo;
  }, {});

  return function(name) {
    return widgetHash[name].component;
  };
})();


export { Widget1, Widget2, Widgets, lookupWidgetComponent };

function createDiv() {
  var div = document.createElement('div');
  div.style.height = '20px';
  div.style.width = '40px';
  div.style.backgroundColor = 'green';
  pushOffScreen(div);
  return div;
}

function pushOffScreen(el) {
  el.style.position = 'absolute';
  el.style.top = `-${el.offsetHeight}px`;
  el.style.left = `-${el.offsetWidth}px`;
}

function findAncestorWithClass(el, cls) {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}
