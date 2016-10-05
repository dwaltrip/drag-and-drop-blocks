
export default {
  create: function(manager, opts) {
    var instance = Object.create(this.instance);

    instance.manager = manager;
    instance.group = opts.group || manager.DEFAULT_GROUP;

    instance._eventListeners = null;
    instance.userEvents = {
      onMouseenter: opts.onMouseenter
    };

    if (manager.eventHandlerDecorator) {
      var decorator = manager.eventHandlerDecorator;
      instance._onMouseenter = decorator('mouseenter', instance._onMouseenter);
      instance._onMouseleave = decorator('mouseleave', instance._onMouseleave);
    } 

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
    _eventListeners: null,

    hasElement:       function() { return !!this._element; },
    isDraggingOver:   function() { return this._isDraggingOver; },
    isReadyForDrop:   function() { return this._isReadyForDrop; },
    doesAcceptAll:    function() { return !this._restrictDropTypes; },

    attachToElement: function(element) {
      this._element = element;
    },

    _prep: function(dragItem) {
      this._isReadyForDrop = true;
      this._listenForDrop();
    },

    _listenForDrop: function() {
      if (!this.hasElement()) {
        throw new Error('Metal-Dragon: dropzone cannot listen for a drop without being attached do an element');
      }

      this._eventListeners = [
        { target: this._element, name: 'mouseenter', fn: (event) => this._onMouseenter(event) },
        { target: this._element, name: 'mouseleave', fn: (event) => this._onMouseleave(event) }
      ];
      this._eventListeners.forEach(listener => {
        listener.target.addEventListener(listener.name, listener.fn, false);
      }); 
    },

    // FIXME: if we end the current drag before leaving this widget row,
    // then the mouseleave event will not fire and this widget gets stuck in '_isDraggingOver' mode
    _onMouseenter: function(event) {
      this._isDraggingOver = true;

      if (this.userEvents.onMouseenter) {
        this.userEvents.onMouseenter();
      }
    },
    _onMouseleave: function(event) {
      this._isDraggingOver = false;
    },

    _cleanup: function() {
      this._eventListeners.forEach(listener => {
        listener.target.removeEventListener(listener.name, listener.fn);
      });
      this._eventListeners = null; 

      this._isReadyForDrop = false;
    }
  }
};
