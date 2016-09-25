import m from 'mithril';
import routes from 'routes';

import { default as db, setupDB } from 'db';

// setup DB
setupDB(db);

console.log('==== starting app! ====');
// start app
m.route(document.getElementById('app'), '/', routes);
