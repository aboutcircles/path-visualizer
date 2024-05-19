<script lang="ts">
	import { CirclesAPI } from '$lib/api/gardenApi';
	import { get, writable } from 'svelte/store';
	import { isExpandClicked } from '../../../stores/isExpanded'; // Import the store

	export let addNodeAddress: string;
	export let pathFromAddress: string;
	export let pathToAddress: string;
	export let onAddNode: (address: string) => void;
	export let onAddPath: (from: string, to: string) => void;
	export let onGenerate: () => void;
	export let onReset: () => void;

	let isSignedUp: any = null;
	let addressExists: boolean = false;
	let enableAdd: boolean = true;
	let usernameNotFound: boolean = false;

	const enableGenerate = writable(false);

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
		avatarUrl?: string;
	}

	let startingUserList: UserData[] = [];
	let isAdding = writable(false); // State to track if addition is in progress
	let searchResults = writable<UserData[]>([]);
	let activeInput = writable<'from' | 'to' | 'addNode' | null>(null);

	// Reactive statement to log the startingUserList whenever it changes
	$: {
		console.log('Starting user list updated:', startingUserList);
		enableGenerate.set(startingUserList.length > 0);
	}

	const addUser = async () => {
		if (addNodeAddress.trim() !== '' && !get(isAdding)) {
			isAdding.set(true); // Lock the addition process

			const addressAlreadyAdded = startingUserList.some(
				(user) => user.safeAddress.toLowerCase() === addNodeAddress.toLowerCase()
			);

			if (!addressAlreadyAdded) {
				try {
					const userData = await CirclesAPI.fetchUserData([addNodeAddress]);
					if (userData && userData.length > 0) {
						startingUserList = [
							...startingUserList,
							...userData.map((user) => ({
								id: parseInt(user.id),
								username: user.username || addNodeAddress, // Use the address as a fallback username
								safeAddress: user.safeAddress,
								avatarUrl: user.avatarUrl || '/default.png'
							}))
						];
					} else {
						// If no user data is found, add the address with the address as the username
						startingUserList = [
							...startingUserList,
							{
								id: Date.now(), // Generate a unique ID
								username: addNodeAddress, // Use the address itself as the username
								safeAddress: addNodeAddress,
								avatarUrl: '/default.png'
							}
						];
					}
					onAddNode(addNodeAddress);
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

	const searchUsers = async (query: string, inputType: 'addNode') => {
		if (query.length > 0) {
			try {
				const results = await CirclesAPI.searchUsers(query);
				searchResults.set(results);
				activeInput.set(inputType);
			} catch (error) {
				console.error('Failed to search users:', error);
			}
		} else {
			searchResults.set([]);
			activeInput.set(null);
		}
	};

	const reset = () => {
		startingUserList = [];
		enableGenerate.set(false);
		isSignedUp = null;
		addressExists = false;
		addNodeAddress = '';
		enableAdd = true;
		usernameNotFound = false;
		isExpandClicked.set(false); // Reset the state when reset is clicked
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

		<div class="flex items-center gap-2 relative">
			<input
				id="add-node-input"
				type="text"
				class="flex-grow p-2 border border-gray-300 rounded-xl"
				bind:value={addNodeAddress}
				placeholder="Enter a circles name or address"
				on:input={(e) => searchUsers(e.target.value, 'addNode')}
				autocomplete="off"
				disabled={startingUserList.length === 0 && !enableAdd}
			/>
			{#if $activeInput === 'addNode' && $searchResults.length > 0}
				<ul
					class="absolute bg-white border border-gray-300 rounded-lg mt-1 max-h-32 overflow-y-auto z-10 w-full"
				>
					{#each $searchResults as result}
						<li
							class="p-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
							on:click={async () => {
								addNodeAddress = result.safeAddress;
								activeInput.set(null);
								await addUser();
							}}
						>
							<img
								src={result.avatarUrl || '/default.png'}
								alt="Profile"
								class="w-6 h-6 rounded-full"
							/>
							<span>{result.username} ({result.safeAddress})</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<label for="add-node-input" class="text-sm font-medium">Users to include in your graph:</label>
		<div>
			{#each startingUserList as user}
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

	<div class="flex gap-2 mt-4">
		{#if !$enableGenerate}
			<button
				class="bg-blue-100 border-2 border-blue-100 font-bold rounded-full text-white px-6 py-2 cursor-not-allowed"
				>Expand</button
			>
		{:else}
			<button
				on:click={() => {
					onGenerate();
					enableGenerate.set(false);
					addressExists = false;
					isSignedUp = null;
					startingUserList = [];
					addNodeAddress = '';
					enableAdd = false;
					isExpandClicked.set(true);
					console.log('Expand button clicked, store updated');
				}}
				class="bg-secondary-bg-light border-2 border-secondary-bg-light font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
			>
				Expand
			</button>
		{/if}
		<button
			on:click={() => reset()}
			class="bg-white border-2 border-secondary-bg-light font-bold rounded-full text-secondary-bg-light px-6 py-2 hover:bg-gray-100 transition duration-300 ease-in-out"
		>
			Reset
		</button>
	</div>
</div>

<style>
	.bg-secondary-bg-light {
		background-color: #4a90e2;
	}
</style>
