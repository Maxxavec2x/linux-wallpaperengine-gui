<script lang="ts">
	import { t } from '@/core/i18n';
	import {
		cloneMode,
		spanMode,
		refreshScreens,
		toggleCloneMode,
		toggleSpanMode
	} from '@/features/home/scripts/display';
	import { activeFolderName } from '@/features/home/scripts/wallpaperStore';
	import Select from '@/ui/Select.svelte';
	import type { Wallpaper } from '@shared/types';

	export let activeWallpaper: Wallpaper | null = null;

	$: displayModeValue = $spanMode ? 'span' : $cloneMode ? 'clone' : 'individual';

	$: displayModeOptions = [
		{ value: 'individual', label: $t('wallpaper.toolbar.individualMode') },
		{ value: 'clone', label: $t('wallpaper.toolbar.cloneMode') },
		{ value: 'span', label: $t('wallpaper.toolbar.spanMode') }
	];

	async function handleDisplayModeChange(mode: string) {
		const targetWallpaper = activeWallpaper?.folderName || $activeFolderName;
		if (mode === 'clone') {
			if ($spanMode) await toggleSpanMode(false, targetWallpaper);
			if (!$cloneMode) await toggleCloneMode(true, targetWallpaper);
		} else if (mode === 'span') {
			if ($cloneMode) await toggleCloneMode(false, targetWallpaper);
			if (!$spanMode) await toggleSpanMode(true, targetWallpaper);
		} else {
			if ($cloneMode) await toggleCloneMode(false, targetWallpaper);
			if ($spanMode) await toggleSpanMode(false, targetWallpaper);
		}
		await refreshScreens();
	}
</script>

<div class="display-bar">
	<span class="label">{$t('wallpaper.toolbar.display')}</span>
	<Select
		id="display-mode-select-top"
		value={displayModeValue}
		options={displayModeOptions}
		onChange={handleDisplayModeChange}
		style="width: 140px;"
	/>
</div>

<style lang="scss">
	.display-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 10px 0 12px;
		width: 100%;
		box-sizing: border-box;

		.label {
			color: var(--text-muted);
			font-weight: 600;
			font-size: 0.85em;
			flex-shrink: 0;
		}

		:global(.select-trigger) {
			padding: 8px 12px;
			height: 36px;
			box-sizing: border-box;
		}
	}
</style>
