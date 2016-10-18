import m from 'mithril';

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
      this.dropzone = params.createDropzone(widget);

      this.onunload = ()=> {
        this.dragItem.destroy();
        this.dropzone.destroy();
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


      var prevWidget = widget.prevWidget;
      var nextWidget = widget.nextWidget;
      var isBeforeSelectedWidget = widgetToMoveProp() && nextWidget && nextWidget.uid() === widgetToMoveProp().uid();
      var isAfterSelectedWidget = widgetToMoveProp() && prevWidget && prevWidget.uid() === widgetToMoveProp().uid();

      var isSelectecWidget = widgetToMoveProp() && widget.uid() === widgetToMoveProp().uid();
      var isPotentialDropSlot = !(isSelectecWidget || isAfterSelectedWidget);

      var widgetRowClassList = [
        controller.dropzone.isUnderDragItem() ? '.is-under-drag-item' : null,
        !(isDragging || isBeforeSelectedWidget || widget.isLastWidget) ? '.has-bottom-connector' : null
      ].filter(cls => !!cls).join('')

      return m('.widget-row' + widgetRowClassList, {
        key: widget.uid(),
        // TODO: do we need this check, now that we have the `isEligible` parameter for dropzones?
        // config: isPotentialDropSlot ? controller.dropzone.attachToElement : null,
      }, [
        m('.widget' + widgetClassList, { config: controller.dragItem.attachToElement },
          widgetContent(widget, title, {
            isInWorkspace: true,
            widgetToMove: params.widgetToMove,
            createDragItem: params.createDragItem,
            createDropzone: params.createDropzone,
            dropzone: controller.dropzone
          })
        ),
        // m('.widget-attach-area', {
        //   config: isPotentialDropSlot ? controller.dropzone.attachToElement : null
        // }, m('.widget-attach-point'))
      ])
    }
  };
}

function lookupWidgetComponent(name) {
  return WidgetComponents[name];
}


export { lookupWidgetComponent, WidgetComponents };
