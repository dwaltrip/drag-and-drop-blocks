import m from 'mithril';
import db from 'db';
import routes from 'routes';

import Workspace from 'models/Workspace';

// bootstrap the Workspace table
if (Workspace.query().length === 0) {
  Workspace.create({ name: 'test workspace' });
}

// for debugging only
import Inspector from 'app-state-inspector';
// Inspector.mount();
window.Inspector = Inspector;

// start app
m.route(document.getElementById('app'), '/', routes);
