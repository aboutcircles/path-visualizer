<script lang="ts">
	import cytoscape from 'cytoscape';
	import Controls from './Controls.svelte';
	import NodeList from './NodeList.svelte';
	import Graph from './Graph.svelte';

	let cy: cytoscape.Core | undefined;
	let addNodeAddress: string = '0xde374ece6fa50e781e81aac78e811b33d16912c7';
	let pathFromAddress: string = '';
	let pathToAddress: string = '';
	let commonFriendsString: string =
		'0xde374ece6fa50e781e81aac78e811b33d16912c7, 0x3cb406Def33aeD0ABD6D02a75FEdCa8e2E8D1A2e';
	let nodeList: NodeList | undefined;
	let graph: Graph | undefined;
</script>

<div class="flex h-full w-full">
	<div class="node-list-pane overflow-auto bg-gray-100">
		<NodeList {cy} bind:this={nodeList} />
	</div>
	<div class="cursor-ew-resize bg-gray-300 w-3"></div>
	<div class="flex flex-grow flex-col">
		<Controls
			bind:addNodeAddress
			bind:commonFriendsString
			bind:pathFromAddress
			bind:pathToAddress
			onAddNode={() => graph?.addNode(addNodeAddress, nodeList)}
			onAddPath={() => graph?.addPath(pathFromAddress, pathToAddress, nodeList)}
			onCommonFriends={() => graph?.commonFriends(commonFriendsString, nodeList)}
		/>
		<Graph {nodeList} bind:cy bind:this={graph} />
	</div>
</div>
