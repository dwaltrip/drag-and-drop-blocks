import m from 'mithril';

import { merge } from 'lib/utils';
import { WidgetTypes } from 'models/widget'
import { WidgetSlot, WidgetList } from 'components/nested-widgets';

const viewDetailsByWidgetType = {
  [WidgetTypes.WIDGET1]: {
    title:      'Little Fella',
    className:  '.widget-1',
  },
  [WidgetTypes.WIDGET2]: {
    title:      'Single Slot',
    className:  '.widget-2'
  },
  [WidgetTypes.WIDGET3]: {
    title:      'Double Slot',
    className:  '.widget-3'
  },
  [WidgetTypes.WIDGET4]: {
    title:      'Widget List',
    className:  '.widget-4'
  },
  [WidgetTypes.WIDGET5]: {
    title:      'Two Lists',
    className:  '.widget-5'
  }
};

var viewFunctionLookup = {
  [WidgetTypes.WIDGET1]: (widget, opts) => null,

  [WidgetTypes.WIDGET2]: (widget, opts)=> {
    return m(WidgetSlot, merge(opts, { parentWidget: widget, inputName: 'foo' }));
  },

  [WidgetTypes.WIDGET3]: (widget, opts)=> {
    return m('.widget-slots', [
      m(WidgetSlot, merge(opts, { parentWidget: widget, inputName: 'firstWidget' })),
      m(WidgetSlot, merge(opts, { parentWidget: widget, inputName: 'secondWidget' }))
    ]);
  },

  [WidgetTypes.WIDGET4]: (widget, opts)=> {
    return m(WidgetList, merge(opts, { parentWidget: widget, listName: 'bazWidgets' }));
  },

  [WidgetTypes.WIDGET5]: (widget, opts)=> {
    return m('.widget-list-row', [
      m(WidgetList, merge(opts, { parentWidget: widget, listName: 'list1' })),
      m(WidgetList, merge(opts, { parentWidget: widget, listName: 'list2' }))
    ])
  }
};

function viewDetailsForWidgetType(widgetType) {
  if (!(widgetType in viewDetailsByWidgetType)) {
    throw new Error(`Invalid widget type: '${widgetType}'`);
  }
  return viewDetailsByWidgetType[widgetType];
};

export { viewFunctionLookup, viewDetailsForWidgetType };
