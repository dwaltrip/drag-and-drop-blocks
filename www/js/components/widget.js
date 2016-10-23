import m from 'mithril';

import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';
import { WidgetTypes } from 'models/widget'

import { viewDetailsForWidgetType, viewFunctionLookup } from 'components/widget-type-details';
import { widgetLayout } from 'components/widget-layout';

export default {
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

    var viewDetails = viewDetailsForWidgetType(widget.type());

    var isDragging = controller.dragItem.isDragging();
    var isDraggingClass = isDragging ? '.is-dragging' : '';
    var widgetClasses = (viewDetails.className || '') + isDraggingClass;

    var prevWidget = widget.prevWidget();
    var nextWidget = widget.nextWidget();
    var isBeforeSelectedWidget = widgetToMoveProp() && nextWidget && nextWidget.uid() === widgetToMoveProp().uid();

    var isDropTarget = controller.dropzone && controller.dropzone.isDropTarget();
    var widgetRowClasses = [
      isDropTarget || (widget.isLastWidget() && params.isTargetingListEnd) ? '.is-drop-target' : null,
      !(isDragging || isBeforeSelectedWidget || widget.isLastWidget() || isDropTarget) ? '.has-bottom-connector' : null
    ].filter(cls => !!cls).join('')

    var viewFn = viewFunctionLookup[widget.type()];
    var content = [
      // m('.widget-title', `${params.title} -- ${widget.uid()} -- ${widget.pos()}`),
      m('.widget-title', viewDetails.title),
      viewFn(widget, {
        widgetToMove: params.widgetToMove,
        metalDragon: params.metalDragon,
        createDragItem: params.createDragItem
      })
    ];

    return widgetLayout(content, {
      key: widget.uid(),
      widgetRowClasses,
      widgetClasses,
      dragItemConfig: controller.dragItem.attachToElement,
      dropzoneConfig: controller.dropzone ? controller.dropzone.attachToElement : null
    });

    // return m('.widget-row' + widgetRowClassList, { key: widget.uid(), }, [
    //   m('.widget' + widgetClassList, {
    //     config: controller.dragItem.attachToElement
    //   }, [
    //     m('.widget-content', ),
    //     controller.dropzone ? m('.widget-attach-area', {
    //       config: controller.dropzone.attachToElement
    //       }, m('.widget-attach-point')
    //     ) : null
    //   ])
    //   //   widgetContent(widget, viewDetails.title, {
    //   //     isInWorkspace: true,
    //   //     widgetToMove: params.widgetToMove,
    //   //     createDragItem: params.createDragItem,
    //   //     metalDragon: params.metalDragon,
    //   //     dropzone: controller.dropzone
    //   //   })
    //   // )
    // ]);
  }
};
