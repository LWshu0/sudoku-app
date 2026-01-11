// Lightweight Command Manager implementing Command pattern
export function createCommandManager(limit = 500) {
    const undoStack = [];
    const redoStack = [];

    function execute(doFn, undoFn) {
        // perform action
        doFn();
        // push to undo stack
        undoStack.push({ doFn, undoFn });
        // clear redo
        redoStack.length = 0;
        if (undoStack.length > limit) undoStack.shift();
    }

    function undo() {
        const cmd = undoStack.pop();
        if (!cmd) return;
        try {
            cmd.undoFn();
            redoStack.push(cmd);
        } catch (e) {
            console.error('commandManager undo failed', e);
        }
    }

    function redo() {
        const cmd = redoStack.pop();
        if (!cmd) return;
        try {
            cmd.doFn();
            undoStack.push(cmd);
        } catch (e) {
            console.error('commandManager redo failed', e);
        }
    }

    function clear() {
        undoStack.length = 0;
        redoStack.length = 0;
    }

    return { execute, undo, redo, clear };
}
