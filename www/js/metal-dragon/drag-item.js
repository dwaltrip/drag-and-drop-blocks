
export default {
  create: function(manager, opts) {
    var instance = Object.create(this.instance);

    instance.manager = manager;
    instance.group = opts.group || manager.DEFAULT_GROUP;

    var findNodeForImg = opts.findElementForDragImage;
    if (!findNodeForImg || !(typeof findNodeForImg === 'function')) {
      throw new Error('[MetalDragon.DragItem] The value for options key "findElementForDragImage" must be a function');
    }
    instance.findNodeForImage = findNodeForImg;
    instance.dragImage = null;
    instance._dragImages = [];
    instance.dragImageClass = opts.dragImageClass || 'drag-image';

    if (manager.eventHandlerDecorator) {
      var decorator = manager.eventHandlerDecorator;
      instance._onMousemove = decorator('mousemove', instance._onMousemove);
      instance._onMouseup = decorator('mouseup', instance._onMouseup);
    }

    instance._eventListeners = null;
    instance.userEvents = {
      onDragend: opts.onDragend
    };

    instance.isMovementConstrained = false;
    if (opts.constraints) {
      instance.isMovementConstrained = true;
      if (opts.constraints.getBoundingElement) {
        instance.getBoundingElement = opts.constraints.getBoundingElement;
      }
    }

    return instance;
  },

  instance: {
    manager: null,

    isDragging: function() {
      return this === this.manager.activeDragItem;
    },

    startDrag: function(event) {
      var self = this;
      var element = this._getTargetElement(event);
      this._setupDragImage(element);
      var rect = element.getBoundingClientRect();
      this.initialCursorOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      // TODO: this works, however if I move the mouse up and down outside of the bounding container,
      // the widget dragging doesn't get re-ordered (even though the y-pos of my mouse is going thrugh
      // different widget rows)
      if (this.isMovementConstrained) {
        var container = this.getBoundingElement(element);
        this._boundingRect = container.getBoundingClientRect();
      }

      // NOTE: this gives us a reference to the listeners, so we can call 'removeEventListener' later
      // This also lets us ensure that _onMousemove and _onMouseup are called with the correct 'this' context
      this._eventListeners = [
        { target: document, name: 'mousemove', fn: (event) => this._onMousemove(event) },
        { target: document, name: 'mouseup', fn: (event) => this._onMouseup(event) }
      ];
      this._eventListeners.forEach(listener => {
        listener.target.addEventListener(listener.name, listener.fn, false);
      });
    },

    getBoundingElement: function() {
      throw new Error(`-- drag-item -- getBoundingElement must be specified in 'contraints' hash.`);
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
      if (!this.manager.isDragging()) {
        this.manager._startDrag(this);
        document.documentElement.style.cursor = 'move';
      }

      var newPosition = {
        left: event.clientX - this.initialCursorOffset.x,
        top: event.clientY - this.initialCursorOffset.y
      };

      if (this.isMovementConstrained) {
        newPosition = this._constrainDragElement(newPosition);
      }

      this.dragImage.style.left = `${newPosition.left}px`;
      this.dragImage.style.top = `${newPosition.top}px`;
    },

    // TODO: should this be here, in DragItem? or should it be in the manager class?
    _onMouseup: function(event) {
      this._postDragCleanup();

      if (this.userEvents.onDragend) {
        this.userEvents.onDragend();
      }
    },

    _postDragCleanup: function() {
      this._dragImages.forEach(node => node.remove());
      this._dragImages = [];

      this._eventListeners.forEach(listener => {
        listener.target.removeEventListener(listener.name, listener.fn);
      });
      this._eventListeners = null;

      if (this.isMovementConstrained) {
        this._boundingRect = null;
      }

      this.manager._postDragCleanup();

      document.documentElement.style.cursor = '';
    },

    // TODO: allow for this to be customized
    _getTargetElement: function(event) {
      return event.target;
    },

    _constrainDragElement: function(elementPosition) {
      var rect = this._boundingRect;
      return {
        left: clamp(elementPosition.left, rect.left, rect.right),
        top: clamp(elementPosition.top, rect.top, rect.bottom)
      }
    }
  }
};

function clamp(numberToClamp, min, max) {
  return Math.max(min, Math.min(numberToClamp, max));
}
