<script lang="ts">
	export let variant: 'fullwidth' | 'small' = 'fullwidth';
</script>

<div class="wrapper {variant}">
	<div class="content">
		<slot />
	</div>
</div>

<style>
	.wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		/*height: 100%;*/
		overflow: hidden;
		background-color: rgba(42, 42, 42, 0.225);
		border-radius: 0.5rem;
		border: 1px solid var(--dark-border-color);
	}

	@media (prefers-color-scheme: light) {
		.wrapper {
			background-color: rgba(249, 249, 249, 0.25);
			border: 1px solid var(--light-border-color);
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 1rem;
		flex: 1;
		align-items: center;
		border-radius: 0.5rem;
		padding: 1.5rem;
		text-align: center;
	}

	.fullwidth {
		width: 100%;
	}

	.small {
		max-width: 600px;
	}

	@media screen and (max-width: 950px) {
		.small {
			/*width: 100%;*/
			max-width: none;
		}

		.content {
			padding: 0.5rem;
			gap: 0.5rem;
		}
	}
</style>
