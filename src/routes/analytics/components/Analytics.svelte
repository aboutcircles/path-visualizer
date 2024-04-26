<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { DuneApi } from '$lib/api/dune';
	import * as echarts from 'echarts';

	let chartInstances = [];
	let chartContainers = [];

	const duneApi = new DuneApi();

	// List of API methods to call
	const apiMethods = [
		() => duneApi.getUserTransactionsToOrgs(),
		() => duneApi.getUserTransactionsToSelectedBusinesses(),
		() => duneApi.getOrgSignups(),
		() => duneApi.getB2bTransactionsPerWeek(),
		() => duneApi.getDistinctUsersTransactingPerWeek(),
		() => duneApi.getDistinctUsersTrustingPerWeek(),
		() => duneApi.getNewUserSignups()
	];

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

	function initChart(data, index, dataType) {
		const sortedData = sortDataByDate(data);
		const option = {
			title: {
				text: getChartTitle(index),
				left: 'center'
			},
			tooltip: { trigger: 'axis' },
			xAxis: {
				type: 'category',
				data: sortedData.map((item) =>
					new Date(item.week).toLocaleString('default', { month: 'short', year: 'numeric' })
				),
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
							// Default to 'user' if dataType is not provided or invalid
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
		// Define an array of labels for each chart
		const chartLabels = [
			'User Transactions to Orgs',
			'User Transactions to Selected Businesses',
			'Organization Signups',
			'B2B Transactions per Week',
			'Distinct Users Transacting per Week',
			'Distinct Users Trusting per Week',
			'New User Signups'
		];

		// Return the corresponding label for the given index
		return chartLabels[index];
	}

	function sortDataByDate(data) {
		return data.sort((a, b) => new Date(a.week) - new Date(b.week));
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

<div class="p-4 gap-6 bg-white rounded-xl h-full overflow-auto">
	<h1>Circles Network Data</h1>
	<p>
		Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nobis perspiciatis, dolor, placeat
		delectus quasi quod vero eveniet harum, magni aut vitae aperiam ducimus beatae earum natus
		voluptatibus praesentium in provident.
	</p>

	<div class="charts-container">
		{#each Array(apiMethods.length) as _, i}
			<div bind:this={chartContainers[i]} class="chart-container"></div>
		{/each}
	</div>
</div>

<style>
	.charts-container {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		padding: 20px;
	}
	.chart-container {
		width: calc(50% - 20px); /* Subtracting gap size */
		height: 400px;
	}
</style>
