import m from 'mithril';
import db from 'db';
import routes from 'routes';


console.log('==== starting app! ====');
// start app
m.route(document.getElementById('app'), '/', routes);
