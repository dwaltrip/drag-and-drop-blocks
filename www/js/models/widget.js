import Base from 'models/base';
import extend from 'lib/object-extend';

import { TABLES } from 'models/db-schema';

const WidgetNames = {
  WIDGET1: 'widget1',
  WIDGET2: 'widget2',
  WIDGET3: 'widget3',
}

var Widget = extend(Base, {
  _fields: TABLES.Widget.fields,

  NAMES: WidgetNames,

  create: function(data) {
    var instance = Base.create.call(this, data);
    return instance;
  },

  tableName: TABLES.Widget.name,

  instance: extend(Base.instance, {
    save: function() {
      this.class.maxPos = Math.max(this.class.maxPos, this.pos());
      return Base.instance.save.apply(this, arguments);
    }
  })
});

Widget.maxPos = Math.max.apply(Math, [0].concat(Widget.query().map(widget => widget.pos)));

export { Widget as default, WidgetNames };
