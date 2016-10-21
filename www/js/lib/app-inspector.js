import m from 'mithril';

var _data = {};

var AppInspector = {
  set: function(key, val) {
    _data[key] = val;
  },

  remove: function(key) {
    delete _data[key];
  },

  getData: function() {
    var dataKeys = Object.keys(_data);
    dataKeys.sort();
    return dataKeys.map(key => new Object({ key, value: _data[key] }));
  },

  clear: function() {
    _data = {};
  },

  component: {
    view: function() {
      var data = AppInspector.getData();
      return m('.debug-display', {
        style: {
          backgroundColor: '#555',
          color: 'white',
          position: 'absolute',
          right: 0,
          top: 0,
          opacity: 0.8
        },
      }, [
        m('', { style: { padding: '5px', borderBottom: '1px solid #ccc' } }, 'App-Inspector'),
        m('', { style: { display: 'table' } }, data.map(datum => {
          return tableRow([
            tableCell(datum.key),
            tableCell(datum.value)
          ]);
        }))
      ]);
    }
  }
};

export default AppInspector;

function tableRow(content) {
  return m('', {
    style: { display: 'table-row' }
  }, content);
}

function tableCell(content) {
  return m('', {
    style: {
      display: 'table-cell',
      padding: '5px'
    }
  }, content);
}
