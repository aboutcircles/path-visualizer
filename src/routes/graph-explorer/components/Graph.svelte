<svelte:options accessors />

<script lang="ts">
	import { ethers } from 'ethers';
	import { D3Graph } from '../../../lib/api/d3graph';
	import cytoscape from 'cytoscape';
	import dagre from 'cytoscape-dagre';
	import NodeList from './NodeList.svelte';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	cytoscape.use(dagre); // Ensure Dagre is registered outside component lifecycle

	export let cy: cytoscape.Core;
	export let nodeList: NodeList | undefined;

	let elements: { data: { image: string; addedAt: number; id: string; label: string } }[] = [];
	let expandedNodes = writable(new Set<string>()); // Now a Svelte store for reactivity
	let layoutConfig = writable<any>(null);
	let container: HTMLDivElement;

	const d3Graph = new D3Graph(
		'https://circles-rpc.circlesubi.id/',
		'0xde374ece6fa50e781e81aac78e811b33d16912c7'
	);

	const coseLayout = {
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

	const dagreLayout = {
		name: 'dagre',
		fit: true, // Whether to fit to viewport
		padding: 30, // Padding on fit
		animate: true, // Whether to transition the node positions
		animationDuration: 500, // Duration of animation in milliseconds
		animationEasing: 'ease-out', // Easing of animation
		spacingFactor: 1.0, // Positive spacing factor increases spacing between nodes ( >1 ), a negative factor decreases spacing ( <1 )
		avoidOverlap: true, // Prevents node overlap, may overflow boundingBox if not enough space
		nodeDimensionsIncludeLabels: true, // Excludes the label when calculating node bounding boxes for the layout algorithm
		rankDir: 'LR', // 'TB' for top to bottom flow, 'LR' for left to right,
		rankSep: 100, // the separation between each rank in the layout
		edgeSep: 50, // the separation between each edge in the layout
		nodeSep: 50 // the separation between each node in the layout
	};

	onMount(() => {
		cytoscape.use(dagre);
		initGraph(coseLayout);
	});

	function initGraph(initialLayoutConfig: any) {
		cy = cytoscape({
			container,
			elements,
			style: [
				{
					selector: 'node',
					style: {
						'background-color': '#6AAFFF',
						label: 'data(label)',
						'border-color': '#406897',
						'border-width': 4,
						width: 'mapData(degree, 1, 10, 20, 50)',
						height: 'mapData(degree, 1, 10, 20, 50)',
						'background-image': 'data(image)',
						'background-fit': 'cover',
						'text-valign': 'center',
						'text-halign': 'center',
						'font-size': '10px',
						color: 'black'
					}
				},
				{
					selector: 'edge',
					style: {
						width: 3,
						'line-color': '#d3d3d3',
						'target-arrow-color': '#d3d3d3',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier'
					}
				}
			],
			layout: initialLayoutConfig
		});

		layoutConfig.set(initialLayoutConfig); // Set initial layout config

		cy.on('tap', 'node', async function (evt) {
			const nodeId = evt.target.id();
			await toggleNodeExpansion(nodeId, nodeList);
		});
	}

	export function switchLayout(newLayoutConfig: any) {
		layoutConfig.set(newLayoutConfig); // Switch layout configuration reactively
	}

	export function runLayout() {
		nodeList?.refresh();
		cy!.nodes().forEach((node) => {
			node.data('degree', node.degree(true));
		});
		$: $layoutConfig ? cy.layout($layoutConfig).run() : null;
	}

	async function toggleNodeExpansion(nodeId: string, nodeList: NodeList | undefined) {
		let shouldExpand;
		expandedNodes.update((current) => {
			shouldExpand = !current.has(nodeId);
			if (shouldExpand) {
				current.add(nodeId);
			} else {
				current.delete(nodeId);
			}
			return current;
		});
		if (shouldExpand) {
			await expandNode(nodeId, nodeList);
		} else {
			collapseNode(nodeId, nodeList);
		}
	}

	async function expandNode(nodeId: string, nodeList: NodeList | undefined, performLayout = true) {
		try {
			const address = ethers.getAddress(nodeId);
			const additionalData = await d3Graph.fetchDataForNode(address);
			let newElements = [
				...additionalData.nodes.map((node) => ({
					data: { id: node.id, label: node.label, image: node.image, addedAt: Date.now() }
				})),
				...additionalData.edges.map((edge) => ({
					data: { id: edge.id, source: edge.from, target: edge.to }
				}))
			];
			// Efficiently filter out all 'newElements' that already exist in the graph
			const existingNodes = new Set(cy.nodes().map((node) => node.id()));
			const existingEdges = new Set(cy.edges().map((edge) => edge.id()));
			newElements = newElements.filter(
				(element) => !existingNodes.has(element.data.id) && !existingEdges.has(element.data.id)
			);

			cy.add(newElements);

			// Remove all self references
			cy.edges().forEach((edge) => {
				if (edge.source().id() === edge.target().id()) {
					edge.remove();
				}
			});

			if (performLayout) runLayout();

			nodeList?.refresh();
		} catch (error) {
			console.error('Failed to expand node:', error);
		}
	}

	function collapseNode(nodeId: string, performLayout = true) {
		try {
			const collapsingNode = cy.getElementById(nodeId);
			const collapsingNodeNeighbours = collapsingNode.neighborhood().nodes();
			collapsingNodeNeighbours.forEach((neighbor) => {
				const connectedEdges = neighbor.connectedEdges(
					(edge) => edge.source().id() !== nodeId && edge.target().id() !== nodeId
				);
				if (connectedEdges.length == 0) {
					if (neighbor == collapsingNode) {
						return;
					}
					neighbor.remove();
				}
			});

			if (performLayout) runLayout();

			nodeList?.refresh();
		} catch (error) {
			console.error('Failed to collapse node:', error);
		}
	}

	export async function addNode(addNodeAddress: string, nodeList: NodeList | undefined) {
		addNodeAddress = addNodeAddress.toLowerCase();
		try {
			const address = ethers.getAddress(addNodeAddress);
			const additionalData = await d3Graph.fetchDataForNode(address);
			let newElements = additionalData.nodes
				.map((node) => ({
					data: { id: node.id, label: node.label, image: node.image, addedAt: Date.now() }
				}))
				.concat(
					additionalData.edges.map((edge) => ({
						data: { id: edge.id, source: edge.from, target: edge.to }
					}))
				);

			// Only keep the 'addNodeAddress' node
			newElements = newElements.filter((element) => element.data.id === addNodeAddress);

			cy.add(newElements);

			runLayout();
			nodeList?.refresh();
		} catch (error) {
			console.error('Failed to add node:', error);
		}
	}

	export async function addPath(
		pathFromAddress: string,
		pathToAddress: string,
		nodeList: NodeList | undefined
	) {
		pathFromAddress = pathFromAddress.toLowerCase();
		pathToAddress = pathToAddress.toLowerCase();

		const nodesAndEdges = await d3Graph.fetchPathData(pathFromAddress, pathToAddress);

		const nodeElements = nodesAndEdges.nodes.map((node) => ({
			data: { id: node.id, label: node.label, image: node.image, addedAt: Date.now() }
		}));

		const edgeElements = nodesAndEdges.edges.map((edge) => ({
			data: { id: edge.id, source: edge.from, target: edge.to }
		}));

		cy.add([...nodeElements, ...edgeElements]);

		switchLayout(dagreLayout);
		runLayout();

		nodeList?.refresh();
	}

	export async function commonFriends(commonFriendsString: string, nodeList: NodeList | undefined) {
		const addresses = commonFriendsString.split(',').map((address) => address.trim().toLowerCase());
		for (const address of addresses) {
			await expandNode(address, nodeList, false);
		}
		for (const address of addresses) {
			// TODO: Not all nodes collapse correctly
			await collapseNode(address, false);
		}

		runLayout();
		nodeList?.refresh();
	}
</script>

<div id="graph" bind:this={container} class="flex-grow w-full bg-gray-200"></div>
