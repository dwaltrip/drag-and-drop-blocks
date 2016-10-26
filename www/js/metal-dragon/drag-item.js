
import { DEFAULT_GROUP, DRAG_HANDLE_CSS_CLASS } from './constants';

export default {
  create: function(manager, opts) {
    var instance = Object.create(this.instance);

    instance.manager = manager;
    instance.group = opts.group || DEFAULT_GROUP;

    instance._findElementForDragImage = opts.getDragImageSourceNode;
    instance._dragHandleClass = opts.dragHandle;
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
      onDragInit: opts.onDragInit,
      onDragStart: opts.onDragStart,
      onDrop: opts.onDrop,
      afterDrop: opts.afterDrop
    };

    instance.hasTargetZone = !!opts.targetZone;
    if (instance.hasTargetZone) {
      instance._targetZone = opts.targetZone;
      instance._validateTargetZone();
    }

    instance.isMovementConstrained = false;
    if (opts.constraints || opts.boundingContainer) {
      instance.isMovementConstrained = true;
      if (opts.constraints && opts.constraints.getBoundingElement) {
        instance.getBoundingElement = opts.constraints.getBoundingElement;
      } else {
        var className = opts.boundingContainer;
        instance.getBoundingElement = (element) => findAncestorWithClass(element, className);
      }
    }

    instance._itemData = {};
    if (opts.itemData) {
      Object.keys(opts.itemData).forEach(key => instance._itemData[key] = opts.itemData[key]);
    }

    return instance;
  },

  instance: {
    manager: null,
    dragImage: null,
    _itemData: null,
    _dragData: null,
    _element: null,
    _boundEventListeners: null,
    _targetZone: null,

    isDragging: function() {
      return this === this.manager.activeDragItem;
    },

    setDragData: function(key, value) {
      this._dragData[key] = value;
    },

    getDragRect: function() {
      if (!this.manager.isMidDrag()) {
        throw new Error('drag-item -- has no drag rect when not dragging.')
      }
      var dragImageRect = this.dragImage.getBoundingClientRect();
      if (!this.hasTargetZone) {
        return dragImageRect;
      }
      var targetZone = this._targetZone;
      return {
        top:      dragImageRect.top   + targetZone.top,
        bottom:   dragImageRect.top   + targetZone.top    + targetZone.height,
        left:     dragImageRect.left  + targetZone.left,
        right:    dragImageRect.left  + targetZone.left   + targetZone.width
      };
    },

    getDragData: function(key) {
      if (!(key in this._dragData)) {
        throw new Error([
          `DragItem ${this.id} has no dragData for key: ${key}.`,
          `Existing keys: ${Object.keys(this._dragData)}`
        ].join(' '));
      }
      return this._dragData[key];
    },

    setItemData: function(key, value) {
      this._itemData[key] = value;
    },

    getItemData: function(key, defaultValue) {
      var hasDefault = typeof defaultValue !== 'undefined';
      if (!(key in this._itemData) && !hasDefault) {
        throw new Error([
          `DragItem ${this.id} has no itemData for key: ${key}.`,
          `Existing keys: ${Object.keys(this._itemData)}`
        ].join(' '));
      }
      var val = this._itemData[key];
      return typeof val === 'undefined' && hasDefault ? defaultValue : val;
    },

    isAboveGroup: function(group) {
      return !!this.manager.activeDropzones.find(dz => dz.group === group);
    },

    destroy: function() {
      this.manager.removeDragItem(this);
    },

    _prepForDrag: function(event) {
      this._dragData = {};
      var element = this._element;
      var rect = element.getBoundingClientRect();
      this.initialCursorOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      var dragImage = this._setupDragImage(element, event);

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

      this._updateDragImagePos(event);
      this.manager._prepForDrag();
      document.addEventListener('mousemove', this._boundEventListeners.onmousemove, false);
      document.addEventListener('mouseup', this._boundEventListeners.onmouseup, false);
    },

    attachToElement: function(element) {
      this._element = element;
      if (this._dragHandleClass) {
        this._dragHandle = findChildWithClass(element, this._dragHandleClass);
        if (!this._dragHandle) {
          throw new Error(`DragItem: No drag-handle with class '${this._dragHandleClass}' was found`);
        }
      } else {
        this._dragHandle = element;
      }
      this._dragHandle.classList.add(DRAG_HANDLE_CSS_CLASS);
      this._dragHandle.addEventListener('mousedown', this._boundEventListeners.onmousedown)
    },

    unattachFromElement: function() {
      this._dragHandle.removeEventListener('mousedown', this._boundEventListeners.onmousedown);
      this._dragHandle.classList.remove(DRAG_HANDLE_CSS_CLASS);
      this._dragHandle = null;
      this._element = null;
    },

    getBoundingElement: function() {
      throw new Error(`-- drag-item -- getBoundingElement must be specified in 'contraints' hash.`);
    },

    _setupDragImage: function(element, event) {
      var dragImageSource = this._findElementForDragImage ?
        this._findElementForDragImage(element, event) : element;
      var dragImage = this.dragImage = dragImageSource.cloneNode(true);
      dragImage.style.position = 'absolute';
      dragImage.style.pointerEvents = 'none';
      dragImage.classList.add(this.dragImageClass);
      document.body.appendChild(dragImage);
      return dragImage;
    },

    _onMousedown: function(event) {
      this._prepForDrag(event);

      if (this.userEvents.onDragInit) {
        this.userEvents.onDragInit.call(this, event);
      }
    },

    _onMousemove: function(event) {
      // NOTE: after the 'mousedown' event on a dragitem, we don't consider the drag
      // to have officially started until the first 'mousemove' event fires
      if (!this.manager.isMidDrag()) {
        if (this.userEvents.onDragStart) {
          this.userEvents.onDragStart.call(this, event);
        }
        this.manager._startDrag(this, event);
        document.documentElement.style.cursor = 'move';
      }

      this._updateDragImagePos(event);
      this.manager.onMouseMove(event);
    },

    // TODO: should this be here, in DragItem? or should it be in the manager class?
    _onMouseup: function(event) {
      if (this.manager.isMidDrag()) {
        this.manager.onDrop();
        if (this.userEvents.onDrop) {
          this.userEvents.onDrop.call(this, event);
        }
        if (this.userEvents.afterDrop) {
          this.userEvents.afterDrop.call(this, event);
        }
      }
      this._postDragCleanup();
    },

    _postDragCleanup: function() {
      this.dragImage.remove();
      this.dragImage = null;
      this._dragData = {};

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

    // TODO: ensure this is always rendered in front of every other DOM element (stacking contexts, etc)
    _updateDragImagePos: function(event) {
      var newPos = {
        left: event.clientX - this.initialCursorOffset.x,
        top: event.clientY - this.initialCursorOffset.y
      };
      if (this.isMovementConstrained) {
        newPos = this._constrainDragElement(newPos);
      }
      this.dragImage.style.left = `${newPos.left}px`;
      this.dragImage.style.top = `${newPos.top}px`;
    },

    _constrainDragElement: function(elementPosition) {
      var rect = this._boundingRect;
      return {
        left: clamp(elementPosition.left, rect.left, rect.right),
        top: clamp(elementPosition.top, rect.top, rect.bottom)
      }
    },

    _validateTargetZone: function() {
      ['top', 'left', 'height', 'width'].forEach(attr => {
        if (typeof this._targetZone[attr] === 'undefined') {
          throw new Error(`drag-item -- '${attr}' is a required attribute for targetZone.`);
        } else if (typeof this._targetZone[attr] !== 'number') {
          throw new Error(`drag-item -- 'targetZone.${attr}' must be a number.`);
        }
      });
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

function findChildWithClass(el, cls) {
  var children = el.getElementsByClassName(cls);
  return children[0];
}

function findAncestorWithClass(el, cls) {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}
