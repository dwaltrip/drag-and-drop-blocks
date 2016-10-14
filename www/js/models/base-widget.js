import { extendModel, Base } from 'models/base';
import { BaseWidgetTable } from 'models/db-schema';


export default extendModel(Base, {
  _fields: BaseWidgetTable.fields,
  tableName: BaseWidgetTable.name,

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

    // hasChildWidgets: function() {
    //   return this.class.query({ query: { parentWidget: this.uid() } }).length > 0;
    // },

    // hasWidgetLists: function() {
    //   return WidgetList.query
    // },

    // childWidgets: function() {
    //   return ChildWidget.query({ query: { parentWidget: this.uid() } });
    // },

    // childWidgetLists: function() {
    //   return ChildWidgetList.query({ query: { parentWidget: this.uid() } });
    // },
  }
});


function linksForWidgetType2() {
  var links = Widget2InputsTable.query({
    query: { parentWidget: this.uid() }
  });
  if (links.length > 1) { throw new Error ('widget type 2 should NOT have 2 child widgets'); }
  return links[0] || null;
}

function linksForWidgetType3() {
  return null;
}

function linksForWidgetType1() { return []; }
function linksForWidgetType4() { return []; }
