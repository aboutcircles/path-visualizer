<svelte:options accessors />

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { pathVisualizerStore, type PathVisualizerState } from '../../../stores/pathVisualizer';
	import { ethers } from 'ethers';

	export let cy: cytoscape.Core;
	export let selectedNodes = new Set<string>();

	export let refresh = () => {
		setNodeList();
		highlightNodes();
	};

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

	let filteredNodes: cytoscape.NodeCollection = [];
	let searchText: string = '';

	export function resetFilteredNodes() {
		searchText = '';
		filteredNodes.remove();
		setNodeList();
	}

	export function truncateAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function setNodeList() {
		filteredNodes =
			cy?.nodes().filter((node) => {
				if (searchText === '') return true;
				const label = node.data().label.toLowerCase();
				const id = node.data().id.toLowerCase();
				return label.includes(searchText.toLowerCase()) || id.includes(searchText.toLowerCase());
			}) ?? [];

		// Sort all nodes with picture and label first, then all with labels, and finally all with ids
		filteredNodes = filteredNodes.sort((a, b) => {
			const aHasLabel = !ethers.isAddress(a.data().label);
			const bHasLabel = !ethers.isAddress(b.data().label);
			const aHasImage = a.data().image !== './default.png';
			const bHasImage = b.data().image !== './default.png';

			if (aHasImage && !bHasImage) return -1;
			if (!aHasImage && bHasImage) return 1;
			if (aHasLabel && !bHasLabel) return -1;
			if (!aHasLabel && bHasLabel) return 1;
			return 0;
		});
	}

	function toggleNodeSelect(id: string) {
		if (selectedNodes.has(id)) {
			selectedNodes.delete(id);
		} else {
			selectedNodes.add(id);
		}
		selectedNodes = new Set(selectedNodes);
		highlightNodes(cy, selectedNodes);
	}

	export function highlightNodes() {
		// Reset styles for all nodes and edges
		cy.nodes().style({
			'background-color': '#6AAFFF',
			'border-color': '#406897'
		});
		cy.edges().style({
			'line-color': '#d3d3d3',
			width: 3,
			'target-arrow-color': '#d3d3d3'
		});

		// Apply styles for selected nodes and their neighbors
		selectedNodes.forEach((nodeId) => {
			const node = cy.getElementById(nodeId);
			const neighbors = node.neighborhood().nodes();

			node.style({
				'background-color': '#DF6552', // Highlight color for selected nodes
				'border-color': '#DF6552' // Highlight border color for selected nodes
			});

			neighbors.style({
				'background-color': '#DF6552', // Different color for neighbor nodes
				'border-color': '#DF6552'
			});

			node.connectedEdges().style({
				'line-color': '#DF6552', // Highlight color for edges connected to selected nodes
				width: 5,
				'target-arrow-color': '#DF6552'
			});
		});
	}
</script>

<div class="relative h-full">
	<div
		id="sidebar"
		class="bg-white p-4 rounded-xl shadow-2xl h-full z-20 transition-transform duration-300 transform absolute"
		class:translate-x-0={pathVisualizerState.isSidebarOpen}
		class:-translate-x-full={!pathVisualizerState.isSidebarOpen}
		style="width: 320px; left: 0; top: 0;"
	>
		<div class="flex flex-col h-full">
			<div class="flex flex-col gap-3 p-3 w-full">
				<h1 class="text-lg font-bold">Search</h1>
				<label for="address-input" class="font-medium">Search for people in this graph:</label>
				<input
					class="p-2 border border-gray-300 rounded-md"
					id="address-input"
					type="text"
					placeholder="Enter a username or address"
					bind:value={searchText}
					on:input={() => setNodeList()}
				/>
			</div>
			<p class="gap-3 p-3">Select someone to locate them in the generated graph</p>
			<ul class="overflow-auto p-0 mx-4" style="flex-grow: 1;">
				{#each filteredNodes as node}
					<li
						class="flex border-b-2 items-center px-5 py-2 {selectedNodes.has(node.data().id)
							? 'bg-yellow-100 border-yellow-300'
							: 'bg-white'} hover:bg-gray-200 cursor-pointer"
						on:click={() => toggleNodeSelect(node.data().id)}
						title={node.data().id}
					>
						<img
							class="w-10 h-10 rounded-full mr-3"
							src={node.data().image}
							alt={node.data().label}
						/>
						<span class="text-sm font-medium text-gray-700">
							{ethers.isAddress(node.data().label)
								? truncateAddress(node.data().label)
								: node.data().label}
						</span>
					</li>
				{/each}
			</ul>
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

	.bg-yellow-100 {
		background-color: #ffdabe;
	}
	.border-yellow-300 {
		border-color: #df6552;
	}
</style>
