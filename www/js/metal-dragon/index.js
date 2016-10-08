
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
    activeDropzones: null,

    _potentialDropzones: null,
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

    isDraggingOverGroup: function(group) {
      if (!this.isMidDrag()) { return false; }

      var targetDropzone = this.targetDropzone();
      return targetDropzone && targetDropzone.group === group;
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
      if (targetDropzone && targetDropzone.userEvents.onDrop) {
        targetDropzone.userEvents.onDrop(this.activeDragItem);
      }
    },

    // `activeDropzones` is essentially a stack of dropzones we have enetered.
    // Only the most recently entered one is used.
    // The assumption that this is the sensible and always desired has not been fully validated.
    targetDropzone: function() {
      if (this.activeDropzones.length > 0) {
        return this.activeDropzones[this.activeDropzones.length - 1];
      }
      return null;
    },

    onDragEnter: function(dropzone) {
      this.activeDropzones.push(dropzone);
      var dragOverClass = getDragOverClass(dropzone);
      this.activeDragItem.dragImage.classList.add(dragOverClass);
    },

    onDragLeave: function(dropzone) {
      var wasRemoved = removeFromArray(this.activeDropzones, dropzone);
      if (!wasRemoved) {
        throw new Error('onmouseleave -- wtf, dropzone not in activeDropzones list');
      }
      this.activeDragItem.dragImage.classList.remove(getDragOverClass(dropzone));
    },

    _prepForDrag: function() {
      this._dragState = DRAG_STATE_PRE_DRAG;
    },

    _startDrag: function(dragItem) {
      this._dragState = DRAG_STATE_MID_DRAG;
      this.activeDragItem = dragItem;
      this.activeDropzones = [];

      this._potentialDropzones = [];
      // prep dropzones
      var dropzones = this.dropzonesByAcceptType[ACCEPT_ALL].concat(
        this.dropzonesByAcceptType[dragItem.group] || []
      );
      dropzones.forEach(dropzone => {
        dropzone._prepForDragAndDrop();
        this._potentialDropzones.push(dropzone);
      });
    },

    _postDragCleanup: function() {
      this.activeDragItem = null;
      this.activeDropzones = [];

      this._dragState = DRAG_STATE_NONE;
      this._potentialDropzones.forEach(dropzone => dropzone._postDragCleanup());
      this._potentialDropzones = [];
    },
  }
};

function getDragOverClass(dropzone) {
  return `drag-over--${dropzone.group}`;
}
