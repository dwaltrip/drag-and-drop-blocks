import m from 'mithril';

import { WidgetTypes } from 'models/widget';

export default function(lookupWidgetComponent) {

  var nestedContentViewFunctionLookup = {
    [WidgetTypes.WIDGET1]: (widget, opts) => null,

    [WidgetTypes.WIDGET2]: (widget, opts)=> {
      var fooWidget = opts.isInWorkspace ? widget.getFooWidget() : null;
      return widgetSlot(nestedWidget(fooWidget, opts));
    },

    [WidgetTypes.WIDGET3]: (widget, opts)=> {
      return m('.widget-slots', [
        widgetSlot(),
        widgetSlot()
      ]);
    },

    [WidgetTypes.WIDGET4]: (widget, opts)=> {
      var fooWidgetList = opts.isInWorkspace ? widget.getFooWidgetList() : null;
      return m('.inner-widget-section', fooWidgetList ?
        fooWidgetList.map(listWidget => nestedWidget(listWidget, opts)) :
        null
      );
    }
  };

  return function(widget, title, opts) {
    var opts = opts || {};
    var debuggingTitle = opts.isInWorkspace ?
      `${title} -- ${widget.uid()} -- ${widget.pos()}` : title;

    return [
      // m('.widget-title', debuggingTitle),
      m('.widget-title', title),
      nestedContent(widget, opts)
    ];
  };

  function nestedContent(widget, opts) {
    return nestedContentViewFunctionLookup[widget.type()](widget, opts);
  }

  function nestedWidget(widget, opts) {
    if (opts.isInWorkspace) {
      //var childWidget = !!childWidget && childWidget.widget;
      return !!widget ? m(lookupWidgetComponent(widget.type()), {
        widget,
        widgetToMove: opts.widgetToMove,
        createDragItem: opts.createDragItem,
        createDropzone: opts.createDropzone
      }) : null;
    }
  }

  function widgetSlot(slotContent) {
    return m('.widget-slot', slotContent);
  }
};
