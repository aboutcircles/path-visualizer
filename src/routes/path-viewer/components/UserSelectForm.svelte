<script lang="ts">
	import { pathVisualizerStore, type PathVisualizerState } from '../../../stores/pathVisualizer';
	import UserSelect from '$lib/components/UserSelect.svelte';
	import { onDestroy } from 'svelte';

	export let handleSubmit: () => void;
	export let resetForm: () => void;

	let isGenerateDisabled = true;

	let pathVisualizerState: PathVisualizerState;
	const unsubscribe = pathVisualizerStore.subscribe((value) => {
		pathVisualizerState = value;
	});

	$: {
		const { fromUsername, toUsername, ethValue } = pathVisualizerState;
		isGenerateDisabled = !fromUsername || !toUsername || ethValue === 0;
	}

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="bg-white p-4 rounded-xl shadow transition-all duration-300">
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-2xl font-bold">Circles Garden</h2>
	</div>
	<div class="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-end md:gap-4">
		{#if pathVisualizerState.isUserSelectOpen || !window.matchMedia('(max-width: 768px)').matches}
			<div class="flex-1">
				<UserSelect
					label="Path from"
					bind:bindValue={pathVisualizerState.fromAddress}
					bind:bindUsername={pathVisualizerState.fromUsername}
					bind:bindUserAvatar={pathVisualizerState.fromUserAvatar}
					placeholder="From Address"
					inputType="from"
				/>
			</div>
			<div class="flex-1">
				<UserSelect
					label="Path to"
					bind:bindValue={pathVisualizerState.toAddress}
					bind:bindUsername={pathVisualizerState.toUsername}
					bind:bindUserAvatar={pathVisualizerState.toUserAvatar}
					placeholder="To Address"
					inputType="to"
				/>
			</div>
		{/if}
		<div class="flex-1">
			<label for="ethValue" class="block text-sm font-medium text-gray-700">Value:</label>
			<input
				id="ethValue"
				type="range"
				min="0"
				max="10000"
				step="1"
				bind:value={pathVisualizerState.ethValue}
				class="mt-1 block w-full bg-gray-50"
			/>
			<div class="text-xs text-gray-700 mt-1">
				Circles: {pathVisualizerState.ethValue}
			</div>
		</div>
		<div class="flex space-x-2">
			<button
				type="submit"
				class="bg-blue-600 border-2 border-blue-600 font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
				disabled={isGenerateDisabled}
				on:click={handleSubmit}
			>
				Generate
			</button>
			<button
				type="reset"
				class="bg-white border-2 border-blue-600 font-bold rounded-full text-blue-600 px-6 py-2 hover:bg-gray-100 transition duration-300 ease-in-out"
				on:click={resetForm}
			>
				Reset
			</button>
		</div>
	</div>
</div>
