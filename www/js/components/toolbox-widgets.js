import m from 'mithril';

import { WidgetTypes } from 'models/widget'

import widgetContentBuilder from 'components/widget-content';

var widgetContent = widgetContentBuilder();

export default [
  buildWidgetComponent('Widget 1', '.widget-1', WidgetTypes.WIDGET1),
  buildWidgetComponent('Widget 2', '.widget-2', WidgetTypes.WIDGET2),
  buildWidgetComponent('Widget 3', '.widget-3', WidgetTypes.WIDGET3),
  buildWidgetComponent('Widget 4', '.widget-4', WidgetTypes.WIDGET4)
];

function buildWidgetComponent(title, className, widgetType) {
  return {
    controller: function(params) {
      var self = this;
      var params = params || {};
      this.dragItem = params.createDragItem(widgetType);
    },

    view: function(controller, params) {
      var params = params || {};
      var classList = (className || '');

      return m('.widget-row',
        m('.widget' + classList, {
          config: controller.dragItem.attachToElement
        }, widgetContent({ type: m.prop(widgetType), getInput: ()=> null }, title))
      );
    }
  };
}
