import m from 'mithril';

import { WidgetTypes } from 'models/widget'
import { viewDetailsForWidgetType } from 'components/widget-type-details';
import { widgetLayout, widgetSlotLayout, widgetListLayout } from 'components/widget-layout';

var viewFunctionLookup = {
  [WidgetTypes.WIDGET1]: () => null,
  [WidgetTypes.WIDGET2]: ()=> widgetSlotLayout(null),
  [WidgetTypes.WIDGET3]: ()=> m('.widget-slots', [
    widgetSlotLayout(null),
    widgetSlotLayout(null)
  ]),
  [WidgetTypes.WIDGET4]: ()=> widgetListLayout(null),
  [WidgetTypes.WIDGET5]: ()=> m('.widget-list-row', [
    widgetListLayout(null),
    widgetListLayout(null)
  ]),
  [WidgetTypes.WIDGET6]: ()=> m('.widget-list-row', [
    widgetListLayout(null),
    m('.widget-slots.vert', [widgetSlotLayout(null), widgetSlotLayout(null)])
  ])
};

export default {
  controller: function(params) {
    var params = params || {};
    var widgetType = this.widgetType = params.widgetType
    this.dragItem = params.createDragItem(widgetType);
    this.widget = { type: m.prop(widgetType) };

    this.onunload = ()=> this.dragItem.destroy();
  },

  view: function(controller) {
    var widget = controller.widget;
    var viewDetails = viewDetailsForWidgetType(widget.type());

    var viewFn = viewFunctionLookup[controller.widgetType];
    return widgetLayout([
      m('.widget-title', viewDetails.title),
      viewFn()
    ], {
      widgetClasses: viewDetails.className,
      dragItemConfig: controller.dragItem.attachToElement
    });
  }
};
