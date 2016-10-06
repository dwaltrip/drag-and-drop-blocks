
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
      instance._onMousedown = decorator('mousedown', instance._onMousedown);
      instance._onMousemove = decorator('mousemove', instance._onMousemove);
      instance._onMouseup = decorator('mouseup', instance._onMouseup);
    }
    instance._boundEventListeners = {
      onmousedown: (event) => instance._onMousedown(event),
      onmousemove: (event) => instance._onMousemove(event),
      onmouseup:   (event) => instance._onMouseup(event),
    };

    instance.userEvents = {
      onDragStart: opts.onDragStart,
      onDrop: opts.onDrop
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
    _element: null,
    _boundEventListeners: null,

    isDragging: function() {
      return this === this.manager.activeDragItem;
    },

    _prepForDrag: function(event) {
      var self = this;
      var element = this._getTargetElement(event);
      var dragImage = this._setupDragImage(element);
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
        var rect = container.getBoundingClientRect();
        var dragImageSize = getFullSize(dragImage);
        this._boundingRect = {
          left: rect.left,
          top: rect.top,
          right: rect.right - dragImageSize.width,
          bottom: rect.bottom - dragImageSize.height
        };
      }

      document.addEventListener('mousemove', this._boundEventListeners.onmousemove, false);
      document.addEventListener('mouseup', this._boundEventListeners.onmouseup, false);
    },

    attachToElement: function(element) {
      this._element = element;
      element.addEventListener('mousedown', this._boundEventListeners.onmousedown)
    },

    unAttachFromElement: function() {
      this._element.removeEventListener('mousedown', this._boundEventListeners.onmousedown);
      this._element = null;
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
      return dragImage;
    },

    _onMousedown: function(event) {
      this._prepForDrag(event);
    },

    _onMousemove: function(event) {
      // NOTE: after the 'mousedown' event on a dragitem, we don't consider the drag
      // to have officially started until the first 'mousemove' event fires
      if (!this.manager.isDragging()) {
        this.manager._startDrag(this);
        document.documentElement.style.cursor = 'move';

        if (this.userEvents.onDragStart) {
          this.userEvents.onDragStart(event);
        }
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

      if (this.userEvents.onDrop) {
        this.userEvents.onDrop(event);
      }
    },

    _postDragCleanup: function() {
      this._dragImages.forEach(node => node.remove());
      this._dragImages = [];

      document.removeEventListener('mousemove', this._boundEventListeners.onmousemove)
      document.removeEventListener('mouseup', this._boundEventListeners.onmouseup)

      if (this.isMovementConstrained) {
        this._boundingRect = null;
      }

      if (this.isDragging()) {
        this.manager._postDragCleanup();
      }

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

function getFullSize(element) {
  var style = getComputedStyle(element);
  return {
    width: element.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginLeft),
    height: element.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom)
  };
}
