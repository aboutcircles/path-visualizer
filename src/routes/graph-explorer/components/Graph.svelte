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
	import { isExpandClicked } from '../../../stores/isExpanded';

	cytoscape.use(dagre);
	cytoscape.use(coseBilkent);

	export let cy: cytoscape.Core | undefined = undefined;
	export let nodeList: NodeList | undefined = undefined;
	export let graphData: { nodes: Node[]; edges: Edge[] };
	export let useDagreLayout: boolean = false;

	let elements: { data: { image: string; addedAt: number; id: string; label: string } }[] = [];
	let expandedNodes: Writable<Set<string>> = writable(new Set<string>());
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
		initGraph(useDagreLayout ? dagreLayout : coseLayout);

		if (typeof window !== 'undefined') {
			isExpandClicked.subscribe((expandClicked) => {
				if (expandClicked && !useDagreLayout) {
					cy.on('tap', 'node', async function (evt) {
						const nodeId = evt.target.id();
						await toggleNodeExpansion(nodeId, nodeList);
					});
				} else {
					cy.removeListener('tap', 'node');
				}
			});
		}
	});

	afterUpdate(() => {
		if (graphData && cy) {
			initializeGraphWithData(
				graphData,
				useDagreLayout ? getDagreLayout(graphData.edges) : coseLayout
			);
		}
	});

	function getDagreLayout(edges: Edge[]) {
		return {
			...dagreLayout,
			rankDir: edges.length === 0 ? 'LR' : dagreLayout.rankDir
		};
	}

	function initializeGraphWithData(graphData: { nodes: Node[]; edges: Edge[] }, layoutConfig: any) {
		const newElements = [
			...graphData.nodes.map((node) => ({
				data: { id: node.id, label: node.label, image: node.image, addedAt: Date.now() }
			})),
			...graphData.edges.map((edge) => ({
				data: { id: edge.id, label: edge.label, source: edge.from, target: edge.to }
			}))
		];

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
				'text-max-width': '100px',
				'white-space': 'pre',
				'font-size': '10px',
				label: 'data(label)',
				'border-color': '#406897',
				'border-width': 4,
				width: 'mapData(degree, 1, 10, 20, 50)',
				height: 'mapData(degree, 1, 10, 20, 50)',
				'background-image': 'data(image)',
				'background-fit': 'cover',
				'text-valign': 'bottom',
				'text-halign': 'center',
				color: 'black',
				'text-margin-y': 5,
				'text-background-color': 'lightgrey',
				'text-background-opacity': 0.7,
				'text-background-shape': 'roundrectangle',
				'text-border-width': 0
			}
		};

		if (initialLayoutConfig.name === 'dagre') {
			nodeStyle.style['text-valign'] = 'bottom';
			nodeStyle.style['text-background-color'] = 'white';
			nodeStyle.style['text-background-opacity'] = 1;
			nodeStyle.style['text-background-padding'] = '3px';
			nodeStyle.style['text-border-color'] = 'black';
			nodeStyle.style['text-border-width'] = 1;
			nodeStyle.style['text-border-opacity'] = 1;
			nodeStyle.style['text-margin-y'] = 5;
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
						'source-arrow-color': '#d3d3d3',
						'target-arrow-shape': 'none',
						'source-arrow-shape': 'triangle',
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
				},
				{
					selector: 'node:selected',
					style: {
						'border-color': '#DF6552',
						'text-background-color': '#FFDABE',
						'text-background-opacity': 1,
						'text-background-padding': '2px',
						'text-background-shape': 'roundrectangle'
					}
				}
			],
			layout: initialLayoutConfig
		});

		layoutConfig.set(initialLayoutConfig);
	}

	export function switchLayout(newLayoutConfig: any) {
		layoutConfig.set(newLayoutConfig);
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
			const existingNodes = new Set(cy.nodes().map((node) => node.id()));
			const existingEdges = new Set(cy.edges().map((edge) => edge.id()));
			newElements = newElements.filter(
				(element) => !existingNodes.has(element.data.id) && !existingEdges.has(element.data.id)
			);

			cy.add(newElements);

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
		initializeGraphWithData(graphData, getDagreLayout(graphData.edges));
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
			await collapseNode(address, false);
		}

		runLayout();
		nodeList?.refresh();
	}

	export function generateGraph() {
		cy.nodes().forEach((node) => {
			const nodeId = node.id();
			expandNode(nodeId, nodeList).catch(console.error);
		});
	}
</script>

<div id="graph" bind:this={container} class="flex-grow w-full h-full"></div>
