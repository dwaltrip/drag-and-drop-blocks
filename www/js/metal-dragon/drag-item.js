
import handleWithRedraw from 'lib/m-utils/handle-with-redraw';

const DEFAULT_GROUP = '_DEFAULT_GROUP_';

export default {
  create: function(opts) {
    var instance = Object.create(this.instance);

    instance.group = opts.group || DEFAULT_GROUP;

    var findNodeForImg = opts.findElementForDragImage;
    if (!findNodeForImg || !(typeof findNodeForImg === 'function')) {
      throw new Error('[MetalDragon.DragItem] The value for options key "findElementForDragImage" must be a function');
    }
    instance.findNodeForImage = findNodeForImg;
    instance.dragImage = null;
    instance._dragImages = [];
    instance.dragImageClass = opts.dragImageClass || 'drag-image';

    instance._eventListeners = null;
    instance.userEvents = {
      onDragend: opts.onDragend
    };

    // TODO: implement the option to specify a container
    // in which the element cannot be dragged outside of
    instance.isMovementConstrained = false;

    return instance;
  },

  instance: {
    startDrag: function(event) {
      var self = this;
      var element = this._getTargetElement(event);
      this._setupDragImage(element);
      var rect = element.getBoundingClientRect();
      this.initialCursorOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      // with mousemove events, only allow mithril to redraw every 100 milliseconds
      // we still redraw the dragImage on every mousemove (it is not controlled by mithril)
      // TODO: how can we make it so 'MetalDragon' doesn't need to know aobut mithril here
      var onMousemove = handleWithRedraw(function mousemoveHandler(event) {
        self._onMousemove(event)
      }, { throttleDelayAmount: 100 });
      var onMouseup = handleWithRedraw(event => this._onMouseup(event), { verbose: true })

      this._eventListeners = [
        { target: document, name: 'mousemove', fn: onMousemove },
        { target: document, name: 'mouseup', fn: onMouseup }
      ];
      this._eventListeners.forEach(listener => {
        listener.target.addEventListener(listener.name, listener.fn, false);
      })
    },

    _setupDragImage: function(element) {
      var dragImage = this.dragImage = this.findNodeForImage(element).cloneNode(true);

      // TODO: ensure this is always rendered in front of every other DOM element (stacking contexts, etc)
      dragImage.style.position = 'absolute';
      var rect = element.getBoundingClientRect();
      dragImage.style.left = `-${rect.left}px`;
      dragImage.style.top = `-${rect.top}px`;
      dragImage.style.pointerEvents = 'none';

      dragImage.classList.add(this.dragImageClass);
      document.body.appendChild(dragImage);

      this._dragImages.push(dragImage);
    },

    _onMousemove: function(event) {
      if (!this.isDragging) {
        this.isDragging = true;
        document.documentElement.style.cursor = 'move';
      }

      var left = event.clientX - this.initialCursorOffset.x;
      var top = event.clientY - this.initialCursorOffset.y;

      if (this.isMovementConstrained) {
        throw new Error('NOT YET IMPLEMENTED');
        var boundingRect = this._getBoundingRect();
        var left = clamp(left, boundingRect.left, boundingRect.right);
        var top = clamp(top, boundingRect.top, boundingRect.bottom);
      }

      this.dragImage.style.left = `${left}px`;
      this.dragImage.style.top = `${top}px`;
    },

    _onMouseup: function(event) {
      this.isDragging = false;
      this._cleanup();

      if (this.userEvents.onDragend) {
        this.userEvents.onDragend();
      }
    },

    _cleanup: function() {
      this._dragImages.forEach(node => node.remove());
      this._dragImages = [];

      this._eventListeners.forEach(listener => {
        listener.target.removeEventListener(listener.name, listener.fn);
      });
      this._eventListeners = null;

      document.documentElement.style.cursor = '';
    },

    // TODO: allow for this to be customized
    _getTargetElement: function(event) {
      return event.target;
    },

    // TODO: implement this
    _getBoundingRect: function() {}
  }
};
