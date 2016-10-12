import m from 'mithril';

import addIdentityMap from 'models/add-identity-map';
import DB from 'db';
import extend from 'lib/object-extend';
import { randBase64String, isUndefOrNull } from 'lib/utils';
import helpers from 'lib/mithril-helpers';


var Base = {
  _fields: [],

  create: function(data) {
    var instance = Object.create(this.instance);
    instance.class = this;
    instance.setFields(data || {});

    // NOTE: I just added this. So far, we never create a new record without saving it.
    // Not sure if that assumption will always be true.
    if (instance.isNew()) { instance.save(); }
    return instance;
  },

  getFields: function() {
    return this._fields.concat(['uid']);
  },

  tableName: null,

  transforms: {},

  // the method call 'create' is perhaps confusing here & in methods below
  // we call 'create' in app code to create 'new' model records (not yet in DB)
  // yet here we call it to instantiate existing model records pulled from DB
  query: function(params) {
    // It would be nice if we could do some error checking here
    // and throw an error if you try to query against a non-existent field
    return DB.queryAll.call(DB, this.tableName, params).map(function(record) {
      return this.create(record);
    }.bind(this));
  },

  queryUIDs: function(uids) {
    return this.query({ query: row => uids.indexOf(row.uid) > -1 });
  },

  count: function() {
    return DB.rowCount(this.tableName);
  },

  deleteAll: function() {
    DB.truncate(this.tableName);
    return DB.commit();
  },

  findByUID: function(uid) {
    var record = this._fetchTableRow(uid);
    if (record) {
      return this.create(record);
    }
  },

  // use length 4 for UID. 64^4 is enough for this clientside only app
  generateUID: function() {
    var uid = randBase64String(4);
    while (this.findByUID(uid)) {
      uid = randBase64String(4);
    }
    return uid;
  },

  _fetchTableRow: function(uid) {
    return DB.queryAll(this.tableName, { query: { uid: uid } })[0];
  },

  instance: {
    save: function(params) {
      if (this.isNew()) {
        this.uid = helpers.readOnlyProp(m.prop(this.class.generateUID()));
      }

      DB.insertOrUpdate(this.class.tableName, { uid: this.uid() }, this.toJSON());
      if (!params || (params && !params.isBatch)) {
        DB.commit();
      }
    },

    delete: function(params) {
      DB.deleteRows(this.class.tableName, { uid: this.uid() });
      if (!params || (params && !params.isBatch)) {
        DB.commit();
      }
    },

    revert: function() {
      var jsonFromDB = this.class._fetchTableRow(this.uid());
      this.setFields(jsonFromDB);
    },

    setFields: function(data) {
      this.class._fields.forEach(field => {
        if (field in data) {
          var val = data[field];

          if (field in this.class.transforms) {
            this[field] = m.prop(this.class.transforms[field].deserialize(val));
          } else {
            this[field] = m.prop(val);
          }
        } else {
          this[field] = m.prop(null);
        }
      });
      this.uid = helpers.readOnlyProp(m.prop(data.uid || null));
    },

    toJSON: function() {
      var self = this;
      var transforms = this.class.transforms;

      var json =  this.class._fields.reduce(function(memo, field) {
        if (field in transforms) {
          memo[field] = transforms[field].serialize(self[field]());
        } else {
          memo[field] = self[field]();
        }
        return memo;
      }, {});
      json.uid = this.uid();
      return json;
    },

    isNew: function() {
      return isUndefOrNull(this.uid());
    }
  }
};

function extendBaseModel(Model, params) {
  Model.instance = extend(Base.instance, Model.instance);
  Model = extend(Base, Model);
  return addIdentityMap(Model);
}

export { Base, extendBaseModel };
