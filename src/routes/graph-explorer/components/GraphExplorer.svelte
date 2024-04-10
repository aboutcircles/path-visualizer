<script lang="ts">
	import cytoscape from 'cytoscape';
	import Controls from './Controls.svelte';
	import NodeList from './NodeList.svelte';
	import Graph from './Graph.svelte';

	let cy: cytoscape.Core | undefined;
	let addNodeAddress: string = '0xde374ece6fa50e781e81aac78e811b33d16912c7';
	let pathFromAddress: string = '';
	let pathToAddress: string = '';
	let commonFriendsString: string = '0xde374ece6fa50e781e81aac78e811b33d16912c7, 0x3cb406Def33aeD0ABD6D02a75FEdCa8e2E8D1A2e';
	let nodeList: NodeList | undefined;
	let graph: Graph | undefined;
</script>

<div class="main-container">
	<div class="node-list-pane">
		<NodeList cy={cy} bind:this={nodeList} />
	</div>
	<div class="resize-grip"></div>
	<div class="graph-container">
		<Controls
			bind:addNodeAddress={addNodeAddress}
			bind:commonFriendsString={commonFriendsString}
			bind:pathFromAddress={pathFromAddress}
			bind:pathToAddress={pathToAddress}
			onAddNode={() => graph?.addNode(addNodeAddress, nodeList)}
			onAddPath={() => graph?.addPath(pathFromAddress, pathToAddress, nodeList)}
			onCommonFriends={() => graph?.commonFriends(commonFriendsString, nodeList)}
		/>
		<Graph nodeList={nodeList} bind:cy={cy} bind:this={graph} />
	</div>
</div>

<style>
    .main-container {
        display: flex;
        height: 100%; /* Adjust if necessary */
    }

    .node-list-pane {
        width: 250px; /* Starting width, adjust as needed */
        background-color: #f0f0f0; /* Light gray, adjust as needed */
        overflow-y: auto; /* Enables scrolling for long lists */
    }

    .resize-grip {
        cursor: ew-resize;
        background-color: #ccc; /* Light gray, adjust as needed */
        width: 10px; /* Adjust grip width as needed */
    }

    .graph-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }
</style>