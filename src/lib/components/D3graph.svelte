<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import { D3Graph } from '$lib/api/d3graph';

	let cy: cytoscape.Core | undefined;
	let container: HTMLElement | null = null;
	let clickTimeout: ReturnType<typeof setTimeout> | null = null;
	const clickDelay = 200; // 200 ms delay to differentiate single from double click
	const expandedNodes = new Set<string>(); // Tracks expanded nodes

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

		const elements = initialData.nodes.map(node => ({
			data: { id: node.id, label: node.label, image: node.image }
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
			toggleNodeExpansion(nodeId, d3Graph);
		});

	});

	async function toggleNodeExpansion(nodeId: string, d3Graph: D3Graph) {
		if (nodeShouldExpand(nodeId)) {
			await expandNode(nodeId, d3Graph); // Implement or ensure this is defined
		} else {
			// collapseNode(nodeId);
		}
	}

	function nodeShouldExpand(nodeId: string): boolean {
		return !expandedNodes.has(nodeId);
	}

	function selectNode(nodeId: string) {
		console.log(`Node selected: ${nodeId}`);
	}

	async function expandNode(nodeId: string, d3Graph: D3Graph) {
		// Assuming you need to fetch additional data for the node or related nodes
		// from your D3Graph instance and then add these to the cytoscape instance.
		try {
			const additionalData = await d3Graph.fetchDataForNode(nodeId);

			// Transform the additional data to Cytoscape's expected format
			const newElements = additionalData.nodes.map(node => ({
				data: { id: node.id, label: node.label, image: node.image }
			})).concat(additionalData.edges.map(edge => ({
				data: { id: edge.id, source: edge.from, target: edge.to }
			})));

			// Add the new elements to the cytoscape instance
			cy.add(newElements);

			// Optionally, mark the node as expanded to avoid re-expansion
			expandedNodes.add(nodeId);

			// Re-apply the layout to accommodate the new elements
			applyLayout();
		} catch (error) {
			console.error('Failed to expand node:', error);
		}
	}

	function collapseNode(nodeId: string) {
		const connectedEdges = cy!.edges(`[source = "${nodeId}"], [target = "${nodeId}"]`);
		const connectedNodes = connectedEdges.connectedNodes().subtract(cy!.$(`#${nodeId}`));

		connectedEdges.remove();
		connectedNodes.forEach(node => {
			if (node.connectedEdges().length === 0) {
				node.remove();
			}
		});
	}

	function applyLayout() {
		// After initializing your graph with the elements
		cy!.nodes().forEach(node => {
			node.data('degree', node.degree());
		});

		cy.layout(layoutConfig).run();
	}
</script>

<div bind:this={container} class="w-full h-full"></div>
