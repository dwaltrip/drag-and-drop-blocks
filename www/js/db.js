import { TABLES, COMMON_FIELDS } from 'models/db-schema';

// 'localStorageDB' is a global from a vendor lib
var db = localStorageDB('mainDB');
setupDB(db);

export default db;

function setupDB(db) {

  // for debugging
  window.db = db;

  Object.keys(TABLES).forEach(tableName => {
    var modelFields = COMMON_FIELDS.concat(TABLES[tableName].fields);

    var tableNeedsToBeSetup = db.isNew() || !db.tableExists(tableName);

    if (tableNeedsToBeSetup) {
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
  });
}
