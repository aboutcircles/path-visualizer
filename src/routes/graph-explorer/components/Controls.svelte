<script lang="ts">
	import { CirclesAPI } from '$lib/api/gardenApi';
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
	let enableAdd: boolean = true;
	let usernameNotFound: boolean = false;

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
	let isAdding = writable(false); // State to track if addition is in progress

	const addUser = async () => {
		if (addNodeAddress.trim() !== '' && !get(isAdding)) {
			isAdding.set(true); // Lock the addition process

			const list = get(startingUserList);
			const addressAlreadyAdded = list.some(
				(user) => user.safeAddress.toLowerCase() === addNodeAddress.toLowerCase()
			);

			if (!addressAlreadyAdded) {
				try {
					const userData = await CirclesAPI.fetchUserData([addNodeAddress]);
					if (userData && userData.length > 0) {
						startingUserList.update((currentList) => [
							...currentList,
							...userData.map((user) => ({
								id: parseInt(user.id),
								username: user.username || addNodeAddress, // Use the address as a fallback username
								safeAddress: user.safeAddress
							}))
						]);
					} else {
						// If no user data is found, add the address with the address as the username
						startingUserList.update((currentList) => [
							...currentList,
							{
								id: Date.now(), // Generate a unique ID
								username: addNodeAddress, // Use the address itself as the username
								safeAddress: addNodeAddress
							}
						]);
					}
					onAddNode(addNodeAddress);
					enableGenerate = true;
				} catch (error) {
					console.error('Error fetching user data:', error);
				}
			} else {
				addressExists = true;
				return;
			}
			isAdding.set(false); // Unlock the addition process
			addNodeAddress = '';
		}
	};

	const handleInput = async () => {
		let address = addNodeAddress.trim();
		usernameNotFound = false; // Reset the state each time the function is called

		try {
			if (!address.startsWith('0x')) {
				const resolvedAddress = await CirclesAPI.resolveUsernameToAddress(address);
				if (!resolvedAddress) {
					throw new Error('Username not found'); // Throw an error if username cannot be resolved
				}
				address = resolvedAddress; // Update the address with the resolved one
			}

			const signedUp = await isUserSignedUp(address);
			if (!signedUp) {
				throw new Error('Address is not signed up at circles'); // Throw if address isn't signed up
			}

			// If all checks pass, update the node address and add the user
			addNodeAddress = address;
			addUser();
		} catch (error) {
			console.error(error.message);

			usernameNotFound = true;
		}
	};

	const reset = () => {
		startingUserList.set([]);
		enableGenerate = false;
		isSignedUp = null;
		addressExists = false;
		addNodeAddress = '';
		enableAdd = true;
		usernameNotFound = false;
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
		{#if usernameNotFound}
			<p class="text-red-500">Username not found.</p>
		{/if}

		<div class="flex items-center gap-2">
			<input
				id="add-node-input"
				type="text"
				class="flex-grow p-2 border border-gray-300 rounded-xl"
				bind:value={addNodeAddress}
				placeholder="Enter a circles name or address"
				disabled={$startingUserList.length === 0 && !enableAdd}
			/>
			{#if !addNodeAddress.trim() || !enableAdd}
				<button
					class="border-2 rounded-full bg-red-100 text-white font-bold border-red-100 px-6 py-2 cursor-not-allowed"
					>Add user</button
				>
			{:else}
				<button
					on:click={async () => {
						await handleInput();
						// if ((await isUserSignedUp(addNodeAddress)) === false) {
						// 	isSignedUp = false;
						// } else {
						// 	addUser();
						// 	onAddNode(addNodeAddress);
						// 	enableGenerate = true;
						// 	isSignedUp = true;
						// }
					}}
					class="border-2 rounded-full bg-red-500 text-white font-bold border-red-500 px-6 py-2 hover:bg-red-400 transition duration-300 ease-in-out"
					>Add user</button
				>
			{/if}
			{#if $startingUserList.length === 0 || enableGenerate === false}
				<button
					class="bg-blue-100 border-2 border-blue-100 font-bold rounded-full text-white px-6 py-2 cursor-not-allowed"
					>Expand</button
				>
			{:else}
				<button
					on:click={() => {
						onGenerate();
						enableGenerate = false;
						addressExists = false;
						isSignedUp = null;
						startingUserList.set([]);
						addNodeAddress = '';
						enableAdd = false;
					}}
					class="bg-secondary-bg-light border-2 border-secondary-bg-light font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
					>Expand</button
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
