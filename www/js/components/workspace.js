import m from 'mithril';

import unicode from 'lib/unicode-characters';
import WidgetComponent from 'components/widget';

import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';

export default {
  controller: function(params) {
    this.workspace = params.workspace;
    this.trashcanDropzone = params.createTrashcanDropzone();

    // TODO: implement the `onDrop` fanciness to make this code work
    // this.bottomOfWorkspaceDropzone = params.metalDragon.createDropzone({
    //   onDrop: {
    //     [WORKSPACE_WIDGETS]:  dragItem => workspace.append(dragItem.getData('widget')),
    //     [TOOLBOX_WIDGETS]:    dragItem => workspace.appendNew(dragItem.getData('widgetType'))
    //   }
    // });

    this.bottomOfWorkspaceDropzone = params.metalDragon.createDropzone({
      accepts: [WORKSPACE_WIDGETS, TOOLBOX_WIDGETS],
      group: 'bottom-of-workspace',
      onDrop: (dragItem)=> {
        if (dragItem.group === WORKSPACE_WIDGETS) {
          var widget = dragItem.getItemData('widget');
          widget.disconnect();
          workspace.appendWidget(widget);
        } else {
          var newWidget = workspace.createWidget(dragItem.getItemData('widgetType'))
          workspace.appendWidget(newWidget);
        }
      }
    });

    this.onunload = ()=> {
      this.trashcanDropzone.destroy();
    };
  },

  view: function(controller, params) {
    var widgets = controller.workspace.getWidgets();
    var isTrashcanDropTarget = controller.trashcanDropzone.isDropTarget();

    return m('.workspace', [
      m('.widget-list', widgets.map(widget => {
        return m(WidgetComponent, {
          key: widget.uid(),
          widget,
          createDragItem: params.createDragItem,
          metalDragon:    params.metalDragon
        });
      })),

      m('.workspace-margin', { config: controller.bottomOfWorkspaceDropzone.attachToElement }),

      m('.trashcan' + (isTrashcanDropTarget ? '.is-drop-target' : ''), {
        config: controller.trashcanDropzone.attachToElement
      }, [
        m('.arrow', m.trust(unicode.rightArrowWhite)),
        m('.text', m.trust(`${unicode.wasteBasket} Remove`)),
        m('.arrow', m.trust(unicode.leftArrowWhite))
      ])
    ])
  }
};
