<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import { D3Graph } from '$lib/api/d3graph';

	let cy; // This will hold the Cytoscape instance
	let container: HTMLElement;

	const layoutConfig = {
		name: 'cose',
		animate: true,
		animationEasing: 'ease-out',
		animationDuration: 500,
		idealEdgeLength: 100,
		nodeOverlap: 20,
		refresh: 20,
		fit: true,
		padding: 30,
		randomize: false,
		componentSpacing: 100,
		nodeRepulsion: 400000,
		edgeElasticity: 100,
		nestingFactor: 5,
		gravity: 80,
		numIter: 1000,
		initialTemp: 200,
		coolingFactor: 0.95,
		minTemp: 1.0
	};

	onMount(async () => {
		const d3Graph = new D3Graph(
			'https://circles-rpc.circlesubi.id/',
			'0xde374ece6fa50e781e81aac78e811b33d16912c7'
		);
		const initialData = await d3Graph.prepareDataForVisNetwork();

		// Transform nodes and edges to the format expected by Cytoscape.js
		const elements = initialData.nodes.map(node => ({
			data: { id: node.id, label: node.label, image: node.image }
		})).concat(initialData.edges.map(edge => ({
			data: { id: edge.id, source: edge.from, target: edge.to }
		})));

		cy = cytoscape({
			container,
			elements,
			style: [
				{
					selector: 'node',
					style: {
						'background-color': '#6AAFFF',
						'label': 'data(label)',
						'border-color': '#406897',
						'border-width': 4,
						'width': 30,
						'height': 30,
						'background-image': 'data(image)',
						'background-fit': 'cover',
						'text-valign': 'center',
						'text-halign': 'center',
						'font-size': '10px',
						'color': 'black'
					}
				},
				{
					selector: 'edge',
					style: {
						'width': 3,
						'line-color': '#d3d3d3',
						'target-arrow-color': '#d3d3d3',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier'
					}
				}
			],
			layout: layoutConfig
		});

		cy.on('tap', 'node', async function(event) {
			const nodeId = event.target.id();
			await expandNode(nodeId, d3Graph);
		});
	});

	async function expandNode(nodeId: string, d3Graph: D3Graph) {
		const { nodes: newNodes, edges: newEdges } = await d3Graph.fetchDataForNode(nodeId);
		const elementsToAdd = newNodes.filter(node => cy.getElementById(node.id).length === 0)
			.map(node => ({ group: 'nodes', data: { id: node.id, label: node.label, image: node.image } }))
			.concat(newEdges.filter(edge => cy.getElementById(edge.id).length === 0)
				.map(edge => ({ group: 'edges', data: { id: edge.id, source: edge.from, target: edge.to } })));

		cy.add(elementsToAdd);
		applyLayout();
	}

	function applyLayout() {
		cy.layout(layoutConfig).run();
	}
</script>

<div bind:this={container} class="w-full h-full"></div>
