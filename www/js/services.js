import UndoServiceFactory from 'services/undo-service';
import Workspace from 'models/workspace';

// bootstrap the Workspace table
if (Workspace.query().length === 0) {
  Workspace.create({ name: 'test workspace' });
}

var UndoService = UndoServiceFactory.create({
  workspace: Workspace.query()[0]
});

export { UndoService };
