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
		{label} ▾
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
		opacity: 0.5;
		pointer-events: none;
	}

	.dropdown button {
		padding: 0.45rem 0.7rem;
		font-size: 0.8em;
	}

	.menu {
		position: absolute;
		top: 100%;
		right: 0;
		background: var(--background);
		list-style: none;
		margin: 0;
		padding: 0.25rem 0;
		border-radius: 0.25rem;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		z-index: 10;
	}

	.menu li {
		margin: 0;
	}

	.menu button {
		width: 100%;
		padding: 0.5rem 1rem;
		text-align: left;
		background: none;
		border: none;
		color: var(--text-primary);
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--button-hover);
	}
</style>
