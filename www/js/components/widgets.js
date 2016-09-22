import m from 'mithril';


var Widget1 = {
  controller: function() {},
  view: function() {
    return widgetLayout('Widget 1', { classes: '.widget-1' });
  }
};

var Widget2 = {
  controller: function() {},
  view: function() {
    return widgetLayout('Widget 2', { classes: '.widget-2' });
  }
};

function widgetLayout(content, params) {
  var params = params || {};
  return m('.widget-row', m('.widget' + (params.classes || ''), [
    m('.widget-content', [
      content,
      m('.widget-slot')
    ])
  ]));
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
