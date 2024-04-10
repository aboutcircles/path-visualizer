<script lang="ts">
	export let addNodeAddress: string;
	export let pathFromAddress: string;
	export let pathToAddress: string;
	export let commonFriendsString: string;
	export let onAddNode: (address: string) => void;
	export let onAddPath: (from: string, to: string) => void;
	export let onCommonFriends: (addresses: string) => void;
</script>

<div class="input-area">
	<label for="address-input">Address:</label>
	<input id="address-input" type="text" placeholder="0xadd6e22..." bind:value={addNodeAddress} />
	<button on:click={() => onAddNode(addNodeAddress)}>Add</button>
</div>
<div class="input-area">
	<label for="address-input">Path from:</label>
	<input id="address-input" type="text" placeholder="0xadd6e22..." bind:value={pathFromAddress} />
	<label for="address-input">to:</label>
	<input id="address-input" type="text" placeholder="0xadd6e22..." bind:value={pathToAddress} />
	<button on:click={() => onAddPath(pathFromAddress, pathToAddress)}>Calculate</button>
</div>
<div class="input-area">
	<label for="address-input">Common friends:</label>
	<input
		id="address-input"
		type="text"
		placeholder="0xde374ece6fa50e781e81aac78e811b33d16912c7, 0x3cb406Def33aeD0ABD6D02a75FEdCa8e2E8D1A2e, .."
		bind:value={commonFriendsString}
	/>
	<button on:click={() => onCommonFriends(commonFriendsString)}>Show</button>
</div>

<style>
    .input-area {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background-color: #f5f5f5;
        width: calc(100% - 20px);
    }

    .input-area label {
        margin-right: 8px;
    }

    .input-area input {
        flex-grow: 1;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ccc;
        width: auto;
    }

    .input-area button {
        padding: 8px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .input-area button:hover {
        background-color: #0056b3;
    }
</style>