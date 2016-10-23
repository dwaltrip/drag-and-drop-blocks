import m from 'mithril';

function widgetLayout(content, opts) {
  var opts = opts || {};
  var widgetRowElemStr = '.widget-row' + (opts.widgetRowClasses || '')
  var widgetElemStr = '.widget' + (opts.widgetClasses || '');

  return m(widgetRowElemStr, { key: opts.key }, [
    m(widgetElemStr, { config: opts.dragItemConfig || null }, [
      m('.widget-content', content),
      opts.dropzoneConfig ? m('.widget-attach-area', {
        config: opts.dropzoneConfig
        }, m('.widget-attach-point')
      ) : null
    ])
  ]);
}

function widgetSlotLayout(content, opts) {
  var opts = opts || {};
  return m('.widget-slot' + (opts.cssClasses || ''), {
    key: opts.key || null,
    config: opts.config || null
  }, content);
};

function widgetListLayout(content, opts) {
  var opts = opts || {};
  return m('.nested-widget-list' + (opts.cssClasses || ''), {
    config: opts.config
  }, content);
}

export { widgetLayout, widgetSlotLayout, widgetListLayout };
