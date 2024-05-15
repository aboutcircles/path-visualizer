<script lang="ts">
	import { accountsStore } from './../../../stores/accounts';
	import { onMount } from 'svelte';

	let newTrustId = '';
	let newTrustLevel = 100;
	let fromId = '';
	let toId = '';
	let amount = 0;
	let errorMessage = '';

	onMount(() => {
		const unsubscribe = accountsStore.subscribe((value) => {
			// No need to store the value in this component
		});
		return unsubscribe;
	});

	const addTrust = (): void => {
		try {
			accountsStore.changeTrust(fromId, newTrustId, newTrustLevel);
			errorMessage = ''; // Clear any previous error message
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	};

	const sendTokens = (): void => {
		try {
			accountsStore.sendTokens(fromId, toId, amount);
			errorMessage = ''; // Clear any previous error message
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	};

	const resetStore = (): void => {
		accountsStore.reset();
		errorMessage = ''; // Clear any previous error message
	};
</script>

<div>
	<h2>Add Trust</h2>
	<input type="text" bind:value={fromId} placeholder="From name or address" />
	<input type="text" bind:value={newTrustId} placeholder="To name or address" />
	<input type="number" bind:value={newTrustLevel} placeholder="Trust Level" />
	<button on:click={addTrust}>Add Trust</button>
	{#if errorMessage}
		<p style="color: red;">{errorMessage}</p>
	{/if}
</div>

<div>
	<h2>Send Tokens</h2>
	<input type="text" bind:value={fromId} placeholder="From name or address" />
	<input type="text" bind:value={toId} placeholder="To name or address" />
	<input type="number" bind:value={amount} placeholder="Amount" />
	<button on:click={sendTokens}>Send Tokens</button>
	{#if errorMessage}
		<p style="color: red;">{errorMessage}</p>
	{/if}
</div>

<div>
	<button on:click={resetStore}>Reset Store</button>
</div>
