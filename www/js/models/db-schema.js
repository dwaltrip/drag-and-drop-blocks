import { mapValues } from 'lib/utils';

const WIDGET_INPUTS = {
  widget2: defInputsTable({
    name: 'widget2Inputs',
    widgetNames: ['foo']
  }),
  widget3: defInputsTable({
    name: 'widget3Inputs',
    widgetNames: ['firstWidget', 'secondWidget']
  }),
  widget4: defInputsTable({
    name: 'widget4Inputs',
    widgetListNames: ['bazWidgets']
  }),
  widget5: defInputsTable({
    name: 'widget5Inputs',
    widgetListNames: ['list1', 'list2']
  }),
};

var TABLE_FIELDS = {
  workspaces:     ['name', 'widgetList'],
  baseWidgets:    ['type', 'pos', 'workspace', 'parentList', 'parentWidget'],
  // TODO: not sure if widgetLists needs 'name'
  widgetLists:    ['name', 'parentWidget'],
  widget2Inputs:  WIDGET_INPUTS.widget2.fields,
  widget3Inputs:  WIDGET_INPUTS.widget3.fields,
  widget4Inputs:  WIDGET_INPUTS.widget4.fields,
  widget5Inputs:  WIDGET_INPUTS.widget5.fields
};

var TABLES = mapValues(TABLE_FIELDS, (name, fields)=> new Object({ name, fields }));
const COMMON_FIELDS = ['uid'];

export { TABLES, WIDGET_INPUTS, COMMON_FIELDS };


function defInputsTable(opts) {
  var widgetNames = opts.widgetNames || [];
  var widgetListNames = opts.widgetListNames || [];
  var fields = concatAll(
    ['parentWidget'],
    widgetNames.map(name => `${name}Id`),
    widgetListNames.map(name => `${name}Id`)
  );
  return { name: opts.name, widgetNames, widgetListNames, fields };
}

function concatAll() {
  return Array.prototype.reduce.call(arguments, (memo, array) => {
    return memo.concat(array);
  }, []);
}
