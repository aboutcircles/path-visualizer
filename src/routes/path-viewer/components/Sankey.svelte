<script lang="ts">
	import { pathVisualizerStore, type PathVisualizerState } from '../../../stores/pathVisualizer';
	import UserSelectForm from './UserSelectForm.svelte';
	import Sidebar from './Sidebar.svelte';
	import SankeyDiagram from './SankeyDiagram.svelte';
	import Loader from './Loader.svelte';
	import { SankeyChart } from '../../../lib/api/sankey';
	import { ethers } from 'ethers';
	import { CirclesAPI } from '$lib/api/gardenApi';

	let sankeyChart = new SankeyChart();

	let pathVisualizerState: PathVisualizerState;
	const unsubscribe = pathVisualizerStore.subscribe((value) => {
		pathVisualizerState = value;
	});

	$: {
		const ethValue = pathVisualizerState.ethValue;
		const weiValue = ethers.parseUnits(ethValue.toString(), 'ether').toString();
		pathVisualizerStore.update((state) => ({ ...state, value: weiValue }));
		console.log('weiValue:', weiValue); // Log the wei value
	}

	const handleSubmit = async (): Promise<void> => {
		const ethValue = pathVisualizerState.ethValue;
		const weiValue = ethers.parseUnits(ethValue.toString(), 'ether').toString();
		pathVisualizerStore.update((state) => ({ ...state, value: weiValue }));

		console.log('Generate button pressed');
		pathVisualizerStore.setIsLoading(true);
		let sourceAddress = pathVisualizerState.fromAddress;
		let sinkAddress = pathVisualizerState.toAddress;
		const amount: string = pathVisualizerState.value;

		console.log('Source address:', sourceAddress);
		console.log('Sink address:', sinkAddress);
		console.log('Amount (in wei):', amount);

		if (!sourceAddress.startsWith('0x')) {
			sourceAddress = (await CirclesAPI.resolveUsernameToAddress(sourceAddress)) || '';
			console.log('Resolved source address:', sourceAddress);
		}
		if (!sinkAddress.startsWith('0x')) {
			sinkAddress = (await CirclesAPI.resolveUsernameToAddress(sinkAddress)) || '';
			console.log('Resolved sink address:', sinkAddress);
		}

		try {
			const sankeyData = await sankeyChart.generateSankeyData(sourceAddress, sinkAddress, amount);
			console.log('Sankey data generated:', sankeyData);
			pathVisualizerStore.setChartData(sankeyData);
			pathVisualizerStore.setIsUserSelectOpen(false);
			pathVisualizerStore.setIsLoading(false);
		} catch (error) {
			console.error('Failed to generate Sankey data:', error);
			pathVisualizerStore.setIsLoading(false);
		}
	};

	const resetForm = (): void => {
		console.log('Reset button pressed');
		pathVisualizerStore.update((state) => ({
			...state,
			fromAddress: '',
			toAddress: '',
			fromUsername: '',
			fromUserAvatar: '',
			toUsername: '',
			toUserAvatar: '',
			ethValue: 0,
			isUserSelectOpen: true,
			chartData: { nodes: [], links: [] },
			clearChart: true
		}));
	};

	const generateChartFromLogs = async (logs: any[]): Promise<void> => {
		try {
			const sankeyData = await sankeyChart.generateSankeyDataFromLogs(logs);
			console.log('Sankey data from logs generated:', sankeyData);
			pathVisualizerStore.setChartData(sankeyData);
			pathVisualizerStore.setIsContentOpen(false);
		} catch (error) {
			console.error('Failed to generate Sankey data from logs:', error);
		}
	};
</script>

<div class="h-full overflow-hidden flex">
	<Sidebar {generateChartFromLogs} />

	<div class="flex flex-col flex-grow h-full space-y-4 p-4">
		<UserSelectForm {handleSubmit} {resetForm} />
		<SankeyDiagram />
	</div>
</div>

<Loader isLoading={$pathVisualizerStore.isLoading} />
