<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { DuneApi } from '$lib/api/dune';
	import * as echarts from 'echarts';

	let chartInstances = [];
	let chartContainers = [];

	const duneApi = new DuneApi();

	const apiMethods = [
		// () => duneApi.getUserTransactionsToOrgs(),
		// () => duneApi.getUserTransactionsToSelectedBusinesses(),
		() => duneApi.getOrgSignups(),
		// () => duneApi.getB2bTransactionsPerWeek(),
		() => duneApi.getDistinctUsersTransactingPerWeek(),
		() => duneApi.getDistinctUsersTrustingPerWeek(),
		() => duneApi.getNewUserSignups()
	];

	function formatDate(dateStr) {
		const parts = dateStr.split('-'); // Assuming the date format is "YYYY-MM-DD"
		if (parts.length === 3) {
			const year = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
			const day = parseInt(parts[2], 10);
			const date = new Date(year, month, day);
			return date.toLocaleString('default', { month: 'short', year: 'numeric' });
		}
		return 'Unknown Date'; // Fallback in case the date format is incorrect
	}

	onMount(async () => {
		apiMethods.forEach(async (apiMethod, index) => {
			try {
				const data = await apiMethod();
				if (chartContainers[index]) {
					initChart(data, index);
				}
			} catch (error) {
				console.error('Failed to fetch data:', error);
			}
		});
	});

	function initChart(data, index) {
		const sortedData = sortDataByDate(data);
		const option = {
			title: {
				text: getChartTitle(index),
				left: 'center'
			},
			tooltip: { trigger: 'axis' },
			xAxis: {
				type: 'category',
				data: sortedData.map((item) => formatDate(item.week)),
				axisLabel: { rotate: 45 }
			},
			yAxis: { type: 'value' },
			series: [
				{
					data: sortedData.map((item) => {
						if (item.org) {
							return item.org;
						} else if (item.businesses) {
							return item.businesses;
						} else {
							return item.user;
						}
					}),
					type: 'line',
					smooth: true,
					areaStyle: {}
				}
			]
		};

		chartInstances[index] = echarts.init(chartContainers[index]);
		chartInstances[index].setOption(option);
	}

	function getChartTitle(index) {
		const chartLabels = [
			'Organization Signups',
			'Distinct Users Transacting per Week',
			'Distinct Users Trusting per Week',
			'New User Signups'
		];
		return chartLabels[index];
	}

	function sortDataByDate(data) {
		return data.sort((a, b) => {
			// Manually parse dates from the format 'YYYY-MM-DD'
			const aParts = a.week.split('-');
			const bParts = b.week.split('-');
			const aDate = new Date(parseInt(aParts[0]), parseInt(aParts[1]) - 1, parseInt(aParts[2]));
			const bDate = new Date(parseInt(bParts[0]), parseInt(bParts[1]) - 1, parseInt(bParts[2]));

			return aDate - bDate;
		});
	}

	function handleResize() {
		chartInstances.forEach((instance) => {
			if (instance) {
				instance.resize();
			}
		});
	}

	onDestroy(() => {
		chartInstances.forEach((instance) => {
			if (instance) {
				instance.dispose();
			}
		});
	});
</script>

<svelte:window on:resize={handleResize} />

<div class="p-4 gap-6 bg-white rounded-xl h-full overflow-hidden">
	<h1 class="font-bold">Circles Network Data</h1>
	<p>
		Here you can find various statistics about the Circles network, such as organization signups,
		distinct users transacting per week, distinct users trusting per week, and new user signups.
	</p>
	<div class="grid grid-cols-2 grid-rows-2 gap-6 p-5 h-full">
		{#each Array(apiMethods.length) as _, i}
			<div bind:this={chartContainers[i]} class="w-full" />
		{/each}
	</div>
</div>
