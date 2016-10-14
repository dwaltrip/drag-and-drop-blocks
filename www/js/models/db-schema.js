
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
  fields: ['name', 'pos', 'parentWidget']
};

// NOTE: I may not need this generalized 'widget link' table
// the widget type specific link tables below may be sufficicent
// const WidgetLinkTable = {
//   name: 'widgetLinks',
//   fields: ['name', 'parentWidget', 'childWidget']
// };

// Widgets of type widget1 & widget4 don't have solitary child widgets.
// widget4 only has a widgetList as an input

const Widget2InputsTable = {
  name: 'widget2Inputs',
  fields: ['parentWidget', 'fooWidget']
};

const Widget3InputsTable = {
  name: 'widget3Inputs',
  fields: ['parentWidget', 'firstWidget', 'secondWidgetLink']
};

const Widget4InputsTable = {
  name: 'widget4Inputs',
  fields: ['fooWidgetList', 'parentWidget']
};


const TABLES = [
  WorkspaceTable, BaseWidgetTable, WidgetListTable,
  // WidgetLinkTable, WidgetListTable,
  Widget2InputsTable, Widget3InputsTable, Widget4InputsTable
];

var COMMON_FIELDS = ['uid'];

export {
  TABLES, COMMON_FIELDS,
  WorkspaceTable, BaseWidgetTable, WidgetListTable,
  // WidgetLinkTable, WidgetListTable,
  Widget2InputsTable, Widget3InputsTable, Widget4InputsTable
};
