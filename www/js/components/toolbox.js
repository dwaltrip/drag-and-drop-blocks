import m from 'mithril';

export default {
  controller: function() {
  },
  view: function() {
    return m('.toolbox', [
      m('.toolbox-section', 'toolbox section 1'),
      m('.toolbox-section', 'toolbox section 2'),
      m('.toolbox-section', 'toolbox section 3')
    ]);
  }
};
