import m from 'mithril';

import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';
import { WidgetTypes } from 'models/widget'

import widgetContentBuilder from 'components/widget-content';


var widgetContent = widgetContentBuilder(lookupWidgetComponent);

var WidgetComponents = {
  [WidgetTypes.WIDGET1]: buildWidgetComponent('Widget 1', '.widget-1'),
  [WidgetTypes.WIDGET2]: buildWidgetComponent('Widget 2', '.widget-2'),
  [WidgetTypes.WIDGET3]: buildWidgetComponent('Widget 3', '.widget-3'),
  [WidgetTypes.WIDGET4]: buildWidgetComponent('Widget 4', '.widget-4')
};


function buildWidgetComponent(title, className) {
  return {
    controller: function(params) {
      var self = this;
      var params = params || {};
      this.widgetToMoveProp = params.widgetToMove;
      var widget = this.widget = params.widget;
      var workspace = params.workspace;

      this.dragItem = params.createDragItem(widget);

      if (widget.parentList()) {
        this.dropzone = params.metalDragon.createDropzone({
          group: MOVE_WIDGET,
          itemData: { widget },
          // TODO: this causes problems when the element is really large (lots of nested widgets)
          // really, only a small rectangle in the top left corner should count for dropping
          useDragElementOverlap: true,
          isEligible: function(dragItem) {
            if (dragItem.group === TOOLBOX_WIDGETS) { return true; }
            return widget !== dragItem.getItemData('widget');
          },
          onDrop: function(dragItem) {
            var dropzoneWidget = this.getItemData('widget');
            var targetList = dropzoneWidget.getParentList();
            if (dragItem.group === WORKSPACE_WIDGETS) {
              var dragWidget = dragItem.getItemData('widget');
              dragWidget.disconnect();
              targetList.insertAfter(dragWidget, dropzoneWidget);
            } else {
              var newWidget = targetList.createWidget(dragItem.getItemData('widgetType'))
              targetList.insertAfter(newWidget, dropzoneWidget);
            }
          }
        });
      }

      this.onunload = ()=> {
        this.dragItem.destroy();
        if (this.dropzone) {
          this.dropzone.destroy();
        }
      };
    },

    // TODO: can I refactor this view? there is lots of crazy logic in here...
    // Perhaps we can make more improvements to metalDragon API that will help.
    // Or just find a better way of organizing this component and its different states
    view: function(controller, params) {
      var params = params || {};
      var widget = controller.widget;
      var widgetToMoveProp = controller.widgetToMoveProp;

      var isDragging = controller.dragItem.isDragging();
      var isDraggingClass = isDragging ? '.is-dragging' : '';
      var widgetClassList = (className || '') + isDraggingClass;


      var prevWidget = widget.prevWidget();
      var nextWidget = widget.nextWidget();
      var isBeforeSelectedWidget = widgetToMoveProp() && nextWidget && nextWidget.uid() === widgetToMoveProp().uid();
      var isAfterSelectedWidget = widgetToMoveProp() && prevWidget && prevWidget.uid() === widgetToMoveProp().uid();

      var isSelectecWidget = widgetToMoveProp() && widget.uid() === widgetToMoveProp().uid();
      var isPotentialDropSlot = !(isSelectecWidget || isAfterSelectedWidget);

      var isDropTarget = controller.dropzone && controller.dropzone.isDropTarget();
      var widgetRowClassList = [
        // TODO: Something is wrong with 'isTargetingListEnd' in nested widget lists.
        isDropTarget || (widget.isLastWidget() && params.isTargetingListEnd) ? '.is-drop-target' : null,
        !(isDragging || isBeforeSelectedWidget || widget.isLastWidget() || isDropTarget) ? '.has-bottom-connector' : null
      ].filter(cls => !!cls).join('')

      return m('.widget-row' + widgetRowClassList, { key: widget.uid(), }, [
        m('.widget' + widgetClassList, { config: controller.dragItem.attachToElement },
          widgetContent(widget, title, {
            isInWorkspace: true,
            widgetToMove: params.widgetToMove,
            createDragItem: params.createDragItem,
            metalDragon: params.metalDragon,
            dropzone: controller.dropzone
          })
        )
      ])
    }
  };
}

function lookupWidgetComponent(name) {
  return WidgetComponents[name];
}


export { lookupWidgetComponent, WidgetComponents };
