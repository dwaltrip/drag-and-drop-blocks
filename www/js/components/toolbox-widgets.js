import m from 'mithril';

import { WidgetNames } from 'models/widget'


export default [
  buildWidgetComponent('Widget 1', '.widget-1', WidgetNames.WIDGET1),
  buildWidgetComponent('Widget 2', '.widget-2', WidgetNames.WIDGET2),
  buildWidgetComponent('Widget 3', '.widget-3', WidgetNames.WIDGET3)
];

function buildWidgetComponent(title, className, widgetName) {
  return {
    controller: function(params) {
      var self = this;
      var params = params || {};

      var widget = this.widget = params.widget || {
        uid: m.prop(null),
        pos: m.prop(null),
        name: m.prop('blank')
      };
    },

    view: function(controller, params) {
      var params = params || {};
      var widget = controller.widget;
      var classList = (className || '');

      return m('.widget-row', { key: widget.uid() }, m('.widget' + classList, [
        m('.widget-title', `${title} -- ${widget.uid()} -- ${widget.pos()}`),
        m('.widget-slot')
      ]));
    }
  };
}
