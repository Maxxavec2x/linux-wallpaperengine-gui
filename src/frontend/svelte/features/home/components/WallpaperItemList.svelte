<script lang="ts">
	import { fly } from 'svelte/transition';
	import WallpaperCard from '@/features/wallpaper/WallpaperCard.svelte';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '@shared/types';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import VirtualList from '@/ui/VirtualList.svelte';

	$: isPerformanceMode = !!$settingsStore?.performanceMode;

	export let wallpapers: [string, WallpaperData][] = [];
	export let selectedWallpaper: Wallpaper | null = null;
	export let activePlaylist: Playlist | undefined = undefined;
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void;
	export let isWorkshop: boolean = false;
	export let container: HTMLElement | null = null;
</script>

<div
	class="wallpaper-list-wrapper"
	in:fly={{
		x: 20,
		delay: isPerformanceMode ? 0 : 200,
		duration: isPerformanceMode ? 0 : 200
	}}
	out:fly={{ x: 20, duration: isPerformanceMode ? 0 : 200 }}
>
	<VirtualList
		items={wallpapers}
		itemHeight={144}
		gap={10}
		{container}
	>
		{#snippet children({ visibleItems, startIndex }: { visibleItems: [string, WallpaperData][]; startIndex: number })}
			{#each visibleItems as [folderName, wallpaper], i (folderName)}
				<WallpaperCard
					{folderName}
					{wallpaper}
					{selectedWallpaper}
					{activePlaylist}
					{onSelect}
					{isWorkshop}
					index={startIndex + i}
					viewMode="list"
				/>
			{/each}
		{/snippet}
	</VirtualList>
</div>

<style lang="scss">
	.wallpaper-list-wrapper {
		width: 100%;
		flex: 1;
	}
</style>
