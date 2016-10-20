import m from 'mithril';

import { WidgetTypes } from 'models/widget';

// -------------------------------------------------------
// TODO:
//   * Make widgetSlot a component
//   * Add dropzone for widgetSlot
//   * Make component for nested widget list
//   * Add dropzone for empty nested widget list
//   -----------------------------------------------------
//   * Shift click to multi-select all subsequent widgets
//   * Add 'target zone' option on dragItem
//   * Refactor home component (split into 2: widget-editor & workspace)
//   * Refactor widgets component. We don't need the "component lookup" stuff
//   * Evaluate project architecture, components, data models, etc
//   * Clean up code
// -------------------------------------------------------


var WidgetSlot = {
  controller: function(params) {
    this.widget = params.widget;
    this.dropzone = params.metalDragon.createDropzone({
      group: 'widget-slot',
    });
  },
  view: function() {
    return m('.foo', 'FooA');
  }
};


export default function(lookupWidgetComponent) {

  var ViewFunctionLookup = {
    [WidgetTypes.WIDGET1]: (widget, opts) => null,

    [WidgetTypes.WIDGET2]: (widget, opts)=> {
      var fooWidget = opts.isInWorkspace ? widget.inputs.foo : null;
      return widgetSlot(nestedWidget(fooWidget, opts));
    },

    [WidgetTypes.WIDGET3]: (widget, opts)=> {
      var first = opts.isInWorkspace ? widget.inputs.firstWidget : null;
      var second = opts.isInWorkspace ? widget.inputs.secondWidget : null;
      return m('.widget-slots', [
        widgetSlot(nestedWidget(first, opts)),
        widgetSlot(nestedWidget(second, opts))
      ]);
    },

    [WidgetTypes.WIDGET4]: (widget, opts)=> {
      var bazList = opts.isInWorkspace ? widget.inputs.bazWidgets : null;
      return m('.nested-widget-list', bazList ?
        bazList.widgets.map(listWidget => nestedWidget(listWidget, opts)) :
        null
      );
    }
  };


  return function widgetContent(widget, title, opts) {
    var opts = opts || {};
    var debuggingTitle = opts.isInWorkspace ?
      `${title} -- ${widget.uid()} -- ${widget.pos()}` : title;

    var viewFn = ViewFunctionLookup[widget.type()];
    return [
      m('.widget-content', [
        m('.widget-title', title),
        // m('.widget-title', debuggingTitle),
        viewFn(widget, opts),
      ]),
      opts.dropzone ? m('.widget-attach-area', {
        config: opts.dropzone.attachToElement
        }, m('.widget-attach-point')
      ) : null
    ];
  };


  function nestedWidget(widget, opts) {
    if (opts.isInWorkspace) {
      return widget ? m(lookupWidgetComponent(widget.type()), {
        key: widget.uid(),
        widget,
        widgetToMove: opts.widgetToMove,
        createDragItem: opts.createDragItem,
        metalDragon: opts.metalDragon
      }) : null;
    }
  }

  function widgetSlot(slotContent) {
    return m('.widget-slot', slotContent);
  }
};
