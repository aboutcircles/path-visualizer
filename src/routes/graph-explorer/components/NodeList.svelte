<svelte:options accessors/>
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
		filteredNodes = cy?.nodes().filter(node => {
			if (searchText === '') return true;
			const label = node.data().label.toLowerCase();
			const id = node.data().id.toLowerCase();
			return label.includes(searchText.toLowerCase()) || id.includes(searchText.toLowerCase());
		}) ?? [];

		// Sort all nodes with picture and label first, then all with labels, and finally all with ids
		filteredNodes = filteredNodes.sort((a, b) => {
			const aHasLabel = !ethers.isAddress(a.data().label);
			const bHasLabel = !ethers.isAddress(b.data().label);
			const aHasImage = a.data().image !== 'https://example.com/path/to/default/avatar.png';
			const bHasImage = b.data().image !== 'https://example.com/path/to/default/avatar.png';

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
			'width': 3,
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
				'width': 5,
				'target-arrow-color': '#FFD700'
			});
		});
	}
</script>

<div class="node-list-pane">
	<div class="input-area">
		<label for="address-input">Search:</label>
		<input
			id="address-input"
			type="text"
			placeholder="username or address"
			bind:value={searchText}
			on:input={() => setNodeList()}
		/>
	</div>
	<ul>
		{#each filteredNodes as node}
			<li
				on:click={() => toggleNodeSelect(node.data().id)}
				style="cursor: pointer;"
				class:selected={selectedNodes.has(node.data().id)}
				title={node.data().id}
			>
				<img
					src={node.data().image || "/default.png"}
					style="width: 30px; height: 30px; border-radius: 15px; margin-right: 10px;"
				/>
				{ethers.isAddress(node.data().label)
					? truncateAddress(node.data().label)
					: node.data().label}
			</li>
		{/each}
	</ul>
</div>

<style>
    .node-list-pane {
        width: 250px;
        background-color: #f0f0f0;
        overflow-y: auto;
    }

    .input-area {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background-color: #f5f5f5;
        width: calc(100% - 20px);
    }

    .input-area label {
        margin-right: 8px;
    }

    .input-area input {
        flex-grow: 1;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ccc;
        width: auto;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }

    img {
        flex-shrink: 0;
        margin-right: 10px;
    }

    .selected {
        background-color: #fff;
    }
</style>