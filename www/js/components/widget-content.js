import m from 'mithril';

export default function(lookupWidgetComponent) {

  function slotsForNestedWidget(widget) {
    var type = widget.type();
    if (type === 'widget1') {
      return null;
    } else if (type === 'widget3') {
      return m('.widget-slots', [
        m('.widget-slot'),
        m('.widget-slot')
      ]);
    } else if (type === 'widget4') {
      return m('.inner-widget-section');
    } else {
      var fooWidget = widget.getInput('foo-input');
      return widgetSlot(fooWidget);
    }
  }

  function widgetSlot(widget) {
    var slotContent = widget ? m(lookupWidgetComponent(widget.type()), {
      widget,
      // uh we dont have all the shit we need. see line 119 of components/home.js
      // *********
    }) : null;

    return m('.widget-slot', slotContent);
  }

  return function(widget, title, isInWorkspace) {
    var titleContent = isInWorkspace ?
      `${title} -- ${widget.uid()} -- ${widget.pos()}` : title;

    return [
      // m('.widget-title', titleContent),
      m('.widget-title', title),
      slotsForNestedWidget(widget)
    ];
  };
};
