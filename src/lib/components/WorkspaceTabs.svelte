<script lang="ts">
	import {
		workspaces,
		activeWorkspaceIndex,
		switchWorkspace,
		createWorkspace,
		deleteWorkspace,
		renameWorkspace
	} from '../../stores/workspaceStore';

	let renamingIndex = $state<number | null>(null);
	let renameValue = $state('');
	let renameInput = $state<HTMLInputElement | null>(null);

	/**
	 * Switches to the workspace at the given index.
	 * @param index - the workspace index to switch to
	 */
	const handleSwitch = (index: number) => {
		if (renamingIndex !== null) return;
		switchWorkspace(index);
	};

	/**
	 * Creates a new workspace tab.
	 */
	const handleCreate = () => {
		createWorkspace();
	};

	/**
	 * Deletes a workspace tab. Prevents deleting the last one.
	 * @param index - the workspace index to delete
	 * @param event - the click event
	 */
	const handleDelete = (index: number, event: MouseEvent) => {
		event.stopPropagation();
		deleteWorkspace(index);
	};

	/**
	 * Starts renaming a workspace tab. Focuses the input after render.
	 * @param index - the workspace index to rename
	 * @param currentName - the current name
	 * @param event - the click event
	 */
	const startRename = (index: number, currentName: string, event: MouseEvent) => {
		event.stopPropagation();
		renamingIndex = index;
		renameValue = currentName;
		requestAnimationFrame(() => {
			if (renameInput) {
				renameInput.focus();
				renameInput.select();
			}
		});
	};

	/**
	 * Commits the rename. If empty, reverts to the original name.
	 * @param index - the workspace index
	 */
	const commitRename = (index: number) => {
		if (renameValue.trim()) {
			renameWorkspace(index, renameValue.trim());
		}
		renamingIndex = null;
	};

	/**
	 * Handles keydown in the rename input.
	 * Enter commits, Escape cancels.
	 * @param index - the workspace index
	 * @param event - the keyboard event
	 */
	const handleRenameKeydown = (index: number, event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitRename(index);
		} else if (event.key === 'Escape') {
			renamingIndex = null;
		}
	};

	/**
	 * Returns the display label for a tab.
	 * @param name - the full workspace name
	 * @param index - the workspace index
	 * @returns A display label string.
	 */
	const tabLabel = (name: string, index: number): string => {
		if (!name) return `Problem ${index + 1}`;
		return name;
	};

	/**
	 * Counts how many proof rows a workspace has (for a progress indicator).
	 */
	const proofCount = (ws: (typeof $workspaces)[0]): number => {
		return ws.solution.proof.length;
	};
</script>

<div class="workspace-tabs">
	<div class="tabs-scroll">
		{#each $workspaces as ws, i (ws.id)}
			<button
				class="tab"
				class:active={i === $activeWorkspaceIndex}
				class:solving={ws.isSolving}
				onclick={() => handleSwitch(i)}
				title={ws.name}
			>
				{#if renamingIndex === i}
					<input
						class="rename-input"
						type="text"
						bind:value={renameValue}
						bind:this={renameInput}
						onblur={() => commitRename(i)}
						onkeydown={(e) => handleRenameKeydown(i, e)}
						onclick={(e) => e.stopPropagation()}
						size={Math.max(renameValue.length + 1, 8)}
					/>
				{:else}
					<span class="tab-icon" class:active={i === $activeWorkspaceIndex}>
						{#if ws.isSolving}
							<i class="fas fa-flask"></i>
						{:else if ws.solution.premises.some((p) => p.value)}
							<i class="fas fa-diagram-project"></i>
						{:else}
							<i class="fas fa-file"></i>
						{/if}
					</span>
					<span class="tab-label">{tabLabel(ws.name, i)}</span>
					{#if ws.isSolving}
						<span class="step-count">{proofCount(ws)} steps</span>
					{/if}
					{#if i === $activeWorkspaceIndex}
						<div class="tab-actions">
							<a
								class="tab-action"
								onclick={(e) => startRename(i, ws.name, e)}
								title="Rename"
								aria-label="Rename workspace"
							>
								<i class="fas fa-pen fa-xs"></i>
							</a>
							{#if $workspaces.length > 1}
								<a
									class="tab-action delete"
									onclick={(e) => handleDelete(i, e)}
									title="Close"
									aria-label="Delete workspace"
								>
									<i class="fas fa-xmark fa-xs"></i>
								</a>
							{/if}
						</div>
					{/if}
				{/if}
			</button>
		{/each}
	</div>
	<button class="tab add-tab" onclick={handleCreate} title="New workspace">
		<i class="fas fa-plus"></i>
	</button>
</div>

<style>
	.workspace-tabs {
		display: flex;
		align-items: stretch;
		background: var(--surface);
		border: 1px solid var(--border);
		border-bottom: none;
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		overflow: hidden;
		min-height: 2.5rem;
		flex-shrink: 0;
	}

	.tabs-scroll {
		display: flex;
		flex: 1;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
	}

	.tabs-scroll::-webkit-scrollbar {
		height: 2px;
	}

	.tabs-scroll::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 2px;
	}

	.tab {
		display: flex;
		align-items: center;
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-right: 1px solid var(--border);
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.85rem;
		cursor: pointer;
		white-space: nowrap;
		transition: all var(--transition-base);
		position: relative;
		min-width: 0;
		flex-shrink: 0;
		gap: var(--spacing-xs);
	}

	.tab:hover {
		color: var(--text-primary);
		background: var(--background);
	}

	.tab.active {
		color: var(--text-primary);
		border-bottom-color: var(--accent);
		background: var(--background);
	}

	.tab.solving:not(.active) {
		border-bottom-color: var(--warning);
	}

	.tab-icon {
		font-size: 0.75rem;
		color: var(--text-secondary);
		opacity: 0.6;
		width: 1rem;
		text-align: center;
		flex-shrink: 0;
	}

	.tab-icon.active {
		color: var(--accent);
		opacity: 1;
	}

	.tab-label {
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.3;
	}

	.step-count {
		font-size: 0.7rem;
		color: var(--text-secondary);
		background: var(--button-bg);
		padding: 1px 6px;
		border-radius: 10px;
		flex-shrink: 0;
	}

	.tab-actions {
		display: flex;
		align-items: center;
		gap: 2px;
		margin-left: var(--spacing-xs);
		opacity: 0.7;
	}

	.tab-actions:hover {
		opacity: 1;
	}

	.tab-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.4rem;
		height: 1.4rem;
		padding: 0;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.tab-action:hover {
		color: var(--accent);
		background: var(--button-hover);
	}

	.tab-action.delete:hover {
		color: var(--error);
		background: var(--error-bg);
	}

	.rename-input {
		font-size: 0.85rem;
		padding: 3px 8px;
		border: 1px solid var(--accent);
		border-radius: var(--radius-sm);
		background: var(--background);
		color: var(--text-primary);
		outline: none;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
		min-width: 80px;
		max-width: 220px;
	}

	.rename-input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
	}

	.add-tab {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.8rem;
		flex-shrink: 0;
		transition: all var(--transition-base);
		opacity: 0.6;
		box-shadow: none;
	}

	.add-tab:hover {
		color: var(--accent);
		opacity: 1;
		background: var(--background);
	}
</style>
