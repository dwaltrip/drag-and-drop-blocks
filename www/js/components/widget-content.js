import m from 'mithril';

export default function(widget, title, isInWorkspace) {
  var titleContent = isInWorkspace ?
    `${title} -- ${widget.uid()} -- ${widget.pos()}` : title;

  return [
    // m('.widget-title', titleContent),
    m('.widget-title', title),
    slotsForNestedWidget(widget)
  ];
};

function slotsForNestedWidget(widget) {
  var name = widget.name();
  if (name === 'widget1') {
    return null;
  } else if (name === 'widget3') {
    return m('.widget-slots', [
      m('.widget-slot'),
      m('.widget-slot')
    ]);
  } else if (name === 'widget4') {
    return m('.inner-widget-section');
  } else {
    return m('.widget-slot');
  }
}
