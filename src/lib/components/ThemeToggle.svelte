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
		padding: 0.45rem 0.7rem;
		font-size: 0.8em;
	}
</style>
