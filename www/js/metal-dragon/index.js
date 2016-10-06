
import DragItem from './drag-item';
import Dropzone from './dropzone';

const ACCEPT_ALL = '_ACCEPT_ALL_';

export default {
  create: function(opts) {
    var instance = Object.create(this.instance);

    instance.dragItemGroups = {};
    instance.dropzonesByAcceptType = { [ACCEPT_ALL]: [] };

    if (opts.eventHandlerDecorator) {
      instance.eventHandlerDecorator = opts.eventHandlerDecorator;
    }

    return instance;
  },

  DEFAULT_GROUP: '_DEFAULT_GROUP_',
  ACCEPT_ALL: ACCEPT_ALL,

  instance: {
    dragItemGroups: null,
    dropzonesByAcceptType: null,
    eventHandlerDecorator: null,

    activeDragItem: null,
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

    _startDrag: function(dragItem) {
      this._isDragging = true;
      this.activeDragItem = dragItem;

      this._activeDropzones = [];
      // prep dropzones
      var dropzones = this.dropzonesByAcceptType[ACCEPT_ALL].concat(
        this.dropzonesByAcceptType[dragItem.group] || []
      );
      dropzones.forEach(dropzone => {
        dropzone._prepForDrag();
        this._activeDropzones.push(dropzone);
      });
    },

    _postDragCleanup: function() {
      this.activeDragItem = null;
      this._isDragging = false;

      this._activeDropzones.forEach(dropzone => dropzone._postDragCleanup());
      this._activeDropzones = [];
    },
  }
};
