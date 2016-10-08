import m from 'mithril';

export default function(widget, title, isInWorkspace) {
  var titleContent = isInWorkspace ?
    `${title} -- ${widget.uid()} -- ${widget.pos()}` : title;

  return [
    m('.widget-title', titleContent),
    slotsForNestedWidget(widget)
  ];
};

function slotsForNestedWidget(widget) {
  if (widget.name() === 'widget1') {
    return null;
  } else if (widget.name() === 'widget3') {
    return m('.widget-slots', [
      m('.widget-slot'),
      m('.widget-slot')
    ]);
  } else {
    return m('.widget-slot');
  }
}
