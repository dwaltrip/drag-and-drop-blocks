import Base from 'models/base';
import extend from 'lib/object-extend';

var Widget = extend(Base, {
  _fields: ['name', 'data', 'pos'],

  create: function(data) {
    var instance = Base.create.call(this, data);
    return instance;
  },

  tableName: 'widgets',

  instance: extend(Base.instance, {
    save: function() {
      this.class.maxPos = Math.max(this.class.maxPos, this.pos());
      return Base.instance.save.apply(this, arguments);
    }
  })
});

Widget.maxPos = Math.max.apply(Math, Widget.query().map(widget => widget.pos()));

export default Widget;
