import m from 'mithril';

import Toolbox from 'components/toolbox';

export default {

  controller: function() {
    this.workspace = Workspace.create();
  },
  view: function() {
    return m('.home-container', [
      m(Toolbox),
    ]);
  }
};

var Workspace = {
  create: function() {
    var instance = Object.create(this.instance);
    instance.widgets = [];
    return instance;
  },

  instance: {
    widgets: null
  }
}
