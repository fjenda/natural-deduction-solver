<script lang="ts" generics="T">
	import { onDestroy, onMount } from 'svelte';

	interface DropdownProps<T> {
		label: string;
		options: T[];
		onSelect: (option: T) => void;
		disabled?: boolean;
	}

	let { label, options, onSelect, disabled = false }: DropdownProps<T> = $props();
	let open = $state(false);

	let dropdownRef: HTMLDivElement;

	const handleClickOutside = (event: MouseEvent) => {
		if (open && dropdownRef && !dropdownRef.contains(event.target as Node)) {
			open = false;
		}
	};

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="dropdown" bind:this={dropdownRef} class:disabled>
	<button onclick={() => (open = !open)} aria-label="Toggle Dropdown" title="Toggle Dropdown">
		{label}
		<i class:open class="fa-solid fa-chevron-down chevron"></i>
	</button>

	{#if open}
		<ul class="menu">
			{#each options as option, i (option + '-' + i)}
				<li>
					<button
						onclick={() => {
							onSelect(option);
							open = false;
						}}>{option}</button
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown.disabled button {
		opacity: 0.4;
		pointer-events: none;
	}

	.dropdown button {
		padding: 0.45rem 0.85rem;
		font-size: 0.85rem;
		border-radius: var(--radius-md);
		background: var(--button-bg);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.chevron {
		transition: transform var(--transition-fast);
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.dropdown button:hover:not(:disabled) {
		background: var(--button-hover);
		border-color: var(--accent);
		color: var(--accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.dropdown button:hover:not(:disabled) .chevron {
		color: var(--accent);
	}

	.dropdown button:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px var(--surface),
			0 0 0 5px var(--accent);
	}

	.menu {
		position: absolute;
		top: calc(100% + var(--spacing-sm));
		right: 0;
		background: var(--surface);
		list-style: none;
		margin: 0;
		padding: var(--spacing-xs) 0;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
		z-index: 10;
		min-width: 160px;
		animation: slideDown var(--transition-fast) ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.menu li {
		margin: 0;
	}

	.menu button {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-lg);
		text-align: left;
		background: none;
		border: none;
		border-radius: 0;
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-weight: 400;
		box-shadow: none;
		transform: none;
	}

	.menu button:hover {
		background: var(--accent-subtle);
		color: var(--accent);
	}

	.menu button:focus-visible {
		outline: none;
		background: var(--accent-subtle);
		color: var(--accent);
		box-shadow: none;
	}
</style>
