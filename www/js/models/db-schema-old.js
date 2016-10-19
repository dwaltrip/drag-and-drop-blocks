
var COMMON_FIELDS = ['uid'];

const WorkspaceTable = {
  name: 'workspaces',
  fields: ['name', 'widgetList']
};

const BaseWidgetTable = {
  name: 'baseWidgets',
  fields: ['type', 'pos', 'workspace', 'parentList', 'parentWidget']
};

// TODO: do we actually need a 'name' field?
const WidgetListTable = {
  name: 'widgetLists',
  fields: ['name', 'parentWidget']
};

const Widget2InputsTable = defWidgetInputsTable({
  tableName: 'widget2Inputs',
  widgetNames: ['foo']
});

const Widget3InputsTable = defWidgetInputsTable({
  tableName: 'widget3Inputs',
  widgetNames: ['firstWidget', 'secondWidget']
});

const Widget4InputsTable = defWidgetInputsTable({
  tableName: 'widget4Inputs',
  widgetListNames: ['bazWidgets']
});

const TABLES = [
  WorkspaceTable, BaseWidgetTable, WidgetListTable,
  Widget2InputsTable, Widget3InputsTable, Widget4InputsTable
];


export {
  TABLES, COMMON_FIELDS,
  WorkspaceTable, BaseWidgetTable, WidgetListTable,
  Widget2InputsTable, Widget3InputsTable, Widget4InputsTable
};


function defWidgetInputsTable(opts) {
  var widgetNames = opts.widgetNames || [];
  var widgetListNames = opts.widgetListNames || [];

  var fields = COMMON_FIELDS
    .concat(['parentWidget'])
    .concat(widgetNames.map(name => `${name}Id`))
    .concat(widgetListNames.map(name => `${name}Id`));

  return {
    name: opts.tableName,
    fields: fields,
    widgetNames,
    widgetListNames
  };
}
