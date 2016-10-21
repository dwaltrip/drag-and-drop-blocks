import m from 'mithril';

import { merge } from 'lib/utils';
import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';
import { WidgetTypes } from 'models/widget';

//--------------------------------------------------------
// Todos
//--------------------------------------------------------
//  [X]  Make widgetSlot a component
//  [X] Add dropzone for widgetSlot
//  [X] Implement "bump out" functionality for widget slots
//  [ ] Make component for nested widget list
//  [ ] Add dropzone for empty nested widget list
//  ------------------------------------------------------
//  [X] Add 'target zone' option on dragItem
//  [ ] Refactor widgets component. We don't need the "component lookup" stuff
//  [ ] Refactor home component (split into 2: widget-editor & workspace)
//  [ ] Refactor widget-slots and widget-list components
//  ------------------------------------------------------
//  [ ] Implement multi-select (shift click on a widget?)
//  [ ] Implement undo (cmd+Z, cmd+Y)
//  [ ] Implement copy/cut & paste (cmd+C, cmd+V)
//  ------------------------------------------------------
//  [ ] Evaluate project architecture, components, data models, etc
//  [ ] Refefactor models/widget-helpers, models/widget
//  ------------------------------------------------------
//  [ ] Try adding a few more widget types
//  [ ] Any extra cleanup
//--------------------------------------------------------

export default function(lookupWidgetComponent) {

  var WidgetSlot = {
    // TODO: we can't set the slotWidget as a controller property
    // because if the slotWidget is moved somewhere else,
    // we don't have a good way of clearing it out in the old controller
    // Thus, in the UI, it will be present in both the old slot and in its new position.
    controller: function(params) {
      var self = this;
      this.parentWidget = params.parentWidget;
      this.inputName = params.inputName;

      if (params.isInWorkspace) {
        this.dropzone = params.metalDragon.createDropzone({
          group: 'widget-slot',
          itemData: { parentWidget: this.parentWidget },
          // TODO: rename 'isEligible' to 'canDrop'
          isEligible: function(dragItem) {
            if (dragItem.group === TOOLBOX_WIDGETS) { return true; }
            var dragWidget = dragItem.getItemData('widget')
            var slotWidget = self.parentWidget.getInput(self.inputName);
            return dragWidget !== slotWidget &&
              dragWidget !== self.parentWidget &&
              !dragWidget.isAncestorOf(self.parentWidget);
          },
          onDrop: function(dragItem) {
            if (dragItem.group === TOOLBOX_WIDGETS) {
              self.parentWidget.createInput(self.inputName, dragItem.getItemData('widgetType'));
            } else {
              var dragWidget = dragItem.getItemData('widget');
              dragWidget.disconnect();
              self.parentWidget.setInput(self.inputName, dragWidget);
            }
          }
        });
        this.onunload = ()=> this.dropzone.destroy();
      }

      this.cssClasses = ()=> {
        return [
          this.dropzone && this.dropzone.isDropTarget() ? '.is-drop-target' : '',
        ].join('');
      };
    },
    view: function(controller, params) {
      // var widget = controller.widget;
      // var slotContent = params.isInWorkspace && widget ?
      //   m(lookupWidgetComponent(widget.type()), {
      //     key: widget.uid(),
      //     widget,
      //     widgetToMove: params.widgetToMove,
      //     createDragItem: params.createDragItem,
      //     metalDragon: params.metalDragon
      //   }) : null;
      // return m('.widget-slot', slotContent);

      var widget = controller.parentWidget.getInput &&
        controller.parentWidget.getInput(controller.inputName);
      return m('.widget-slot' + controller.cssClasses(), {
        key: `widget-slot-${params.inputName}`,
        config: controller.dropzone ? controller.dropzone.attachToElement : null
      }, nestedWidget(widget, params));
    }
  };

  var ViewFunctionLookup = {
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
