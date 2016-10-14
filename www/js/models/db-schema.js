
const WorkspaceTable = {
  name: 'workspaces',
  fields: ['name']
};

// The 'parentWidget' values in this table are identical to the 'parentWidget'
// values on the Widget input tables. This is purposeful duplication that makes
// it far easier to know if an arbitrary widget is a root widget.
const BaseWidgetTable = {
  name: 'baseWidgets',
  fields: ['type', 'pos', 'workspace', 'parentList', 'parentWidget']
};

const WidgetListTable = {
  name: 'widgetLists',
  fields: ['name', 'parentWidget']
};


const Widget2InputsTable = {
  name: 'widget2Inputs',
  fields: ['parentWidget', 'fooWidgetId']
};

const Widget3InputsTable = {
  name: 'widget3Inputs',
  fields: ['parentWidget', 'firstWidgetId', 'secondWidgetId']
};

const Widget4InputsTable = {
  name: 'widget4Inputs',
  fields: ['parentWidget', 'bazWidgetListId']
};


const TABLES = [
  WorkspaceTable, BaseWidgetTable, WidgetListTable,
  Widget2InputsTable, Widget3InputsTable, Widget4InputsTable
];

var COMMON_FIELDS = ['uid'];

export {
  TABLES, COMMON_FIELDS,
  WorkspaceTable, BaseWidgetTable, WidgetListTable,
  Widget2InputsTable, Widget3InputsTable, Widget4InputsTable
};
