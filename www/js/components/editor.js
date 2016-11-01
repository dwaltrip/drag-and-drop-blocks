import m from 'mithril';
import MetalDragon from 'metal-dragon';
import { mithrilifyMetalDragon } from 'lib/m-utils/metal-dragon-helpers';
import Mousetrap from 'mousetrap';

import Widget from 'models/widget'
import Workspace from 'models/workspace';

import handleWithRedraw from 'lib/m-utils/handle-with-redraw';
import { merge } from 'lib/utils';

import createOrMoveWidgets from 'components/create-or-move-widgets';
import { serializeWidget } from 'models/widget-serializer';
import ToolboxWidget from 'components/toolbox-widget';
import WorkspaceComponent from 'components/workspace';
import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';
import { UndoService } from 'services';

export default {
  controller: function() {
    var self = this;
    var workspace = this.workspace = Workspace.query()[0];;

    this.selectionDetails = m.prop({
      widgets: [],
      widgetUIDs: {},
      isMultiSelect: false
    });

    this.selectWidgets = (opts)=> {
      if (opts) {
        var isMultiSelect = opts.isMultiSelect || false;
        if (isMultiSelect) {
          var widgets = opts.widgets ?
            opts.widgets :
            opts.widget.getRestOfParentList();
        } else {
          var widgets = opts.widget ? [opts.widget] : [];
        }
        var widgetUIDs = {};
        widgets.forEach(widget => widgetUIDs[widget.uid()] = true);
        this.selectionDetails({ widgets, widgetUIDs, isMultiSelect });
      } else {
        this.selectionDetails({ widgets: [], widgetUIDs: {}, isMultiSelect: false });
      }
    };

    this.metalDragon = mithrilifyMetalDragon(MetalDragon.create({ eventHandlerDecorator }));

    this.createToolboxWidgetDragItem = (widgetType)=> this.metalDragon.createDragItem({
      group: TOOLBOX_WIDGETS,
      itemData: { widgetType },
      dragHandle: 'widget-title',
      // boundingContainer: 'widget-editor',
      // TODO: is there a better name than 'targetZone'?
      targetZone: { top: 0, left: 0, height: 10, width: 25 },
      onDragStart: ()=> this.selectWidgets(null),
      afterDrop: function() {
        self.selectWidgets({ widget: this.getDragData('newWidget') });
      }
    });

    this.createWorkspaceWidgetDragItem = (widget)=> this.metalDragon.createDragItem({
      group: WORKSPACE_WIDGETS,
      itemData: { widget },
      dragHandle: 'widget-title',
      targetZone: { top: 0, left: 0, height: 10, width: 25 },
      getDragImageSourceNode: function(element, event) {
        var selectedWidgets = document.createElement('div');
        var widgetRow = element.parentElement;

        // TODO: fix this need to manually add the class to the drag cursor nodes
        if (!isMultiSelectEvent(event)) {
          var clone = widgetRow.cloneNode(true);
          clone.classList.add('is-selected');
          selectedWidgets.appendChild(clone);
        }
        else {
          while (widgetRow) {
            var clone = widgetRow.cloneNode(true);
            clone.classList.add('is-selected');
            selectedWidgets.appendChild(clone);
            widgetRow = widgetRow.nextSibling;
          }
        }
        return selectedWidgets;
      },
      onDragInit: function(event) {
        self.selectWidgets({ widget, isMultiSelect: isMultiSelectEvent(event) });
        this.setDragData('widgets', self.selectionDetails().widgets);
      }
    });

    this.toolboxDropzone = this.metalDragon.createDropzone({
      accepts: WORKSPACE_WIDGETS,
      group: 'trashcan',
      // TODO: this doesnt allow us to trash toolbox widgets
      onDrop: (dragItem) => {
        var widgets = dragItem.getDragData('widgets')
        UndoService.recordDeleteAction({ widgets });
        widgets.forEach(dragWidget => {
          dragWidget.disconnect();
          dragWidget.delete();
        });
      }
    });

    this.copiedWidgets = null;
    this.copyWidgets = ()=> {
      this.copiedWidgets = this.selectionDetails().widgets.map(serializeWidget);
    };

    this.pasteWidgets = withRedraw(()=> {
      if (this.copiedWidgets) {
        var selectedWidgets = this.selectionDetails().widgets;
        var widgetToPasteAfter = selectedWidgets.length > 0 ?
          selectedWidgets.slice(-1).pop() :
          null;
        createOrMoveWidgets.fromClipboard({
          copiedWidgets: this.copiedWidgets,
          referenceWidget: widgetToPasteAfter,
          workspace
        });
      }
    });

    this.undo = withRedraw(()=> {
      var widgetSets = UndoService.undo();
      var changedWidgets = widgetSets ? widgetSets.slice(-1).pop() : null;
      if (changedWidgets) {
        this.selectWidgets({ widgets: changedWidgets, isMultiSelect: true });
      }
    });
    this.redo = withRedraw(()=> {
      var widgetSets = UndoService.redo();
      var changedWidgets = widgetSets ? widgetSets[0] : null;
      // This doesn't do exactly what one would want. But it's close enough. Foolish to keep working on it.
      if (changedWidgets) {
        this.selectWidgets({ widgets: changedWidgets, isMultiSelect: true });
      }
      return false;
    });

    Mousetrap.bind('command+c', this.copyWidgets);
    Mousetrap.bind('command+v', this.pasteWidgets);

    Mousetrap.bind('command+z', this.undo);
    Mousetrap.bind('command+y', this.redo);

    this.onunload = ()=> {
      this.toolboxDropzone.destroy();
      Mousetrap.unbind('command+c', this.copyWidgets);
      Mousetrap.unbind('command+v', this.pasteWidgets);

      Mousetrap.unbind('command+z', this.undo);
      Mousetrap.unbind('command+y', this.redo);
    };
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;
    var widgets = workspace.getWidgets();
    var md = controller.metalDragon;

    var selectedWidget = md.activeDragItem && md.activeDragItem.getItemData('widget', null);
    var isLastWorkspaceWidgetDraggingOverBottomOfWorkspace = (
      !!selectedWidget && selectedWidget === workspace.getWidgets().slice(-1).pop() &&
      md.isTargetingDropzoneGroup('bottom-of-workspace')
    );
    var doesTargetDropzoneDisplaceWidget = md.hasTargetDropzone() &&
      !isLastWorkspaceWidgetDraggingOverBottomOfWorkspace;

    var widgetEditorClassList = [
      md.isMidDrag() ? '.is-dragging' : '',
      doesTargetDropzoneDisplaceWidget ? '.will-target-dropzone-displace-widget' : ''
    ].join('')

    return m('.widget-editor.no-text-select' + widgetEditorClassList, [
      m('.toolbox', { config: controller.toolboxDropzone.attachToElement }, [
        m('.toolbox-header', 'Toolbox'),
        m('.toolbox-widgets', Widget.types.map(widgetType => {
          return m('.toolbox-section', m(ToolboxWidget, {
            widgetType,
            createDragItem: controller.createToolboxWidgetDragItem
          }))
        }))
      ]),

      m(WorkspaceComponent, {
        workspace,
        metalDragon: controller.metalDragon,
        createDragItem: controller.createWorkspaceWidgetDragItem,
        selectWidgets: controller.selectWidgets,
        selectionDetails: controller.selectionDetails
      })
    ]);
  }
};

// TODO: this still isn't ideal, as it requires that the user of metal-dragon
// knows how the library implementation makes use of the low level mouse events.
// Perhaps creating higher level names like 'dragmove', 'dragover', 'dragend', etc would solve this?
function eventHandlerDecorator(eventName, handler) {
  if (['mousedown', 'mouseup', 'mouseenter', 'mouseleave'].indexOf(eventName) > -1) {
    return handleWithRedraw(handler);
  } else if (eventName === 'mousemove') {
    return handleWithRedraw(handler, { throttleDelayAmount: 100 });
  } else {
    throw new Error('mouseEventHandlerDecorator -- invalid event:', eventName)
  }
}

window.globals = (window.globals || {});
window.globals.Widget = Widget;

function isMultiSelectEvent(event) {
  return !!event.shiftKey;
}

function withRedraw(fn) {
  return function() {
    m.startComputation();
    var retValue = fn.apply(this, arguments);
    m.endComputation();
    return retValue;
  }
}
