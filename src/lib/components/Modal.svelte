<script lang="ts">
	import type { ButtonContent } from '../../types/ButtonContent';

	export let show: boolean;
	export let content = '';
	export let buttons: ButtonContent[] = [];
	export let header: string = 'Modal Header';

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			show = false;
		}

		switch (event.key) {
			// case 'Enter':
			//     buttons[0].action();
			//     break;
			case 'Escape':
				show = false;
				break;
		}
	}
</script>

<svelte:body on:keydown={handleKeyDown} />

<div class="modal" on:click|self={() => (show = false)} class:hidden={!show}>
	<div class="modal-content">
		<div class="modal-header">
			<h2>{header}</h2>
		</div>
		<div class="modal-body">
			{@html content}
			<slot name="body" />
		</div>
		<div class="modal-footer">
			{#each buttons as button (button.text)}
				<button class="button-footer" on:click={button.action}>{button.text}</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.modal {
		display: block;
		position: fixed;
		z-index: 100;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		overflow: auto;
		background-color: rgba(0, 0, 0, 0.4);
	}

	.modal.hidden {
		display: none;
	}

	.modal-content {
		background-color: var(--surface);
		margin: 15% auto;
		padding: 1.5rem;
		border: 1px solid var(--border);
		width: fit-content;
		max-width: 50rem;
		border-radius: 0.5rem;
	}

	.modal-header {
		text-align: center;
		color: var(--text-primary);
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.5rem;
	}

	.modal-footer {
		padding: 0.25rem 0.5rem;
		display: flex;
		gap: 1rem;
	}

	.button-footer {
		width: 100%;
		padding: 0.8rem;
		font-size: 1.2rem;
		text-wrap: nowrap;
	}
</style>
