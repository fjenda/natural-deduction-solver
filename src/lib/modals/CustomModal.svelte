<script lang="ts">
	import type { ModalProps } from 'svelte-modals';
	import type { Snippet } from 'svelte';

	export interface CustomModalProps extends ModalProps {
		title: string;
		body?: Snippet;
		buttons?: Snippet;
	}

	const { id, isOpen, close, title, body, buttons, ...rest }: CustomModalProps = $props();

	const handleClose = (e: Event) => {
		if (e.currentTarget === e.target) {
			e.preventDefault();
			close();
		}
	};
</script>

{#if isOpen}
	<div {id} {...rest} role="dialog" class="modal" onclick={handleClose}>
		<div class="contents">
			<div class="header">
				<h2>{title}</h2>
			</div>
			<div class="body">
				{@render body?.()}
			</div>
			<div class="footer">
				{@render buttons?.()}
			</div>
		</div>
	</div>
{/if}

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

	.contents {
		background-color: var(--surface);
		margin: 5% auto;
		padding: 1.5rem;
		border: 1px solid var(--border);
		width: fit-content;
		max-width: 50rem;
		border-radius: 0.5rem;
	}

	.header {
		text-align: center;
		color: var(--text-primary);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.5rem;
	}

	.footer {
		padding: 0.25rem 0.5rem;
	}

	:global(.footer button) {
		width: 100%;
		padding: 0.8rem;
		font-size: 1.2rem;
		text-wrap: nowrap;
	}

	:global(.footer div) {
		display: flex;
		gap: 1rem;
	}
</style>
