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
		gap: 0.5rem;
		align-items: center;
		/*flex-grow: 0;*/
	}

	.action-button {
		display: flex;
		justify-content: center;
		align-items: center;
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
	}

	.action-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.check-button:hover:not(:disabled) {
		color: #00ff00;
	}

	.delete-button:hover:not(:disabled) {
		color: #ff0000;
	}

	.edit-button:hover:not(:disabled) {
		color: #ffcc00;
	}

	@media screen and (max-width: 950px) {
		.actions-container {
			justify-content: flex-end;
			width: 100%;
		}
	}
</style>
