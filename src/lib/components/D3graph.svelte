<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import { D3Graph } from '$lib/api/d3graph';

	let cy: cytoscape.Core | undefined;
	let container: HTMLElement | null = null;
	const expandedNodes = new Set<string>();

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
		componentSpacing: 200,
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
		const initialData = await d3Graph.fetchDataForNode('0xde374ece6fa50e781e81aac78e811b33d16912c7');

		const elements = initialData.nodes.map(node => ({
			data: { id: node.id, label: node.label, image: node.image, addedAt: Date.now() }
		})).concat(initialData.edges.map(edge => ({
			data: { id: edge.id, source: edge.from, target: edge.to }
		})));

		cy = cytoscape({
			container: container!,
			elements,
			style: [
				{
					selector: 'node',
					style: {
						'background-color': '#6AAFFF',
						'label': 'data(label)',
						'border-color': '#406897',
						'border-width': 4,
						'width': 'mapData(degree, 1, 10, 20, 50)', // Example mapping, adjust 1, 10 to your actual min/max degrees
						'height': 'mapData(degree, 1, 10, 20, 50)', // Same here
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

		cy.on('tap', 'node', function(event) {
			const nodeId = event.target.id();
			// Reset the addedAt timestamp to keep recently used items in the graph
			event.target.data('addedAt', Date.now());
			toggleNodeExpansion(nodeId, d3Graph);
		});

	});

	async function toggleNodeExpansion(nodeId: string, d3Graph: D3Graph) {
		if (nodeShouldExpand(nodeId)) {
			await expandNode(nodeId, d3Graph);
		} else {
			collapseNode(nodeId);
		}
	}

	function nodeShouldExpand(nodeId: string): boolean {
		return !expandedNodes.has(nodeId);
	}

	async function expandNode(nodeId: string, d3Graph: D3Graph) {
		try {
			const additionalData = await d3Graph.fetchDataForNode(nodeId);
			let newElements = additionalData.nodes
				.map(node => ({
					data: { id: node.id, label: node.label, image: node.image, addedAt: Date.now() }
				}))
				.concat(additionalData.edges.map(edge => ({
					data: { id: edge.id, source: edge.from, target: edge.to }
				})));

			// Efficiently filter out all 'newElements' that already exist in the graph
			const existingNodes = new Set(cy.nodes().map(node => node.id()));
			const existingEdges = new Set(cy.edges().map(edge => edge.id()));
			newElements = newElements.filter(element =>
				!existingNodes.has(element.data.id)
				&& !existingEdges.has(element.data.id)
			);

			cy.add(newElements);

			// Remove all self references
			cy.edges().forEach(edge => {
				if (edge.source().id() === edge.target().id()) {
					edge.remove();
				}
			});

			expandedNodes.add(nodeId);

			applyLayout();
		} catch (error) {
			console.error('Failed to expand node:', error);
		}
	}

	function applyLayout() {
		cy!.nodes().forEach(node => {
			node.data('degree', node.degree());
		});

		cy.layout(layoutConfig).run();
	}

	function collapseNode(nodeId: string) {
		const collapsingNode = cy.getElementById(nodeId);
		const collapsingNodeNeighbours = collapsingNode.neighborhood().nodes();

		collapsingNodeNeighbours.forEach(neighbor => {
			const connectedEdges = neighbor.connectedEdges(edge => edge.source().id() !== nodeId && edge.target().id() !== nodeId);
			if (connectedEdges.length == 0) {
				if (neighbor == collapsingNode) {
					return;
				}
				neighbor.remove();
			}
		});

		expandedNodes.delete(nodeId);
		applyLayout();
	}

</script>

<div bind:this={container} class="w-full h-full"></div>
