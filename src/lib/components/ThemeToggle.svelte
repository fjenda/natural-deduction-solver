<script lang="ts">
	let isDarkMode = $state(false);

	// system preference
	const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
	isDarkMode = prefersDarkScheme.matches;
	updateDarkModeClass();

	prefersDarkScheme.addEventListener('change', (e) => {
		isDarkMode = e.matches;
		updateDarkModeClass();
	});

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		updateDarkModeClass();
	}

	function updateDarkModeClass() {
		document.documentElement.classList.toggle('dark-mode', isDarkMode);
	}
</script>

<button onclick={toggleDarkMode} aria-label="Toggle Dark Mode" title="Toggle Dark Mode">
	{#if isDarkMode}
		<i class="fas fa-sun"></i>
	{:else}
		<i class="fas fa-moon"></i>
	{/if}
</button>

<style>
	button {
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: 1rem;
		border-radius: var(--radius-md);
		background: var(--button-bg);
		border: 1px solid var(--border);
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	button:hover {
		background: var(--button-hover);
		border-color: var(--accent);
		color: var(--accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	button:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px var(--surface),
			0 0 0 5px var(--accent);
	}

	button:active {
		transform: translateY(0);
	}
</style>
