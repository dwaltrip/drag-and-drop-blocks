
import Widget from 'models/widget';

// this is for use on Widget[N]Inputs instances (where N=1,2,3,4,etc)
export function buildWidgetGetter(propName) {
  return function() {
    return this[propName]() ? Widget.findByUID(this[propName]()) : null;
  };
};

// this is for use on Widget subclass instances
export function buildInputWidgetCreator(propName) {
  return function(type) {
    var widget = Widget.create({
      type,
      parentWidget: this.uid(),
      workspace: this.workspace()
    });
    this.inputs[propName](widget.uid());
    this.inputs.save();
    return widget;
  };
}
