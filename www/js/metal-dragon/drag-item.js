import { assert } from './utils';
import { DEFAULT_GROUP, DRAG_HANDLE_CSS_CLASS } from './constants';

export default {
  create: function(manager, opts) {
    var instance = Object.create(this.instance);

    instance.manager = manager;
    instance.group = opts.group || DEFAULT_GROUP;

    instance._getDragCursorSourceNode = opts.getDragCursorSourceNode || (el => el);
    instance._dragHandleClass = opts.dragHandle;
    instance.dragCursorClass = opts.dragCursorClass || 'drag-cursor';

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
      beforeDrag: opts.beforeDrag || doNothing,
      onDragStart: opts.onDragStart || doNothing,
      onDrop: opts.onDrop || doNothing,
      afterDrop: opts.afterDrop || doNothing
    };

    instance.hasCustomDragRect = !!opts.dragRect;
    if (instance.hasCustomDragRect) {
      instance._dragRect = opts.dragRect;
      instance._validateDragRect();
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
    dragCursor: null,
    _itemData: null,
    _dragData: null,
    _element: null,
    _boundEventListeners: null,
    _dragRect: null,

    isDragging: function() {
      return this === this.manager.activeDragItem;
    },

    setDragData: function(key, value) {
      this._dragData[key] = value;
    },

    getDragRect: function() {
      var cursorRect = this.dragCursor.getBoundingClientRect();
      if (!this.hasCustomDragRect) { return cursorRect; }

      var dragRect = this._dragRect;
      return {
        top:      cursorRect.top    + dragRect.top,
        bottom:   cursorRect.top    + dragRect.top    + dragRect.height,
        left:     cursorRect.left   + dragRect.left,
        right:    cursorRect.left   + dragRect.left   + dragRect.width
      };
    },

    getDragData: function(key, defaultVal) {
      var errorMsg = `DragItem.getDragData - Invalid key '${key}'. Valid keys: ${Object.keys(this._dragData)}`;
      var hasDefault = typeof defaultVal !== 'undefined';
      assert(key in this._dragData, errorMsg);
      return key in this._dragData ? this._dragData[key] : defaultVal;
    },

    setItemData: function(key, value) {
      this._itemData[key] = value;
    },

    getItemData: function(key, defaultVal) {
      var errorMsg = `DragItem.getItemData - Invalid key '${key}'. Valid keys: ${Object.keys(this._itemData)}`;
      var hasDefault = typeof defaultVal !== 'undefined';
      assert(key in this._itemData || hasDefault, errorMsg);
      return key in this._itemData ? this._itemData[key] : defaultVal;
    },

    isAboveGroup: function(group) {
      return !!this.manager.targetDropzones.find(dz => dz.group === group);
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
      var dragCursor = this._setupDragCursor(element, event);

      if (this.isMovementConstrained) {
        var container = this.getBoundingElement(element);
        var rect = container.getBoundingClientRect();
        var cursorSize = getFullSize(dragCursor);
        this._boundingRect = {
          left: rect.left,
          top: rect.top,
          right: rect.right - cursorSize.width,
          bottom: rect.bottom - cursorSize.height
        };
      }

      this._updateDragCursorPos(event);
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

    _setupDragCursor: function(element, event) {
      var sourceNode = this._getDragCursorSourceNode(element, event);
      var dragCursor = this.dragCursor = sourceNode.cloneNode(true);
      dragCursor.style.position = 'absolute';
      dragCursor.style.pointerEvents = 'none';
      dragCursor.classList.add(this.dragCursorClass);
      document.body.appendChild(dragCursor);
      return dragCursor;
    },

    _onMousedown: function(event) {
      this._prepForDrag(event);
      this.userEvents.beforeDrag.call(this, event);
    },

    _onMousemove: function(event) {
      // NOTE: after the 'mousedown' event on a dragitem, we don't consider the drag
      // to have officially started until the first 'mousemove' event fires
      if (!this.manager.isMidDrag()) {
        this.userEvents.onDragStart.call(this, event);
        this.manager._startDrag(this, event);
        document.documentElement.style.cursor = 'move';
      }

      this._updateDragCursorPos(event);
      this.manager.onMouseMove(event);
    },

    // TODO: should this be here, in DragItem? or should it be in the manager class?
    _onMouseup: function(event) {
      if (this.manager.isMidDrag()) {
        this.manager.onDrop();

        if (this.manager.hasTargetDropzone()) {
          this.userEvents.onDrop.call(this, event);
          this.userEvents.afterDrop.call(this, event);
        }
      }
      this._postDragCleanup();
    },

    _postDragCleanup: function() {
      this.dragCursor.remove();
      this.dragCursor = null;
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
    _updateDragCursorPos: function(event) {
      var newPos = {
        left: event.clientX - this.initialCursorOffset.x,
        top: event.clientY - this.initialCursorOffset.y
      };
      if (this.isMovementConstrained) {
        newPos = this._constrainDragElement(newPos);
      }
      this.dragCursor.style.left = `${newPos.left}px`;
      this.dragCursor.style.top = `${newPos.top}px`;
    },

    _constrainDragElement: function(elementPosition) {
      var rect = this._boundingRect;
      return {
        left: clamp(elementPosition.left, rect.left, rect.right),
        top: clamp(elementPosition.top, rect.top, rect.bottom)
      }
    },

    _validateDragRect: function() {
      ['top', 'left', 'height', 'width'].forEach(attr => {
        if (typeof this._dragRect[attr] === 'undefined') {
          throw new Error(`drag-item -- '${attr}' is a required attribute for 'dragRect'.`);
        } else if (typeof this._dragRect[attr] !== 'number') {
          throw new Error(`drag-item -- 'dragRect.${attr}' must be a number.`);
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

function doNothing() {}
