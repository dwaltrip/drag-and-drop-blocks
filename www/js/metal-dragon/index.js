
import DragItem from './drag-item';
import Dropzone from './dropzone';

import { ACCEPT_ALL, DEFAULT_GROUP, DRAG_HANDLE_CSS_CLASS } from './constants';
import { addStylesheetRules, removeFromArray } from './utils';

const DRAG_STATE_PRE_DRAG = 'PRE_DRAG';
const DRAG_STATE_MID_DRAG = 'MID_DRAG';
const DRAG_STATE_NONE = 'NONE';

export default {
  create: function(opts) {
    var instance = Object.create(this.instance);

    instance.dragItemGroups = {};
    instance.dropzonesByAcceptType = { [ACCEPT_ALL]: [] };

    if (opts.eventHandlerDecorator) {
      instance.eventHandlerDecorator = opts.eventHandlerDecorator;
    }

    addStylesheetRules([`.${DRAG_HANDLE_CSS_CLASS}:hover { cursor: move; }`]);

    return instance;
  },

  instance: {
    dragItemGroups: null,
    dropzonesByAcceptType: null,
    eventHandlerDecorator: null,

    activeDragItem: null,
    targetDropzones: null,

    _eligibleDropzones: null,
    _ineligibleDropzones: null,
    _dragState: DRAG_STATE_NONE,

    dropzoneCount: 0,
    dragItemCount: 0,

    isPreDrag: function() { return this._dragState === DRAG_STATE_PRE_DRAG; },
    isMidDrag: function() { return this._dragState === DRAG_STATE_MID_DRAG; },

    isDragging: function() { return this.isPreDrag() || this.isMidDrag(); },
    isNotDragging: function() { return this._dragState === DRAG_STATE_NONE; },

    createDragItem: function(opts) {
      var newDragItem = DragItem.create(this, opts);
      this.dragItemCount += 1;
      newDragItem.id = this.dragItemCount;

      var group = newDragItem.group;
      if (!(group in this.dragItemGroups)) {
        this.dragItemGroups[group] = [];
      }
      this.dragItemGroups[group].push(newDragItem);

      return newDragItem;
    },

    createDropzone: function(opts) {
      var newDropzone = Dropzone.create(this, opts);
      this.dropzoneCount += 1;
      newDropzone.id = this.dropzoneCount;

      if (newDropzone.doesAcceptAll()) {
        this.dropzonesByAcceptType[ACCEPT_ALL].push(newDropzone);
      } else {
        newDropzone.accepts.forEach(group => {
          if (!(group in this.dropzonesByAcceptType)) {
            this.dropzonesByAcceptType[group] = [];
          }
          this.dropzonesByAcceptType[group].push(newDropzone);
        });
      }

      return newDropzone;
    },

    hasTargetDropzone: function() {
      return this.targetDropzones && this.targetDropzones.length > 0;
    },

    isTargetingDropzoneGroup: function(group) {
      if (!this.isMidDrag()) { return false; }

      var targetDropzone = this.targetDropzone();
      return !!targetDropzone && targetDropzone.group === group;
    },

    removeDragItem: function(dragItem) {
      removeFromArray(this.dragItemGroups[dragItem.group], dragItem);
    },

    removeDropzone: function(dropzone) {
      if (dropzone.doesAcceptAll()) {
        removeFromArray(this.dropzonesByAcceptType[ACCEPT_ALL], dropzone);
      } else {
        dropzone.accepts.forEach(group => {
          removeFromArray(this.dropzonesByAcceptType[group], dropzone);
        });
      }
    },

    onDrop: function() {
      var targetDropzone = this.targetDropzone();
      if (targetDropzone) {
        targetDropzone.userEvents.onDrop.call(targetDropzone, this.activeDragItem);
      }
    },

    onMouseMove: function(event) {
      this.handleCustomEventConstraints();
    },

    isManuallyHandlingDragEvents: function() {
      return this.isCheckingElementOverlap || this.activeDragItem.hasCustomDragRect;
    },

    // TODO: clarify this method. We are doing a few things all at once here.
    handleCustomEventConstraints: function() {
      var hasCustomDragRect = this.activeDragItem.hasCustomDragRect;
      var dragRect = this.activeDragItem.getDragRect();

      if (this.isCheckingElementOverlap || hasCustomDragRect) {
        this._eligibleDropzones.forEach(dropzone => {
          if (
            (dropzone.useDragElementOverlap || hasCustomDragRect) &&
            !dropzone.isUnderDragItem() &&
            doRectsOverlap(dragRect, dropzone._element.getBoundingClientRect())
          ) {
            dropzone.handleDragEnter();
          }
        });
        this.targetDropzones.forEach(dropzone => {
          if (
            (dropzone.useDragElementOverlap || hasCustomDragRect) &&
            !doRectsOverlap(dragRect, dropzone._element.getBoundingClientRect())
          ) {
            dropzone.handleDragLeave();
          }
        });
      }
    },

    // `targetDropzones` is essentially a stack of dropzones we have enetered.
    // Only the most recently entered one is used.
    // The assumption that this is the sensible and always desired has not been fully validated.
    targetDropzone: function() {
      return (this.targetDropzones || []).slice(-1).pop() || null;
    },

    onDragEnter: function(dropzone) {
      if (this.targetDropzone()) {
        this.activeDragItem.dragCursor.classList.remove(getDropTargetClass(this.targetDropzone()));
      }
      this.targetDropzones.push(dropzone);
      var dragOverClass = getDropTargetClass(dropzone);
      this.activeDragItem.dragCursor.classList.add(dragOverClass);
    },

    onDragLeave: function(dropzone) {
      var wasRemoved = removeFromArray(this.targetDropzones, dropzone);
      if (!wasRemoved) {
        throw new Error('onmouseleave -- this should not happen. dropzone not in targetDropzones list');
      }
      this.activeDragItem.dragCursor.classList.remove(getDropTargetClass(dropzone));
      if (this.targetDropzone()) {
        this.activeDragItem.dragCursor.classList.add(getDropTargetClass(this.targetDropzone()));
      }
    },

    _prepForDrag: function() {
      this._dragState = DRAG_STATE_PRE_DRAG;
    },

    _startDrag: function(dragItem, event) {
      this._dragState = DRAG_STATE_MID_DRAG;
      this.activeDragItem = dragItem;
      this.targetDropzones = [];

      this._eligibleDropzones = [];
      this._ineligibleDropzones = [];
      // prep dropzones
      var dropzones = this.dropzonesByAcceptType[ACCEPT_ALL].concat(
        this.dropzonesByAcceptType[dragItem.group] || []
      );

      dropzones.forEach(dropzone => {
        if (dropzone.canDrop(dragItem)) {
          dropzone._prepForDragAndDrop(event);
          this._eligibleDropzones.push(dropzone);
        } else {
          dropzone.disable();
          this._ineligibleDropzones.push(dropzone);
        }
      });

      this.isCheckingElementOverlap = !!this._eligibleDropzones.find(dz => dz.useDragElementOverlap);

      // Upon drag start, identify dropzones that should be considered 'targeted' by dragItem
      // and trigger 'dragEnter' for these dropzones.
      var mousePos = { x: event.clientX, y: event.clientY };
      var dragRect = dragItem.dragCursor.getBoundingClientRect();
      this._eligibleDropzones.forEach(dropzone => {
        var dropzoneRect = dropzone._element.getBoundingClientRect()
        var isCheckingOverlap = dropzone.useDragElementOverlap;

        var doesOverlap = doRectsOverlap(dropzoneRect, dragRect);
        var containsCursor = doesRectContainPoint(dropzoneRect, mousePos);

        if ((isCheckingOverlap && doesOverlap) || (!isCheckingOverlap && containsCursor)) {
          dropzone.handleDragEnter();
        }
      });
    },

    _postDragCleanup: function() {
      this._dragState = DRAG_STATE_NONE;
      this._eligibleDropzones.forEach(dropzone => dropzone._postDragCleanup());
      this._eligibleDropzones = [];
      this.isCheckingElementOverlap = false;
      
      this.activeDragItem = null;
      this.targetDropzones = [];

      this._ineligibleDropzones.forEach(dropzone => dropzone.enable());
      this._ineligibleDropzones = [];
    },
  }
};

function getDropTargetClass(dropzone) {
  return `drop-target--${dropzone.group}`;
}

function doRectsOverlap(rect1, rect2) {
  return !(
    rect1.right   < rect2.left  ||
    rect1.left    > rect2.right ||
    rect1.bottom  < rect2.top   ||
    rect1.top     > rect2.bottom
  );
}

function doesRectContainPoint(rect, point) {
  return (rect.left <= point.x &&   point.x <= rect.right &&
          rect.top  <= point.y &&   point.y <= rect.bottom);
}
