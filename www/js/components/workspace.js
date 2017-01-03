import dnd from 'drag-n-drop';
import m from 'mithril';

import createOrMoveWidgets from 'components/create-or-move-widgets';
import WidgetComponent from 'components/widget';

import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';

export default {
  controller: function(params) {
    this.workspace = params.workspace;

    this.bottomOfWorkspaceDropzone = dnd.createDropzone({
      accepts: [WORKSPACE_WIDGETS, TOOLBOX_WIDGETS],
      group: 'bottom-of-workspace',
      canAcceptDrop: (dragItem)=> {
        if (dragItem.group === TOOLBOX_WIDGETS) { return true; }
        var dragWidget = dragItem.getItemData('widget');
        if (dragWidget.isRoot()) {
          return !(params.selectionDetails().isMultiSelect || dragWidget.isLastWidget());
        }
        return true;
      },
      onDrop: (dragItem)=> createOrMoveWidgets.toEndOfList({
        dragItem,
        list: this.workspace.widgetList()
      })
    });

    this.onunload = ()=> {
      this.bottomOfWorkspaceDropzone.destroy();
    };
  },

  view: function(controller, params) {
    return m('.workspace', [
      m('.widget-list', controller.workspace.widgets().map(widget => {
        return m(WidgetComponent, {
          key: widget.uid(),
          widget,
          selectionDetails: params.selectionDetails,
          createDragItem: params.createDragItem
        });
      })),

      m('.workspace-margin', {
        config: controller.bottomOfWorkspaceDropzone.attachToElement
      })
    ])
  }
};
