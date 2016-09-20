import Widget from 'models/widget';

// 'localStorageDB' is a global from a vendor lib
var DB = localStorageDB('mainDB');

function setupDB(db) {
  var dbNeedsToBeSetup = db.isNew() || db.tableCount() === 0;

  // for debugging
  window.db = db;

  var modelFields = Widget.getFields();
  var tableName = Widget.tableName;

  if (dbNeedsToBeSetup) {
    console.log(`-- creating table ${tableName} with columns "${modelFields.join(', ')}"`);
    db.createTable(tableName, modelFields);
    db.commit();
  } else {
    var dbFields = db.tableFields(tableName);

    var newFields = modelFields.filter(field => {
      return dbFields.indexOf(field) < 0;
    });
    var unusedFields = dbFields.filter(field => {
      return field.toLowerCase() !== 'id' && modelFields.indexOf(field) < 0;
    });

    newFields.forEach(field => {
      console.log(`-- adding column "${field}"" to table ${tableName}`);
      db.alterTable(tableName, field);
      db.commit();
    });
    if (unusedFields.length > 0) {
      var msg = [
        `-- The columns "${unusedFields.join(', ')}" found in DB table '${tableName}'`,
        `are NOT specified by the model.`
      ];
      console.log(msg.join(' '));
    }
  }
}

export { DB as default, setupDB };
