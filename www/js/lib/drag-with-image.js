
export default {
  create: function(opts) {
    var instance = Object.create(this.instance);

    var findNodeForImg = opts.findElementForDragImage;
    if (!findNodeForImg || !(typeof findNodeForImg === 'function')) {
      throw new Error('[drag-with-image] The value for options key "findElementForDragImage" must be a function');
    }
    instance.findNodeForImage = findNodeForImg;
    instance._nodes = [];

    return instance;
  },

  instance: {
    prepImage: function(element) {
      var nodeForImage = this.findNodeForImage(element).cloneNode(true);
      document.body.appendChild(nodeForImage);
      pushOffScreen(nodeForImage);
      this._nodes.push(nodeForImage);
      return nodeForImage;
    },
    cleanup: function() {
      this._nodes.forEach(node => node.remove());
      this._nodes = [];
    }
  }
};

function pushOffScreen(el) {
  el.style.position = 'absolute';
  el.style.top = `-${el.offsetHeight}px`;
  el.style.left = `-${el.offsetWidth}px`;
}
