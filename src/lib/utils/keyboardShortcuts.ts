import { get } from 'svelte/store';
import { canUndo, canRedo, undo, redo } from '../../stores/historyStore';
import { selectedRows } from '../../stores/solverStore';

/**
 * Keyboard shortcut definitions for the application.
 * - Ctrl/Cmd + Z: Undo
 * - Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
 * - Escape: Deselect all rows
 */
export function setupKeyboardShortcuts(): () => void {
	/**
	 * Handles keydown events and dispatches the appropriate action.
	 * @param event - the keyboard event
	 */
	const handleKeydown = (event: KeyboardEvent): void => {
		const isMod = event.ctrlKey || event.metaKey;

		// Undo: Ctrl/Cmd + Z (without Shift)
		if (isMod && event.key === 'z' && !event.shiftKey) {
			if (get(canUndo)) {
				event.preventDefault();
				undo();
			}
			return;
		}

		// Redo: Ctrl/Cmd + Y, or Ctrl/Cmd + Shift + Z
		if ((isMod && event.key === 'y') || (isMod && event.key === 'z' && event.shiftKey)) {
			if (get(canRedo)) {
				event.preventDefault();
				redo();
			}
			return;
		}

		// Escape: Deselect rows
		if (event.key === 'Escape') {
			const sel = get(selectedRows);
			if (sel.length > 0) {
				event.preventDefault();
				selectedRows.set([]);
			}
			return;
		}
	};

	window.addEventListener('keydown', handleKeydown);

	return () => {
		window.removeEventListener('keydown', handleKeydown);
	};
}
