<script lang="ts">
	export let addNodeAddress: string;
	export let pathFromAddress: string;
	export let pathToAddress: string;
	// export let commonFriendsString: string;
	export let onAddNode: (address: string) => void;
	export let onAddPath: (from: string, to: string) => void;
	// export let onCommonFriends: (addresses: string) => void;
</script>

<div class="flex flex-col gap-4 p-4 bg-white w-full h-full rounded-xl">
	<h1 class="text-xl font-bold">Generate your graph</h1>

	<div class="flex flex-col gap-2">
		<label for="add-node-input" class="text-sm font-medium"
			>Add a Circles address or username to your graph:</label
		>
		<div class="flex items-center gap-2">
			<input
				id="add-node-input"
				type="text"
				class="flex-grow p-2 border border-gray-300 rounded"
				bind:value={addNodeAddress}
				placeholder="Enter Ethereum address"
			/>
			<button
				on:click={() => onAddNode(addNodeAddress)}
				class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 ease-in-out"
				>Add</button
			>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<p class="text-sm font-medium">Users to include in your graph:</p>
		<div class="flex items-center gap-2">
			<label for="path-from-input" class="mr-2 text-sm font-medium">Path from:</label>
			<input
				id="path-from-input"
				type="text"
				class="flex-grow p-2 border border-gray-300 rounded"
				bind:value={pathFromAddress}
				placeholder="Start address"
			/>
			<label for="path-to-input" class="mr-2 text-sm font-medium">to:</label>
			<input
				id="path-to-input"
				type="text"
				class="flex-grow p-2 border border-gray-300 rounded"
				bind:value={pathToAddress}
				placeholder="Destination address"
			/>
			<button
				on:click={() => onAddPath(pathFromAddress, pathToAddress)}
				class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 ease-in-out"
				>Calculate</button
			>
		</div>
	</div>

	<!-- <div class="flex items-center gap-2">
		<label for="common-friends-input" class="mr-2">Common friends:</label>
		<input
			id="common-friends-input"
			type="text"
			class="flex-grow p-2 border border-gray-300 rounded"
			bind:value={commonFriendsString}
			placeholder="List of Ethereum addresses separated by commas"
		/>
		<button
			on:click={() => onCommonFriends(commonFriendsString)}
			class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Show</button
		>
	</div> -->
</div>
