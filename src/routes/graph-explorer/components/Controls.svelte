<script lang="ts">
	import { CirclesAPI } from '$lib/api/gardenApi';
	import { ethers } from 'ethers';
	import { onMount } from 'svelte';
	import { get, writable } from 'svelte/store';

	export let addNodeAddress: string;
	export let pathFromAddress: string;
	export let pathToAddress: string;
	// export let commonFriendsString: string;
	// export let nodeList: NodeList | undefined;
	export let onAddNode: (address: string) => void;
	export let onAddPath: (from: string, to: string) => void;
	export let onGenerate: () => void;
	export let onReset: () => void;
	// export let onCommonFriends: (addresses: string) => void;

	let enableGenerate = false;
	let isSignedUp: any = null;
	let addressExists: boolean = false;

	const isUserSignedUp = async (address: string) => {
		addressExists = false;
		try {
			const response = await fetch(`/api/circles/?address=${address}`);
			if (!response.ok) {
				throw new Error('Network response was not ok.');
			}
			const data = await response.json();
			console.log('data.isSignedUp', data.isSignedUp);
			return data.isSignedUp;
		} catch (error) {
			console.error('Error checking user signup:', error);
			throw new Error('Error checking user signup');
		}
	};

	interface UserData {
		id: number;
		username: string;
		safeAddress: string;
	}

	let startingUserList = writable<UserData[]>([]);

	const addUser = async () => {
		if (addNodeAddress.trim() !== '') {
			const list = get(startingUserList);
			console.log('list', list);
			addressExists = list.some(
				(user) => user.safeAddress.toLowerCase() === addNodeAddress.toLowerCase()
			);

			if (addressExists) {
				console.log('Address already added.');
				return;
			}

			addressExists = false;

			try {
				const userData = await CirclesAPI.fetchUserData([addNodeAddress]);
				if (userData) {
					startingUserList.update((currentList) => {
						return [
							...currentList,
							...userData.map((user) => ({
								id: parseInt(user.id),
								username: user.username,
								safeAddress: user.safeAddress
							}))
						];
					});
					onAddNode(addNodeAddress);
					enableGenerate = true;
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
			}
			addNodeAddress = '';
		}
	};

	const reset = () => {
		startingUserList.set([]);
		enableGenerate = false;
		isSignedUp = null;
		addressExists = false;
		addNodeAddress = '';
		onReset();
	};
</script>

<div class="flex flex-col gap-4 p-4 bg-white w-full h-full rounded-xl">
	<h1 class="text-xl font-bold">Generate your graph</h1>

	<div class="flex flex-col gap-2">
		<label for="add-node-input" class="text-sm font-medium"
			>Add a Circles address or username to your graph:</label
		>
		{#if addressExists}
			<p class="text-red-500">This address is already in the list.</p>
		{/if}
		{#if isSignedUp === false}
			<p class="text-red-500">Address is not signed up at circles.</p>
		{/if}

		<div class="flex items-center gap-2">
			<input
				id="add-node-input"
				type="text"
				class="flex-grow p-2 border border-gray-300 rounded-xl"
				bind:value={addNodeAddress}
				placeholder="Enter Ethereum address"
			/>
			{#if !addNodeAddress}
				<button
					class="border-2 rounded-full bg-red-100 text-white font-bold border-red-100 px-6 py-2 cursor-not-allowed"
					>Add user</button
				>
			{:else}
				<button
					on:click={async () => {
						if ((await isUserSignedUp(addNodeAddress)) === false) {
							isSignedUp = false;
						} else {
							addUser();
							onAddNode(addNodeAddress);
							enableGenerate = true;
							isSignedUp = true;
						}
					}}
					class="border-2 rounded-full bg-red-500 text-white font-bold border-red-500 px-6 py-2 hover:bg-red-400 transition duration-300 ease-in-out"
					>Add user</button
				>
			{/if}
			{#if $startingUserList.length === 0 || enableGenerate === false}
				<button
					class="bg-blue-100 border-2 border-blue-100 font-bold rounded-full text-white px-6 py-2 cursor-not-allowed"
					>Generate</button
				>
			{:else}
				<button
					on:click={() => {
						onGenerate();
						enableGenerate = false;
						addressExists = false;
						isSignedUp = null;
					}}
					class="bg-secondary-bg-light border-2 border-secondary-bg-light font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
					>Generate</button
				>
			{/if}

			<button
				on:click={() => reset()}
				class="bg-white border-2 border-secondary-bg-light font-bold rounded-full text-secondary-bg-light px-6 py-2 hover:bg-gray-100 transition duration-300 ease-in-out"
				>Reset</button
			>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<label for="add-node-input" class="text-sm font-medium">Users to include in your graph:</label>
		<div>
			{#each $startingUserList as user}
				<div class="bg-gray-200 gap-6 rounded-lg p-2 m-2 whitespace-nowrap inline-block">
					{#if user.username}
						<p class="text-sm">{user.username}</p>
					{:else}
						<p class="text-sm">{user.safeAddress}</p>
					{/if}
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
