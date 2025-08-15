<div class="grid-layout">
	<slot />
</div>

<style>
	/*.grid-layout {*/
	/*    padding: 2rem;*/
	/*    display: grid;*/
	/*    grid-template-columns: 2fr 1fr;*/
	/*    grid-gap: 1rem;*/
	/*    width: 100%;*/
	/*    max-width: 1920px;*/
	/*    height: 100vh;*/
	/*    margin: 0 auto;*/
	/*}*/

	/*@media screen and (max-width: 950px) {*/
	/*    .grid-layout {*/
	/*        grid-template-columns: none;*/
	/*        grid-template-rows: repeat(2, 1fr);*/
	/*        height: auto;*/
	/*    }*/
	/*}*/

	.grid-layout {
		padding: 1rem;
		display: flex;
		width: 100%;
		max-width: 1920px;
		height: 100vh;
		margin: 0 auto;
		gap: 1rem;
	}

	@media screen and (max-width: 950px) {
		.grid-layout {
			flex-direction: column;
			height: auto;
			padding: 0.5rem;
		}
	}
</style>
