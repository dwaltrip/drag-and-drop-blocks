import m from 'mithril';


var Widget1 = {
  controller: function() {
  },
  view: function() {
    return m('.widget.widget-1', [
      m('.widget-content', 'Widget 1')
    ]);
  }
};

var Widget2 = {
  controller: function() {
  },
  view: function() {
    return m('.widget.widget-2', [
      m('.widget-content', 'Widget 2')
    ]);
  }
};


var Widgets = [
  { name: 'widget1', component: Widget1 },
  { name: 'widget2', component: Widget2 }
];

var lookupWidget = (function() {
  var widgetHash = Widgets.reduce((memo, widget) => {
    memo[widget.name] = widget;
    return memo;
  }, {});

  return function(name) {
    return widgetHash[name].component;
  };
})();


export { Widget1, Widget2, Widgets, lookupWidget };
