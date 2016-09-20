import Base from 'models/base';
import extend from 'lib/object-extend';

export default extend(Base, {
  _fields: ['name', 'data'],

  create: function(data) {
    return Base.create.call(this, data);
  },

  tableName: 'widgets',

  instance: extend(Base.instance, {})
});
