
const CREATE = 'CREATE';
const MOVE = 'MOVE';
const DELETE = 'DELETE';

export default {
  ACTION_TYPES: {
    [CREATE]: CREATE,
    [MOVE]: MOVE,
    [DELETE]: DELETE
  },

  create: function() {
    var instance = Object.create(this.instance);
    instance.undoStack = [];
    instance.redoStack = [];
    return instance;
  },

  instance: {
    undoStack: null,
    redoStack: null,

    pushAction: function(opts) {
      undoStack.push()
    },
  }
};

/*
do a -- undo: [a]
        redo: [a]
do b -- undo: [a, b]
        redo: [b]
do c -- undo: [a, b, c]
        redo: [c]

undo -- undo: [a, b, c]
        redo: [c]

CAN_REPEAT_REODS: false // if we have done one or more undos since the last new action
CAN_REPEAT_REODS: true // if we have zero undos since the last new actinon (no restriction on redos)
*/
