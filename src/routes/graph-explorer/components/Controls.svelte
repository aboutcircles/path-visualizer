<script lang="ts">
	import { CirclesAPI } from '$lib/api/gardenApi';
	import { get, writable } from 'svelte/store';
	import { isExpandClicked } from '../../../stores/isExpanded'; // Import the store
	import UserSelect from '$lib/components/UserSelect.svelte';

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

	const addNodeUsername = writable('');
	const addNodeUserAvatar = writable('');

	interface UserData {
		id: number;
		username: string;
		safeAddress: string;
		avatarUrl?: string;
	}

	let startingUserList: UserData[] = [];
	let isAdding = writable(false);

	$: {
		console.log('Starting user list updated:', startingUserList);
		enableGenerate.set(startingUserList.length > 0);
	}

	const addUser = async () => {
		if (addNodeAddress.trim() !== '' && !get(isAdding)) {
			isAdding.set(true);

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
								username: user.username || addNodeAddress,
								safeAddress: user.safeAddress,
								avatarUrl: user.avatarUrl || '/default.png'
							}))
						];
					} else {
						startingUserList = [
							...startingUserList,
							{
								id: Date.now(),
								username: addNodeAddress,
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
			isAdding.set(false);
			addNodeAddress = '';
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
		isExpandClicked.set(false);
		onReset();
	};
</script>

<div class="flex flex-col gap-4 p-4 bg-white w-full h-full rounded-xl">
	<h1 class="text-xl font-bold">Generate your graph</h1>

	<div class="flex items-end gap-2">
		<UserSelect
			label="Add a Circles address or username to your graph"
			bind:bindValue={addNodeAddress}
			bind:bindUsername={$addNodeUsername}
			bind:bindUserAvatar={$addNodeUserAvatar}
			placeholder="Enter a circles name or address"
			inputType="addNode"
		/>
		<div class="flex gap-2">
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

	<div class="flex flex-col gap-2 mt-4">
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
</div>

<style>
	.bg-secondary-bg-light {
		background-color: rgb(56 49 139 / var(--tw-bg-opacity));
	}
</style>
