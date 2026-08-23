<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import WallpaperCard from '@/features/wallpaper/WallpaperCard.svelte';
	import type { WallpaperData, Wallpaper, Playlist } from '@shared/types';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import FlipGrid from '@/ui/FlipGrid.svelte';
	import VirtualGrid from '@/ui/VirtualGrid.svelte';

	interface Props {
		wallpapers: [string, WallpaperData][];
		selectedWallpaper: Wallpaper | null;
		activePlaylist?: Playlist | undefined;
		onSelect: (folderName: string, wallpaper: WallpaperData) => void;
		isWorkshop?: boolean;
		container?: HTMLElement | null;
	}

	let {
		wallpapers = [],
		selectedWallpaper = null,
		activePlaylist = undefined,
		onSelect,
		isWorkshop = false,
		container = null
	}: Props = $props();

	const FLIP_ITEM_THRESHOLD = 180;
	let isPerformanceMode = $derived(!!$settingsStore?.performanceMode);
	let isWarpEnabled = $derived(
		!isPerformanceMode && ($settingsStore?.enableGridWarpAnimation ?? true)
	);
	let shouldUseFlipGrid = $derived(
		isWarpEnabled && wallpapers.length > 0 && wallpapers.length <= FLIP_ITEM_THRESHOLD
	);
</script>

<div
	class="wallpaper-grid-wrapper"
	in:fly={{
		x: -20,
		delay: isPerformanceMode ? 0 : 200,
		duration: isPerformanceMode ? 0 : 200
	}}
	out:fly={{ x: -20, duration: isPerformanceMode ? 0 : 200 }}
>
	{#if shouldUseFlipGrid}
		<FlipGrid items={wallpapers} itemWidth={170} gap={5}>
			{#snippet children({ visibleItems }: { visibleItems: [string, WallpaperData][]; startIndex: number })}
				{#if isWarpEnabled}
					{#each visibleItems as [folderName, wallpaper], wallpaperIndex (folderName)}
						<div
							data-flip-key={folderName}
							animate:flip={{ duration: 320, easing: cubicOut }}
							style="will-change: transform;"
						>
							<WallpaperCard
								{folderName}
								{wallpaper}
								{selectedWallpaper}
								{activePlaylist}
								{onSelect}
								{isWorkshop}
								index={wallpaperIndex}
								viewMode="grid"
							/>
						</div>
					{/each}
				{:else}
					{#each visibleItems as [folderName, wallpaper], wallpaperIndex (folderName)}
						<WallpaperCard
							{folderName}
							{wallpaper}
							{selectedWallpaper}
							{activePlaylist}
							{onSelect}
							{isWorkshop}
							index={wallpaperIndex}
							viewMode="grid"
						/>
					{/each}
				{/if}
			{/snippet}
		</FlipGrid>
	{:else}
		<VirtualGrid
			items={wallpapers}
			itemWidth={170}
			itemHeight={170}
			gap={5}
			{container}
		>
			{#snippet children({
				visibleItems,
				startIndex
			}: {
				visibleItems: [string, WallpaperData][];
				startIndex: number;
			})}
				{#each visibleItems as [folderName, wallpaper], wallpaperIndex (folderName)}
					<div data-flip-key={folderName}>
						<WallpaperCard
							{folderName}
							{wallpaper}
							{selectedWallpaper}
							{activePlaylist}
							{onSelect}
							{isWorkshop}
							index={startIndex + wallpaperIndex}
							viewMode="grid"
						/>
					</div>
				{/each}
			{/snippet}
		</VirtualGrid>
	{/if}
</div>

<style lang="scss">
	.wallpaper-grid-wrapper {
		width: 100%;
		flex: 1;
		min-width: 0;
	}
</style>
