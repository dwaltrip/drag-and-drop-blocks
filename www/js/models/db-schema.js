
const WorkspaceTable = {
  name: 'workspaces',
  fields: ['name']
};

// The 'parentWidget' values in this table are identical to the 'parentWidget'
// values on the Widget input tables. This is purposeful duplication that makes
// it far easier to know if an arbitrary widget is a root widget.
const WidgetTable = {
  name: 'widgets',
  fields: ['type', 'pos', 'workspace', 'parentList', 'parentWidget']
};

const TABLES = [
  WorkspaceTable, WidgetTable
];

var COMMON_FIELDS = ['uid'];

export {
  TABLES, COMMON_FIELDS,
  WorkspaceTable, WidgetTable
};
