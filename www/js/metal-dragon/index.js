
import DragItem from './drag-item';
import Dropzone from './dropzone';

import { ACCEPT_ALL, DEFAULT_GROUP, DRAG_HANDLE_CSS_CLASS } from './constants';
import { addStylesheetRules, removeFromArray } from './utils';

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
    _isDragging: false,

    dropzoneCount: 0,
    dragItemCount: 0,

    isDragging: function() { return this._isDragging; },

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
      this.activeDropzones.forEach(dropzone => {
        if (dropzone.userEvents.onDrop) {
          dropzone.userEvents.onDrop(this.activeDragItem);
        }
      });
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

    _startDrag: function(dragItem) {
      this._isDragging = true;
      this.activeDragItem = dragItem;
      this.activeDropzones = [];

      this._potentialDropzones = [];
      // prep dropzones
      var dropzones = this.dropzonesByAcceptType[ACCEPT_ALL].concat(
        this.dropzonesByAcceptType[dragItem.group] || []
      );
      dropzones.forEach(dropzone => {
        dropzone._prepForDrag();
        this._potentialDropzones.push(dropzone);
      });
    },

    _postDragCleanup: function() {
      this.activeDragItem = null;
      this.activeDropzones = [];

      this._isDragging = false;
      this._potentialDropzones.forEach(dropzone => dropzone._postDragCleanup());
      this._potentialDropzones = [];
    },
  }
};

function getDragOverClass(dropzone) {
  return `drag-over--${dropzone.group}`;
}
