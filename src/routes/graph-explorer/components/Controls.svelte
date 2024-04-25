<script lang="ts">
	import { CirclesAPI } from '$lib/api/gardenApi';
	import { writable } from 'svelte/store';

	export let addNodeAddress: string;
	export let pathFromAddress: string;
	export let pathToAddress: string;
	// export let commonFriendsString: string;
	export let onAddNode: (address: string) => void;
	export let onAddPath: (from: string, to: string) => void;
	export let onGenerate: () => void;
	export let onReset: () => void;
	// export let onCommonFriends: (addresses: string) => void;

	interface UserData {
		id: number; // Ensure this is a number if your store expects a number
		username: string;
		safeAddress: string;
	}

	let startingUserList = writable<UserData[]>([]);

	const addUser = async () => {
		if (addNodeAddress.trim() !== '') {
			try {
				const userData = await CirclesAPI.fetchUserData([addNodeAddress]);
				if (userData) {
					startingUserList.update((currentList) => {
						const adaptedUserData = userData.map((user) => ({
							id: parseInt(user.id),
							username: user.username,
							safeAddress: user.safeAddress
						}));
						return [...currentList, ...adaptedUserData];
					});
				}

				addNodeAddress = '';
			} catch (error) {
				console.error('Error fetching user data:', error);
			}
		}
	};

	const reset = () => {
		startingUserList.set([]);
		onReset();
	};
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
				class="flex-grow p-2 border border-gray-300 rounded-xl"
				bind:value={addNodeAddress}
				placeholder="Enter Ethereum address"
			/>
			<button
				on:click={() => {
					addUser();
					onAddNode(addNodeAddress);
				}}
				class="border-2 rounded-full bg-red-500 text-white font-bold border-red-500 px-6 py-2 hover:bg-red-400 transition duration-300 ease-in-out"
				>Add user</button
			>
			<button
				on:click={() => onGenerate()}
				class="bg-secondary-bg-light border-2 border-secondary-bg-light font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
				>Generate</button
			>
			<button
				on:click={() => reset()}
				class="bg-white border-2 border-secondary-bg-light font-bold rounded-full text-secondary-bg-light px-6 py-2 hover:bg-gray-100 transition duration-300 ease-in-out"
				>Reset</button
			>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<label for="add-node-input" class="text-sm font-medium">Users to include in your graph:</label>
		<div class="flex flex-col gap-2">
			{#each $startingUserList as user}
				<div class="flex items-center gap-2">
					<div class="bg-gray-200 rounded-lg p-2 shrink-0">
						<p class="text-sm whitespace-nowrap">{user.safeAddress}</p>
					</div>
					<div class="bg-gray-200 rounded-lg p-2 shrink-0">
						<p class="text-sm whitespace-nowrap">{user.username}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- <div class="flex flex-col gap-2">
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
	</div> -->

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
