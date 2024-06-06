<script lang="ts">
	export let isLoading: boolean;
</script>

{#if isLoading}
	<div
		class="fixed inset-0 bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm flex flex-col items-center justify-center z-50"
	>
		<div class="text-white text-center mb-4 p-6">
			Calculating path... This may take a while depending on its complexity. Please be patient.
		</div>
		<div class="pulsing-loader"></div>
	</div>
{/if}

<style>
	.pulsing-loader {
		border-radius: 50%;
		width: 10rem;
		height: 10rem;
		background-color: rgba(255, 255, 255, 0.5);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
		}
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
		}
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
		}
	}
</style>
