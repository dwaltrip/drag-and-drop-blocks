import { extendModel, Base } from 'models/base';
import { removeFromArray } from 'lib/utils';
import { TABLES } from 'models/db-schema';

import Widget from 'models/widget';
import WidgetList from 'models/widget-list';
import db from 'db';

export default extendModel(Base, {
  _fields: TABLES.workspaces.fields,
  tableName: TABLES.workspaces.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    instance._setupWidgetList();
    return instance;
  },

  instance: {
    _widgetList: null,

    widgets: function()     { return this._widgetList.widgets; },
    widgetList: function()  { return this._widgetList; },

    createWidget:   proxyToWidgetList('createWidget'),
    insertAfter:    proxyToWidgetList('insertAfter'),
    prepend:        proxyToWidgetList('prepend'),
    append:         proxyToWidgetList('append'),

    _setupWidgetList: function() {
      if (!this.widgetListId()) {
        var widgetList = WidgetList.create({ name: 'workspace-root' });
        this.widgetListId(widgetList.uid());
        this.save();
      } else {
        var widgetList = WidgetList.findByUID(this.widgetListId());
      }
      widgetList.workspace = this;
      this._widgetList = widgetList;
    }
  }
});

function proxyToWidgetList(fnName) {
  return function() {
    return this._widgetList[fnName].apply(this._widgetList, arguments);
  }
}
