
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
    dragItems: null,
    dropzones: null,

    createDragItem: function() {
      var newDragItem = DragItem.create.apply(DragItem, arguments);
      newDragItem.manager = this;

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
    }
  }
};
