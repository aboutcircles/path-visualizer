<svelte:options accessors />

<script lang="ts">
	import { ethers } from 'ethers';

	export let cy: cytoscape.Core;
	export let selectedNodes = new Set<string>();

	export let refresh = () => {
		setNodeList();
		highlightNodes();
	};

	let filteredNodes: cytoscape.NodeCollection = [];
	let searchText: string = '';

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
		selectedNodes = selectedNodes;
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
				'background-color': '#FFFFAA', // Highlight color for selected nodes
				'border-color': '#FFD700' // Highlight border color for selected nodes
			});

			neighbors.style({
				'background-color': '#FFFFAA', // Different color for neighbor nodes
				'border-color': '#FFD700'
			});

			node.connectedEdges().style({
				'line-color': '#FFD700', // Highlight color for edges connected to selected nodes
				width: 5,
				'target-arrow-color': '#FFD700'
			});
		});
	}
</script>

<div>
	<div class="flex items-center gap-3 p-3 bg-gray-100 w-full px-5">
		<label class="pr-2" for="address-input">Search:</label>
		<input
			class="flex-grow p-2 border border-gray-300 rounded w-full"
			id="address-input"
			type="text"
			placeholder="username or address"
			bind:value={searchText}
			on:input={() => setNodeList()}
		/>
	</div>
	<ul class="max-h-full p-0 m-0">
		{#each filteredNodes as node}
			<li
				class="flex items-center mb-3 {selectedNodes.has(node.data().id) ? 'bg-white' : ''}"
				on:click={() => toggleNodeSelect(node.data().id)}
				style="cursor: pointer;"
				title={node.data().id}
			>
				<img class="w-8 h-8 rounded-full mr-2" src={node.data().image} />
				{ethers.isAddress(node.data().label)
					? truncateAddress(node.data().label)
					: node.data().label}
			</li>
		{/each}
	</ul>
</div>
