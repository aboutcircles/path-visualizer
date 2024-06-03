<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from 'svelte';
	import { CirclesAPI, type UserData } from '$lib/api/gardenApi';
	import { writable } from 'svelte/store';
	import { ethers } from 'ethers';

	export let label: string;
	export let bindValue: string;
	export let bindUsername: string;
	export let bindUserAvatar: string;
	export let placeholder: string;
	export let inputType: 'from' | 'to' | 'addNode';
	export let context: 'trust-graph' | 'pathfinder' = 'pathfinder'; // Default to 'pathfinder'

	const DEFAULT_AVATAR = '/default.png';

	const searchResults = writable<UserData[]>([]);
	const activeInput = writable<boolean>(false);
	const errorMessage = writable<string | null>(null);
	let debounceTimeout: ReturnType<typeof setTimeout>;

	const dispatch = createEventDispatcher();

	async function searchUsers(query: string) {
		if (query.length > 0) {
			try {
				if (ethers.isAddress(query)) {
					const isSignedUpResponse = await fetch(`/api/circles?address=${query}`);
					const isSignedUpData = await isSignedUpResponse.json();

					if (isSignedUpData.isSignedUp) {
						const userData = await CirclesAPI.fetchUserData([query]);
						if (userData.length > 0) {
							searchResults.set(userData);
						} else {
							searchResults.set([
								{ id: '0', safeAddress: query, username: query, avatarUrl: DEFAULT_AVATAR }
							]);
						}
						errorMessage.set(null);
					} else {
						searchResults.set([]);
						errorMessage.set('Address is not signed up at Circles.');
					}
				} else {
					const results = await CirclesAPI.searchUsers(query);
					searchResults.set(results);
					errorMessage.set(null);
				}
				activeInput.set(true);
			} catch (error) {
				console.error('Failed to search users:', error);
				errorMessage.set('An error occurred while searching users.');
			}
		} else {
			searchResults.set([]);
			activeInput.set(false);
			errorMessage.set(null);
		}
	}

	function handleInput(event: Event) {
		const query = (event.target as HTMLInputElement).value;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchUsers(query);
		}, 300);
	}

	function selectUser(result: UserData) {
		bindValue = result.safeAddress;
		if (context !== 'trust-graph') {
			bindUsername = result.username;
			bindUserAvatar = result.avatarUrl || DEFAULT_AVATAR;
		}
		activeInput.set(false);
		errorMessage.set(null);
		dispatch('select', result.safeAddress);
	}

	function handleClickOutside(event: MouseEvent) {
		const dropdown = document.getElementById(`${inputType}-dropdown`);
		if (dropdown && !dropdown.contains(event.target as Node)) {
			activeInput.set(false);
		}
	}

	function clearFields() {
		bindValue = '';
		bindUsername = '';
		bindUserAvatar = DEFAULT_AVATAR;
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('click', handleClickOutside);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', handleClickOutside);
		}
	});

	export { clearFields };
</script>

<div class="flex-1 m-1 relative">
	<label for={inputType} class="block text-sm font-medium text-gray-700">
		{label}: {#if context !== 'trust-graph' && bindUsername}
			<span class="text-blue-600 flex items-center gap-2">
				<img src={bindUserAvatar} alt={bindUsername} class="w-6 h-6 rounded-full" />
				{bindUsername}
			</span>
		{/if}
	</label>
	<input
		id={inputType}
		type="text"
		bind:value={bindValue}
		on:input={handleInput}
		autocomplete="off"
		{placeholder}
		class="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
	/>
	{#if $activeInput}
		<ul
			id={`${inputType}-dropdown`}
			class="absolute bg-white border border-gray-300 w-full max-h-36 overflow-y-auto z-10 mt-1 shadow-lg rounded-lg"
		>
			{#if $errorMessage}
				<li class="p-2 text-red-500">{$errorMessage}</li>
			{:else}
				{#each $searchResults as result}
					<li
						on:click={() => selectUser(result)}
						class="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
					>
						<img
							src={result.avatarUrl || DEFAULT_AVATAR}
							alt={result.username}
							class="w-8 h-8 rounded-full"
						/>
						<div>
							<div>{result.username}</div>
							<div class="text-xs text-gray-500">{result.safeAddress}</div>
						</div>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
