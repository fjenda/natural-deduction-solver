<script lang="ts">
	interface RowActionsProps {
		editable: boolean;
		premise: boolean;
		removable: boolean;
		formula: string;
		ruleText: string;
		onSave: (formula: string, ruleText: string) => void;
		onEdit: () => void;
		onDelete: () => void;
	}

	let {
		editable,
		premise,
		removable,
		formula,
		ruleText,
		onSave,
		onEdit,
		onDelete
	}: RowActionsProps = $props();

	const handleSave = (e: Event) => {
		e.stopPropagation();
		onSave(formula, ruleText);
	};

	const handleEdit = (e: Event) => {
		e.stopPropagation();
		onEdit();
	};

	const handleDelete = (e: Event) => {
		e.stopPropagation();
		onDelete();
	};
</script>

<div class="actions-container">
	{#if editable}
		<button class="action-button check-button" aria-label="Save" onclick={handleSave}>
			<i class="fas fa-check"></i>
		</button>
	{:else}
		<button
			class="action-button edit-button"
			disabled={premise}
			aria-label="Edit"
			onclick={handleEdit}
		>
			<i class="fas fa-edit"></i>
		</button>
		<button
			class="action-button delete-button"
			disabled={!removable}
			aria-label="Delete"
			onclick={handleDelete}
		>
			<i class="fas fa-times"></i>
		</button>
	{/if}
</div>

<style>
	.actions-container {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.action-button {
		display: flex;
		justify-content: center;
		align-items: center;
		background: none;
		border: 1px solid var(--border);
		padding: var(--spacing-sm);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-base);
		color: var(--text-primary);
	}

	.action-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.action-button:not(:disabled):hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.action-button:not(:disabled):active {
		transform: translateY(0);
	}

	.check-button:hover:not(:disabled) {
		color: #4ade80;
		border-color: #4ade80;
		background: rgba(74, 222, 128, 0.1);
	}

	.delete-button:hover:not(:disabled) {
		color: #ef4444;
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.edit-button:hover:not(:disabled) {
		color: #facc15;
		border-color: #facc15;
		background: rgba(250, 204, 21, 0.1);
	}

	@media screen and (max-width: 950px) {
		.actions-container {
			justify-content: flex-end;
			width: 100%;
		}
	}
</style>
