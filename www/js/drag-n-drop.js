import dnd from 'finesse-dnd';
import m from 'mithril';
import { mithril as mithrilWrapper } from 'finesse-dnd/wrappers'

window.dnd = mithrilWrapper(dnd.create(), m);

export default window.dnd;
