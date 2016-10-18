
var COMMON_FIELDS = ['uid'];

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


const Widget2InputsTable = defWidgetInputsTable({
  tableName: 'widget2Inputs',
  widgetNames: ['foo'],
  // no widgetLists for widget2.
  // but just for example (for other widget types), do it like this:
  // widgetListNames: ['fooList']
});

const Widget3InputsTable = defWidgetInputsTable({
  tableName: 'widget3Inputs',
  widgetNames: ['firstWidget', 'secondWidget']
});

// const Widget4InputsTable = defWidgetInputsTable({
//   tableName: 'widget4Inputs',
//   widgetListNames: ['bazList']
// });
const Widget4InputsTable = {
  name: 'widget4Inputs',
  fields: ['parentWidget', 'bazWidgetListId']
};


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
