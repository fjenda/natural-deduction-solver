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
		gap: var(--spacing-sm);
		align-items: center;
	}

	.action-button {
		width: 2.25rem;
		aspect-ratio: 1;
		padding: var(--spacing-sm);
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--button-bg);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.action-button:disabled {
		cursor: not-allowed;
		opacity: 0.4;
	}

	.action-button:not(:disabled):hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.action-button:not(:disabled):active {
		transform: translateY(0);
	}

	.check-button:hover:not(:disabled) {
		color: var(--success);
		border-color: var(--success);
		background: var(--success-bg);
	}

	.delete-button:hover:not(:disabled) {
		color: var(--error);
		border-color: var(--error);
		background: var(--error-bg);
	}

	.edit-button:hover:not(:disabled) {
		color: var(--warning);
		border-color: var(--warning);
		background: var(--warning-bg);
	}

	button {
		font-size: 0.7em;
	}

	@media screen and (max-width: 950px) {
		.actions-container {
			justify-content: flex-end;
			width: 100%;
		}
	}
</style>
