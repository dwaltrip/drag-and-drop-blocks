import m from 'mithril';
import routes from 'routes';

import { default as db, setupDB } from 'db';

// setup DB
setupDB(db);

// start app
m.route(document.getElementById('app'), '/', routes);
