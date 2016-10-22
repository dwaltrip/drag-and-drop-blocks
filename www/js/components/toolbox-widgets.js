import m from 'mithril';

import { WidgetTypes } from 'models/widget'

import widgetContentBuilder from 'components/widget-content';

var widgetContent = widgetContentBuilder();

export default [
  buildWidgetComponent('Little Fella', '.widget-1', WidgetTypes.WIDGET1),
  buildWidgetComponent('Singe Slot', '.widget-2', WidgetTypes.WIDGET2),
  buildWidgetComponent('Double Slot', '.widget-3', WidgetTypes.WIDGET3),
  buildWidgetComponent('List', '.widget-4', WidgetTypes.WIDGET4),
  buildWidgetComponent('Two Lists', '.widget-5', WidgetTypes.WIDGET5)
];

function buildWidgetComponent(title, className, widgetType) {
  return {
    controller: function(params) {
      var self = this;
      var params = params || {};
      this.dragItem = params.createDragItem(widgetType);
      this.widget = { type: m.prop(widgetType) };
    },

    view: function(controller, params) {
      var params = params || {};
      var classList = (className || '');

      return m('.widget-row',
        m('.widget' + classList, {
          config: controller.dragItem.attachToElement
        }, widgetContent(controller.widget, title))
      );
    }
  };
}
