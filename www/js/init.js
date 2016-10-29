import m from 'mithril';
import db from 'db';
import routes from 'routes';

// for debugging only
import Inspector from 'app-state-inspector';
// Inspector.mount();
window.Inspector = Inspector;

// start app
m.route(document.getElementById('app'), '/', routes);
