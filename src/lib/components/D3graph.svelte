<script lang="ts">
	import { D3Graph } from '$lib/api/d3graph';
	import { onMount } from 'svelte';
	import type { Data, Options, Network } from 'vis-network';

	let network: Network;
	let container: HTMLElement;
	let nodes: any[] = []; // Initialize nodes array
	let edges: any[] = []; // Initialize edges array

	onMount(async () => {
		const vis = await import('vis-network/standalone/esm/vis-network');

		const d3Graph = new D3Graph(
			'https://circles-rpc.circlesubi.id/',
			'0xde374ece6fa50e781e81aac78e811b33d16912c7'
		);
		const initialData = await d3Graph.prepareDataForVisNetwork();
		nodes = initialData.nodes; // Set initial nodes
		edges = initialData.edges; // Set initial edges

		const data: Data = {
			nodes: nodes,
			edges: edges
		};

		const options: Options = {
			nodes: {
				borderWidth: 4,
				size: 30,
				color: {
					border: '#406897',
					background: '#6AAFFF'
				},
				font: { color: 'black' },
				shapeProperties: {
					useBorderWithImage: true
				}
			},
			edges: {
				color: 'lightgray'
			}
		};

		if (container) {
			network = new vis.Network(container, data, options);
			network.on('click', async (params) => {
				if (params.nodes.length > 0) {
					const nodeId = params.nodes[0]; // Get the clicked node ID
					await expandNode(nodeId, d3Graph);
				}
			});
		}
	});

	async function expandNode(nodeId: string, d3Graph: D3Graph) {
		const { nodes: newNodes, edges: newEdges } = await d3Graph.fetchDataForNode(nodeId);

		// Merge nodes, avoiding duplicates
		const nodeIds = new Set(nodes.map((node) => node.id));
		newNodes.forEach((newNode) => {
			if (!nodeIds.has(newNode.id)) {
				nodes.push(newNode);
				nodeIds.add(newNode.id);
			}
		});

		// Merge edges, avoiding duplicates
		const edgeKeys = new Set(edges.map((edge) => `${edge.from}-${edge.to}`));
		newEdges.forEach((newEdge) => {
			const edgeKey = `${newEdge.from}-${newEdge.to}`;
			if (!edgeKeys.has(edgeKey)) {
				edges.push(newEdge);
				edgeKeys.add(edgeKey);
			}
		});

		// Update the network
		network.setData({ nodes, edges });
	}
</script>

<div bind:this={container} class="w-full h-full"></div>
