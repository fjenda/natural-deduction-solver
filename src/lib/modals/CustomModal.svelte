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
	<div {id} {...rest} role="dialog" aria-modal="true" class="modal" onclick={handleClose}>
		<div class="contents">
			<div class="header">
				<h2>{title}</h2>
			</div>
			<div class="body" class:has-body={body}>
				{@render body?.()}
			</div>
			<div class="footer" class:has-body={body}>
				{@render buttons?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal {
		display: flex;
		align-items: center;
		justify-content: center;
		position: fixed;
		z-index: 100;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		padding: var(--spacing-lg);
		overflow: auto;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		animation: fadeIn var(--transition-base);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.contents {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		background-color: var(--surface);
		padding: var(--spacing-xl);
		border: 1px solid var(--border);
		/*width: min(52rem, calc(100vw - 2 * var(--spacing-lg)));*/
		max-height: min(88vh, 52rem);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-xl);
		animation: slideUp var(--transition-slow);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.header {
		position: sticky;
		top: 0;
		background: var(--surface);
		z-index: 1;
		text-align: center;
		color: var(--text-primary);
		margin-bottom: var(--spacing-lg);
	}

	.header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		min-height: 0;
		overflow: auto;
	}

	.body.has-body {
		padding: var(--spacing-md) 0;
		margin-bottom: var(--spacing-lg);
	}

	.footer {
		position: sticky;
		bottom: 0;
		background: var(--surface);
		z-index: 1;
	}

	.footer.has-body {
		padding: var(--spacing-md) 0 0 0;
		border-top: 1px solid var(--border);
	}

	:global(.footer button) {
		width: 100%;
		padding: var(--spacing-md) var(--spacing-lg);
		font-size: 1rem;
		text-wrap: nowrap;
		margin-top: var(--spacing-md);
	}

	:global(.footer button:first-child) {
		margin-top: 0;
	}

	:global(.footer div) {
		display: flex;
		gap: var(--spacing-md);
	}

	:global(.footer div button) {
		flex: 1;
		margin: 0;
		padding: var(--spacing-md) var(--spacing-lg);
	}

	@media (max-width: 760px) {
		.modal {
			padding: var(--spacing-md);
		}

		.contents {
			padding: var(--spacing-lg);
			width: min(100%, 100vw - 2 * var(--spacing-md));
			max-height: 92vh;
		}
	}
</style>
