<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { DuneApi } from '$lib/api/dune';
	import * as echarts from 'echarts';
	import { writable, type Writable } from 'svelte/store';

	interface DataItem {
		week: string;
		org?: number;
		businesses?: number;
		user?: number;
	}

	interface ApiMethods {
		(): Promise<DataItem[]>;
	}

	let chartInstances: echarts.ECharts[] = [];
	let chartContainers: HTMLElement[] = [];
	let resizeObservers: ResizeObserver[] = [];

	const duneApi = new DuneApi();

	const apiMethods: ApiMethods[] = [
		() => duneApi.getOrgSignups(),
		() => duneApi.getDistinctUsersTransactingPerWeek(),
		() => duneApi.getDistinctUsersTrustingPerWeek(),
		() => duneApi.getNewUserSignups()
	];

	const scaleType: Writable<string> = writable('log'); // Set logarithmic as the default scale type

	function formatDate(dateStr: string): string {
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			const year = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10) - 1;
			const day = parseInt(parts[2], 10);
			const date = new Date(year, month, day);
			return date.toLocaleString('default', { month: 'short', year: 'numeric' });
		}
		return 'Unknown Date';
	}

	onMount(async () => {
		scaleType.subscribe((currentScale: string) => {
			apiMethods.forEach(async (apiMethod: ApiMethods, index: number) => {
				try {
					const data: DataItem[] = await apiMethod();
					if (chartContainers[index]) {
						initChart(data, index, currentScale === 'log'); // Pass true for logarithmic scale
					}
				} catch (error) {
					console.error('Failed to fetch data:', error);
				}
			});
		});
	});

	function initChart(data: DataItem[], index: number, logarithmic: boolean = false): void {
		const sortedData: DataItem[] = sortDataByDate(data);
		const option: echarts.EChartsOption = {
			title: {
				text: getChartTitle(index),
				left: 'center'
			},
			tooltip: { trigger: 'axis' },
			xAxis: {
				type: 'category',
				data: sortedData.map((item: DataItem) => formatDate(item.week)),
				axisLabel: { rotate: 45 }
			},
			yAxis: {
				type: logarithmic ? 'log' : 'value' // Use logarithmic scale if specified
			},
			series: [
				{
					data: sortedData.map((item: DataItem) => {
						if (item.org !== undefined) {
							return item.org;
						} else if (item.businesses !== undefined) {
							return item.businesses;
						} else if (item.user !== undefined) {
							return item.user;
						}
						return 0;
					}),
					type: 'line',
					smooth: true,
					areaStyle: {}
				}
			]
		};

		chartInstances[index] = echarts.init(chartContainers[index]);
		chartInstances[index].setOption(option);

		// Add a resize observer to the chart container
		const resizeObserver = new ResizeObserver(() => {
			chartInstances[index].resize();
		});
		resizeObserver.observe(chartContainers[index]);
		resizeObservers.push(resizeObserver);
	}

	function getChartTitle(index: number): string {
		const chartLabels: string[] = [
			'Organization Signups',
			'Distinct Users Transacting per Week',
			'Distinct Users Trusting per Week',
			'New User Signups'
		];
		return chartLabels[index];
	}

	function sortDataByDate(data: DataItem[]): DataItem[] {
		return data.sort((a: DataItem, b: DataItem) => {
			const aParts = a.week.split('-');
			const bParts = b.week.split('-');
			const aDate = new Date(parseInt(aParts[0]), parseInt(aParts[1]) - 1, parseInt(aParts[2]));
			const bDate = new Date(parseInt(bParts[0]), parseInt(bParts[1]) - 1, parseInt(bParts[2]));

			return aDate.getTime() - bDate.getTime();
		});
	}

	function handleResize(): void {
		chartInstances.forEach((instance: echarts.ECharts) => instance.resize());
	}

	function handleScaleTypeChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		if (target && target.checked !== null) {
			scaleType.set(target.checked ? 'log' : 'linear');
		}
	}

	onDestroy(() => {
		chartInstances.forEach((instance: echarts.ECharts) => {
			if (instance) {
				instance.dispose();
			}
		});
		resizeObservers.forEach((observer: ResizeObserver) => {
			observer.disconnect();
		});
	});
</script>

<svelte:window on:resize={handleResize} />

<div class="flex flex-col h-full p-4 gap-6 bg-white rounded-xl overflow-hidden">
	<h1 class="font-bold">Circles Network Data</h1>
	<p>
		Here you can find various statistics about the Circles network, such as organization signups,
		distinct users transacting per week, distinct users trusting per week, and new user signups.
	</p>
	<div class="flex items-center mt-4">
		<span class="mr-2 text-gray-700">Linear</span>
		<label for="toggle" class="flex items-center cursor-pointer">
			<div class="relative">
				<input
					type="checkbox"
					id="toggle"
					class="sr-only"
					on:change={handleScaleTypeChange}
					checked
				/>
				<div class="block bg-gray-300 w-10 h-6 rounded-full"></div>
				<div
					class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform"
				></div>
			</div>
			<span class="ml-3 text-gray-700">Logarithmic</span>
		</label>
	</div>

	<div class="grid grid-cols-2 grid-rows-2 gap-6 flex-grow min-h-0">
		{#each Array(apiMethods.length) as _, i}
			<div bind:this={chartContainers[i]} class="w-full h-full min-h-0" />
		{/each}
	</div>
</div>

<style>
	input:checked ~ .dot {
		transform: translateX(100%);
		background-color: #68d391;
	}
</style>
