import { extendBaseModel, Base } from 'models/base';
import { WidgetTable } from 'models/db-schema';

const WidgetTypes = {
  WIDGET1: 'widget1',
  WIDGET2: 'widget2',
  WIDGET3: 'widget3',
  WIDGET4: 'widget4'
};

var Widget = extendBaseModel({
  _fields: WidgetTable.fields,
  tableName: WidgetTable.name,

  create: function(data) {
    var instance = Base.create.call(this, data);
    return instance;
  },

  instance: {
    isRoot: function() {
      return this.parentWidget() === null && this.parentList() === null;
    },

    // TODO: IMPLEMENT THIS.
    // Remove all links & references marking this as a child widget or member of a widget list
    makeRoot: function() {
      console.log('Widget.instance.makeRoot -- TODO: implement this');
    },
  }
});

export { Widget as default, WidgetTypes };
