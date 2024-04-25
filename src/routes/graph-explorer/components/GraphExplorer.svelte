<script lang="ts">
	import cytoscape from 'cytoscape';
	import Controls from './Controls.svelte';
	import NodeList from './NodeList.svelte';
	import Graph from './Graph.svelte';

	let cy: cytoscape.Core | undefined;
	let addNodeAddress: string = '0xde374ece6fa50e781e81aac78e811b33d16912c7';
	let pathFromAddress: string = '';
	let pathToAddress: string = '';
	// let commonFriendsString: string =
	// 	'0xde374ece6fa50e781e81aac78e811b33d16912c7, 0x3cb406Def33aeD0ABD6D02a75FEdCa8e2E8D1A2e';
	let nodeList: NodeList | undefined;
	let graph: Graph | undefined;

	const resetAll = () => {
		nodeList?.resetFilteredNodes();
		cy?.elements().remove();
		cy?.reset();
	};
</script>

<div class="flex h-full w-full gap-6">
	<!-- Sidebar: NodeList -->
	<div class="overflow-auto rounded-xl w-1/6 h-full">
		<NodeList {cy} bind:this={nodeList} />
	</div>

	<!-- Right section: Controls and Graph -->
	<div class="flex flex-col flex-grow rounded-xl gap-4">
		<!-- Controls -->
		<div class="bg-white rounded-xl shadow">
			<Controls
				bind:addNodeAddress
				bind:pathFromAddress
				bind:pathToAddress
				onAddNode={() => graph?.addNode(addNodeAddress, nodeList)}
				onAddPath={() => graph?.addPath(pathFromAddress, pathToAddress, nodeList)}
				onGenerate={() => graph?.generateGraph()}
				onReset={() => resetAll()}
			/>
		</div>

		<!-- Graph -->
		<div class="flex-grow bg-white rounded-xl shadow overflow-auto">
			<Graph {nodeList} bind:cy bind:this={graph} />
		</div>
	</div>
</div>
