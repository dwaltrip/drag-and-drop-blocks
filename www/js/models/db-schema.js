
const WorkspaceTable = {
  name: 'workspaces',
  fields: ['name', 'widgetIds']
};

const WidgetTable = {
  name: 'widgets',
  fields: ['type', 'inputs', 'pos']
};

const TABLES = [
  WorkspaceTable,
  WidgetTable
];

var COMMON_FIELDS = ['uid'];

export { TABLES, COMMON_FIELDS, WorkspaceTable, WidgetTable };
