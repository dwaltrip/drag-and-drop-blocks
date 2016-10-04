
import DragItem from './drag-item';
//import Dropzone from './dropzone';

export default {
  create: function() {
    var instance = Object.create(this.instance);

    instance.dragItemGroups = {};
    instance.dropzoneGroups = {};

    return instance;
  },

  instance: {
    dragItemGroups: null,
    dropzoneGroups: null,

    activeDragItem: null,
    _isDragging: false,

    isDragging: function() { return this._isDragging; },

    createDragItem: function(opts) {
      var newDragItem = DragItem.create(this, opts);

      var group = newDragItem.group;
      if (!(group in this.dragItemGroups)) {
        this.dragItemGroups[group] = [];
      }
      this.dragItemGroups[group].push(newDragItem);

      return newDragItem;
    },

    createDropzone: function() {
      var newDropzone = Dropzone.create.apply(Dropzone, arguments);
      newDropzone.manager = this;

      var group = newDropzone.group;
      if (!(group in this.dropzoneGroups)) {
        this.dropzoneGroups[group] = [];
      }
      this.dropzoneGroups[group].push(newDragItem);

      return newDropzone;
    },

    _startDrag: function(dragItem) {
      this._isDragging = true;
      this.activeDragItem = dragItem;
    },

    _postDragCleanup: function() {
      this.activeDragItem = null;
      this._isDragging = false;
    },
  }
};
