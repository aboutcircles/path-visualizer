<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { pathVisualizerStore, type PathVisualizerState } from '../../../stores/pathVisualizer';
	import RecentTransactions from './RecentTransactions.svelte';

	export let generateChartFromLogs;

	let pathVisualizerState: PathVisualizerState;
	const unsubscribe = pathVisualizerStore.subscribe((value) => {
		pathVisualizerState = value;
	});

	const handleClickOutside = (event: MouseEvent) => {
		if (typeof document !== 'undefined') {
			const sidebarElement = document.getElementById('sidebar');
			const notchElement = document.getElementById('notch');
			if (
				sidebarElement &&
				!sidebarElement.contains(event.target as Node) &&
				notchElement &&
				!notchElement.contains(event.target as Node)
			) {
				pathVisualizerStore.update((state) => ({ ...state, isSidebarOpen: false }));
			}
		}
	};

	onMount(() => {
		if (typeof document !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
		}
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('click', handleClickOutside);
		}
		unsubscribe();
	});
</script>

<div class="relative h-full">
	<div
		id="sidebar"
		class="bg-white p-4 rounded-xl shadow-2xl h-full z-20 transition-transform duration-300 transform absolute"
		class:translate-x-0={pathVisualizerState.isSidebarOpen}
		class:-translate-x-full={!pathVisualizerState.isSidebarOpen}
		style="width: 320px; left: 0; top: 0;"
	>
		<h2 class="text-xl font-bold">Recent Transactions</h2>
		<div class="h-full overflow-auto">
			<RecentTransactions {generateChartFromLogs} />
		</div>
	</div>
	<div
		id="notch"
		class="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 z-30"
		style="left: {pathVisualizerState.isSidebarOpen ? '320px' : '0px'};"
	>
		<div
			class="notch bg-blue-600 rounded-full w-2 h-16 cursor-pointer"
			on:click={() =>
				pathVisualizerStore.update((state) => ({ ...state, isSidebarOpen: !state.isSidebarOpen }))}
		></div>
	</div>
</div>

<style>
	.translate-x-0 {
		transform: translateX(0);
	}

	.-translate-x-full {
		transform: translateX(-100%);
	}
</style>
