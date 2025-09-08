<script lang="ts">
	import { PrettySyntaxer } from '../parsers/PrettySyntaxer';

	interface MathMLViewerProps {
		value?: string;
	}

	let { value = '' }: MathMLViewerProps = $props();

	const mathml = $derived(PrettySyntaxer.toMathML(value ?? ''));
</script>

<div class="mathml-viewer">
	{@html mathml}
</div>

<style>
	.mathml-viewer {
		display: flex;
		align-items: center;
		height: 100%;
		padding: 1rem 0.5rem;
		justify-content: center;
		font-size: 1.35rem;
	}

	@media screen and (max-width: 950px) {
		.mathml-viewer {
			padding: 0.5rem;
		}
	}
</style>
