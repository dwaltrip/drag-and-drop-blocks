import m from 'mithril';

import { configForDragItem, configForDropzone } from 'lib/m-utils/metal-dragon-helpers';
import { WidgetNames } from 'models/widget'

import widgetContent from 'components/widget-content';

var WidgetComponents = {
  [WidgetNames.WIDGET1]: buildWidgetComponent('Widget 1', '.widget-1'),
  [WidgetNames.WIDGET2]: buildWidgetComponent('Widget 2', '.widget-2'),
  [WidgetNames.WIDGET3]: buildWidgetComponent('Widget 3', '.widget-3'),
  [WidgetNames.WIDGET4]: buildWidgetComponent('Widget 4', '.widget-4')
};

function buildWidgetComponent(title, className) {
  return {
    controller: function(params) {
      var self = this;
      var params = params || {};
      this.widgetToMoveProp = params.widgetToMove;
      var widget = this.widget = params.widget;

      this.dragItem = params.createDragItem({
        onDragStart: ()=> {
          this.dragItem.setDragData('widget', widget);
          this.widgetToMoveProp(widget);
          this.dropzone.disable();
          if (widget.nextWidget) {
            widget.nextWidget.dropzone.disable();
          }
        },
        // onDrop: ()=> {
        //   if (!this.dragItem.isAboveGroup('trashcan')) {
        //     this.widgetToMoveProp(null);
        //   }
        // }
      });

      // TODO: adding a reference to the dropzone on the widget model is BAD!!
      // I think my data model & component organization needs to be improved.
      // Things are getting a little messy
      widget.dropzone = this.dropzone = params.metalDragon.createDropzone({
        group: 'widget-row',
        accepts: ['toolbox-widgets', 'workspace-widgets'],
        onDrop: (dragItem)=> {
          if (dragItem.group === 'workspace-widgets') {
            params.moveSelectedWidgetInFrontOf(widget);
          }
        }
      });

      this.configDragItem = configForDragItem(this.dragItem);
      this.configDropzone = configForDropzone(this.dropzone);

      this.onunload = ()=> {
        this.dragItem.destroy();
        this.dropzone.destroy();
      };
    },

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
        config: isPotentialDropSlot ? controller.configDropzone : null,
      }, [
        isPotentialDropSlot ? m('.reposition-slot.before-this') : null,
        m('.widget' + widgetClassList, {
          config: controller.configDragItem
        }, widgetContent(widget, title, true))
      ])
    }
  };
}

function lookupWidgetComponent(name) {
  return WidgetComponents[name];
}


export { lookupWidgetComponent, WidgetComponents };
