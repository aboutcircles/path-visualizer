<script lang="ts">
	export let addNodeAddress: string;
	export let pathFromAddress: string;
	export let pathToAddress: string;
	export let commonFriendsString: string;
	export let onAddNode: (address: string) => void;
	export let onAddPath: (from: string, to: string) => void;
	export let onCommonFriends: (addresses: string) => void;
</script>

<div class="flex flex-col gap-4 p-4 bg-gray-100 w-full">
	<div class="flex items-center gap-2">
		<label for="add-node-input" class="mr-2">Address:</label>
		<input
			id="add-node-input"
			type="text"
			placeholder="0xadd6e22..."
			bind:value={addNodeAddress}
			class="flex-grow p-2 border border-gray-300 rounded"
		/>
		<button
			on:click={() => onAddNode(addNodeAddress)}
			class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button
		>
	</div>
	<div class="flex items-center gap-2">
		<label for="path-from-input" class="mr-2">Path from:</label>
		<input
			id="path-from-input"
			type="text"
			placeholder="0xadd6e22..."
			bind:value={pathFromAddress}
			class="flex-grow p-2 border border-gray-300 rounded"
		/>
		<label for="path-to-input" class="mr-2">to:</label>
		<input
			id="path-to-input"
			type="text"
			placeholder="0xadd6e22..."
			bind:value={pathToAddress}
			class="flex-grow p-2 border border-gray-300 rounded"
		/>
		<button
			on:click={() => onAddPath(pathFromAddress, pathToAddress)}
			class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Calculate</button
		>
	</div>
	<div class="flex items-center gap-2">
		<label for="common-friends-input" class="mr-2">Common friends:</label>
		<input
			id="common-friends-input"
			type="text"
			placeholder="0xde374ece6fa50e781e81aac78e811b33d16912c7, 0x3cb406Def33aeD0ABD6D02a75FEdCa8e2E8D1A2e, .."
			bind:value={commonFriendsString}
			class="flex-grow p-2 border border-gray-300 rounded"
		/>
		<button
			on:click={() => onCommonFriends(commonFriendsString)}
			class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Show</button
		>
	</div>
</div>
