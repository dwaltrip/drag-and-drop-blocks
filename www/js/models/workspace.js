
import { extendModel, Base } from 'models/base';
import { WorkspaceTable } from 'models/db-schema';
import { removeFromArray } from 'lib/utils';

import Widget from 'models/widget';
import db from 'db';
import WidgetList from 'models/widget-list';


export default extendModel(Base, {
  _fields: WorkspaceTable.fields,
  tableName: WorkspaceTable.name,

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

    removeWidget: function(widgetToDelete) {
      this.widgetList.remove(widgetToDelete)
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
