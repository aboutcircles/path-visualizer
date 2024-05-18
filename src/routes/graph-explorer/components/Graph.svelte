<svelte:options accessors />

<script lang="ts">
	import { ethers } from 'ethers';
	import { D3Graph } from '../../../lib/api/d3graph';
	import cytoscape from 'cytoscape';
	import dagre from 'cytoscape-dagre';
	import NodeList from './NodeList.svelte';
	import { writable, type Writable } from 'svelte/store';
	import { onMount, afterUpdate } from 'svelte';
	import type { Node, Edge } from '../../../lib/api/d3graph';
	import coseBilkent from 'cytoscape-cose-bilkent';

	cytoscape.use(dagre); // Ensure Dagre is registered outside component lifecycle
	cytoscape.use(coseBilkent);

	export let cy: cytoscape.Core | undefined = undefined;
	export let nodeList: NodeList | undefined = undefined;
	export let graphData: { nodes: Node[]; edges: Edge[] };
	export let useDagreLayout: boolean = false;

	let elements: { data: { image: string; addedAt: number; id: string; label: string } }[] = [];
	let expandedNodes: Writable<Set<string>> = writable(new Set<string>()); // Now a Svelte store for reactivity
	let layoutConfig: Writable<any> = writable(null);
	let container: HTMLDivElement;

	const d3Graph = new D3Graph();

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
		fit: true,
		padding: 30,
		animate: false,
		animationDuration: 500,
		animationEasing: 'ease-out',
		spacingFactor: 1.0,
		avoidOverlap: true,
		nodeDimensionsIncludeLabels: true,
		rankDir: 'LR',
		rankSep: 100,
		edgeSep: 50,
		nodeSep: 50,
		compound: true,
		nestingFactor: 1.2
	};

	onMount(async () => {
		initGraph(useDagreLayout ? dagreLayout : coseLayout); // Use appropriate layout based on prop
	});

	afterUpdate(() => {
		if (graphData && cy) {
			initializeGraphWithData(graphData, useDagreLayout ? dagreLayout : coseLayout);
		}
	});

	function initializeGraphWithData(graphData: { nodes: Node[]; edges: Edge[] }, layoutConfig: any) {
		const newElements = [
			...graphData.nodes.map((node) => ({
				data: { id: node.id, label: node.label, image: node.image, addedAt: Date.now() }
			})),
			...graphData.edges.map((edge) => ({
				data: { id: edge.id, label: edge.label, source: edge.from, target: edge.to }
			}))
		];

		// Clear existing elements before adding new ones
		cy.elements().remove();
		cy.add(newElements);

		runLayout(layoutConfig);
		nodeList?.refresh();
	}

	function initGraph(initialLayoutConfig: any) {
		let nodeStyle = {
			selector: 'node',
			style: {
				'background-color': '#6AAFFF',
				'text-wrap': 'wrap',
				'text-max-width': '100px', // Ensures the text wraps properly
				'white-space': 'pre', // Keeps newlines for the token details
				'font-size': '10px', // Default font size for the label
				label: 'data(label)',
				'border-color': '#406897',
				'border-width': 4,
				width: 'mapData(degree, 1, 10, 20, 50)',
				height: 'mapData(degree, 1, 10, 20, 50)',
				'background-image': 'data(image)',
				'background-fit': 'cover',
				'text-valign': 'center',
				'text-halign': 'center',
				color: 'black',
				'text-margin-y': '5px' // Adjust margin for better spacing
			}
		};

		if (initialLayoutConfig.name === 'dagre') {
			nodeStyle.style['text-background-color'] = 'white';
			nodeStyle.style['text-background-opacity'] = 1;
			nodeStyle.style['text-background-padding'] = '3px';
			nodeStyle.style['text-border-color'] = 'black';
			nodeStyle.style['text-border-width'] = 1;
			nodeStyle.style['text-border-opacity'] = 1;
			nodeStyle.style['text-margin-y'] = -20;
		}

		cy = cytoscape({
			container,
			elements,
			style: [
				nodeStyle,
				{
					selector: 'edge',
					style: {
						width: 3,
						label: 'data(label)',
						'line-color': '#d3d3d3',
						'target-arrow-color': '#d3d3d3',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier',
						'font-size': '8px',
						'text-background-color': 'white',
						'text-background-opacity': 1,
						'text-background-padding': '3px',
						'text-background-shape': 'roundrectangle',
						'text-border-color': 'black',
						'text-border-width': 1,
						'text-border-opacity': 1,
						'text-margin-y': -10,
						'text-rotation': 'autorotate',
						'text-wrap': 'wrap',
						'text-max-width': '80px'
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

	export function runLayout(layoutConfig: any = null) {
		nodeList?.refresh();
		cy!.nodes().forEach((node) => {
			node.data('degree', node.degree(true));
		});
		$: $layoutConfig ? cy.layout(layoutConfig || $layoutConfig).run() : null;
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

	export let addNodeFromJson = (graphData) => {
		initializeGraphWithData(graphData, dagreLayout); // Use dagre layout for JSON data
	};

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

	export function generateGraph() {
		console.log('Generating graph...');
		// Iterate through all nodes in the cytoscape instance
		cy.nodes().forEach((node) => {
			const nodeId = node.id(); // Assuming id is sufficient for expanding
			expandNode(nodeId, nodeList).catch(console.error); // Handle errors and expand each node
		});
	}
</script>

<div id="graph" bind:this={container} class="flex-grow w-full h-full"></div>
