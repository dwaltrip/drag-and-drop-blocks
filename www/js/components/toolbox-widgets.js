import m from 'mithril';

import { WidgetNames } from 'models/widget'
import { configForDragItem } from 'lib/m-utils/metal-dragon-helpers';

import widgetContent from 'components/widget-content';


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
    },

    view: function(controller, params) {
      var params = params || {};
      var classList = (className || '');

      return m('.widget-row',
        m('.widget' + classList, {
          config: controller.configDragItem
        }, widgetContent({ name: m.prop(widgetName) }, title))
      );
    }
  };
}
