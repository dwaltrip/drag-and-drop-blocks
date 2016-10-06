
export default {
  create: function(manager, opts) {
    var instance = Object.create(this.instance);

    instance.manager = manager;
    instance.group = opts.group || manager.DEFAULT_GROUP;

    instance.userEvents = {
      onDragEnter: opts.onDragEnter
    };

    if (manager.eventHandlerDecorator) {
      var decorator = manager.eventHandlerDecorator;
      instance._onMouseenter = decorator('mouseenter', instance._onMouseenter);
      instance._onMouseleave = decorator('mouseleave', instance._onMouseleave);
    } 
    instance._boundEventListeners = {
      onmouseenter: (event) => instance._onMouseenter(event),
      onmouseleave: (event) => instance._onMouseleave(event)
    };

    if (opts.accepts) {
      var accepts = opts.accepts;
      instance.accepts = (accepts instanceof Array) ? accepts : [accepts];
      instance._restrictDropTypes = true;
    }

    if (opts.element) {
      instance.attachToElement(opts.element);
    }

    return instance;
  },

  instance: {
    accepts: null,
    _restrictDropTypes: false,
    _isReadyForDrop: false,
    _element: null, 
    _boundEventListeners: null,

    hasElement:       function() { return !!this._element; },
    isDraggingOver:   function() { return this._isDraggingOver; },
    isReadyForDrop:   function() { return this._isReadyForDrop; },
    doesAcceptAll:    function() { return !this._restrictDropTypes; },

    attachToElement: function(element) {
      this._element = element;
    },

    _prepForDrag: function(dragItem) {
      this._isReadyForDrop = true;
      this._listenForDrop();
    },

    _listenForDrop: function() {
      if (!this.hasElement()) {
        throw new Error('Metal-Dragon: dropzone cannot listen for a drop without being attached to an element');
      }

      this._element.addEventListener('mouseenter', this._boundEventListeners.onmouseenter, false);
      this._element.addEventListener('mouseleave', this._boundEventListeners.onmouseleave, false);
    },

    _onMouseenter: function(event) {
      this._isDraggingOver = true;

      if (this.userEvents.onDragEnter) {
        this.userEvents.onDragEnter(event, this.manager.activeDragItem);
      }
    },

    _onMouseleave: function(event) {
      this._isDraggingOver = false;
    },

    // TODO: not sure if this makes sense or is useful
    unAttachFromElement: function() {
      this._element = null;
    },

    _postDragCleanup: function() {
      this._element.removeEventListener('mouseenter', this._boundEventListeners.onmouseenter);
      this._element.removeEventListener('mouseleave', this._boundEventListeners.onmouseleave);

      this._isReadyForDrop = false;
      this._isDraggingOver = false;
    }
  }
};
