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
    instance._widgetList = instance._setupWidgetList();
    return instance;
  },

  instance: {
    _widgetList: null,

    getWidgets: function() {
      return this._widgetList.widgets;
    },

    getWidgetList: function() {
      return this._widgetList;
    },

    _setupWidgetList: function() {
      if (!this.widgetList()) {
        var widgetList = WidgetList.create({ name: 'workspace-root' });
        this.widgetList(widgetList.uid());
        this.save();
      } else {
        var widgetList = WidgetList.findByUID(this.widgetList());
      }
      widgetList.workspace = this;
      return widgetList;
    },

    createWidget: function(type) {
      return Widget.create({ type, workspace: this.uid() });
    },

    insertAfter:    proxyToWidgetList('insertAfter'),
    sortWidgets:    proxyToWidgetList('sort'),
    appendWidget:   proxyToWidgetList('appendWidget'),

    // TODO: this fn is not used. is it still needed?
    removeWidget: function(widgetToDelete) {
      this.getWidgetList().remove(widgetToDelete)
      widgetToDelete.delete();
    },

    allWidgets: function() {
      return Widget.query({ query: { workspace: this.uid() } });
    }
  }
});

function proxyToWidgetList(fnName) {
  return function() {
    return this._widgetList[fnName].apply(this._widgetList, arguments);
  }
}
