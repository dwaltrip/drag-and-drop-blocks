import m from 'mithril';

import { WidgetNames } from 'models/widget'

import widgetContentBuilder from 'components/widget-content';

var widgetContent = widgetContentBuilder();

export default [
  buildWidgetComponent('Widget 1', '.widget-1', WidgetNames.WIDGET1),
  buildWidgetComponent('Widget 2', '.widget-2', WidgetNames.WIDGET2),
  buildWidgetComponent('Widget 3', '.widget-3', WidgetNames.WIDGET3),
  buildWidgetComponent('Widget 4', '.widget-4', WidgetNames.WIDGET4)
];

function buildWidgetComponent(title, className, widgetName) {
  return {
    controller: function(params) {
      var self = this;
      var params = params || {};
      this.dragItem = params.createDragItem(widgetName);
    },

    view: function(controller, params) {
      var params = params || {};
      var classList = (className || '');

      return m('.widget-row',
        m('.widget' + classList, {
          config: controller.dragItem.attachToElement
        }, widgetContent({ type: m.prop(widgetName), getInput: ()=> null }, title))
      );
    }
  };
}
