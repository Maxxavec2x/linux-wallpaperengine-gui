<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import Icon from '@/ui/Icon.svelte';
	import ToggleButton from '@/ui/ToggleButton.svelte';
	import {
		backendLogs,
		frontendLogs,
		logger,
		wallpaperLogs
	} from '@/core/logger';
	import { parseLogLine, type ParsedLog } from '@/core/utils/logColorizer';
	import LogLine from './LogLine.svelte';
	import LogToolbar from './LogToolbar.svelte';
	import { t } from '@/core/i18n';

	type SourceFilter = 'backend' | 'frontend' | 'wallpaper';
	type DisplayLog = ParsedLog & { source: SourceFilter; raw: string };

	// Source filter pills — all on by default
	let showBackend = $state(true);
	let showFrontend = $state(true);
	let showWallpaper = $state(true);

	let searchQuery = $state('');
	let levelFilter = $state('all');
	let wrapText = $state(true);
	let autoScroll = $state(true);
	let copied = $state(false);

	let logContainer = $state<HTMLDivElement>();

	function isAtBottom(el: HTMLDivElement) {
		if (!el) return false;
		const threshold = 50;
		return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
	}
	function scrollToBottom(el: HTMLDivElement) {
		if (el) el.scrollTop = el.scrollHeight;
	}
	function handleScroll() {
		if (logContainer) autoScroll = isAtBottom(logContainer);
	}
	function forceScrollToBottom() {
		autoScroll = true;
		if (logContainer) scrollToBottom(logContainer);
	}

	const sourceFilters = $derived(
		new Set<SourceFilter>(
			[
				showBackend && 'backend',
				showFrontend && 'frontend',
				showWallpaper && 'wallpaper'
			].filter(Boolean) as SourceFilter[]
		)
	);

	// Merge + tag + sort by timestamp, then filter
	const allParsed = $derived.by(() => {
		const tag = (logs: string[], source: SourceFilter): DisplayLog[] =>
			logs.map((raw) => {
				const p = parseLogLine(raw);
				return { ...p, raw, source };
			});
		const merged: DisplayLog[] = [
			...tag($backendLogs, 'backend'),
			...tag($frontendLogs, 'frontend'),
			...tag($wallpaperLogs, 'wallpaper')
		];
		// Sort chronologically by timestamp string (YYYY/MM/DD HH:MM:SS sorts lexicographically)
		merged.sort((a, b) => {
			// empty timestamp goes last
			if (!a.timestamp && !b.timestamp) return 0;
			if (!a.timestamp) return 1;
			if (!b.timestamp) return -1;
			if (a.timestamp === b.timestamp) return 0;
			return a.timestamp < b.timestamp ? -1 : 1;
		});
		return merged;
	});

	const filteredLogs = $derived(
		allParsed.filter((log) => {
			if (!sourceFilters.has(log.source)) return false;
			if (levelFilter !== 'all' && log.level !== levelFilter) return false;
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (!log.raw.toLowerCase().includes(q)) return false;
			}
			return true;
		})
	);

	const totalCounts = $derived({
		backend: $backendLogs.length,
		frontend: $frontendLogs.length,
		wallpaper: $wallpaperLogs.length,
		filtered: filteredLogs.length
	});

	function handleClearAll() {
		logger.clearAll();
	}
	function onWrapToggle(checked: boolean) {
		wrapText = checked;
		localStorage.setItem('log_viewer_wrap_text', checked.toString());
	}
	function copyLogs() {
		const text = filteredLogs.map((l) => l.raw).join('\n');
		navigator.clipboard.writeText(text).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}
	function exportLogs() {
		const text = filteredLogs.map((l) => l.raw).join('\n');
		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `linux-wallpaperengine-gui-unified-logs.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	$effect(() => {
		// depend on filtered size or raw stores changing
		filteredLogs.length;
		$backendLogs.length;
		$frontendLogs.length;
		$wallpaperLogs.length;
		if (autoScroll) {
			tick().then(() => {
				if (logContainer) scrollToBottom(logContainer);
			});
		}
	});

	onMount(() => {
		const stored = localStorage.getItem('log_viewer_wrap_text');
		if (stored !== null) wrapText = stored === 'true';
		tick().then(() => {
			if (logContainer) scrollToBottom(logContainer);
		});
	});
</script>

<div class="logs-wrapper full">
	<div class="modal-header">
		<div class="header-left">
			<h2>{$t('logs.viewer.systemLogs')}</h2>
			<div class="tabs-switcher" role="group" aria-label="Source filters">
				<button
					class="tab-btn"
					class:active={showBackend}
					onclick={() => (showBackend = !showBackend)}
					title="Toggle Background logs"
				>
					<Icon name="dns" size={16} />
					<span>{$t('logs.viewer.backgroundLogs')}</span>
					<span class="badge">{totalCounts.backend}</span>
				</button>
				<button
					class="tab-btn"
					class:active={showFrontend}
					onclick={() => (showFrontend = !showFrontend)}
					title="Toggle UI logs"
				>
					<Icon name="terminal" size={16} />
					<span>{$t('logs.viewer.uiLogs')}</span>
					<span class="badge">{totalCounts.frontend}</span>
				</button>
				<button
					class="tab-btn"
					class:active={showWallpaper}
					onclick={() => (showWallpaper = !showWallpaper)}
					title="Toggle Wallpaper logs"
				>
					<Icon name="wallpaper" size={16} />
					<span>{$t('logs.viewer.wallpaperLogs')}</span>
					<span class="badge">{totalCounts.wallpaper}</span>
				</button>
			</div>
			<ToggleButton
				checked={wrapText}
				onChange={onWrapToggle}
				icon="wrap_text"
				label="Wrap Text"
				style="padding: 6px 14px; font-size: 0.85em; border-radius: var(--radius-md);"
			/>
		</div>
		<div class="header-actions">
			<button
				class="clear-btn danger"
				onclick={handleClearAll}
				title="Clear all logs"
			>
				<Icon name="delete" size={18} />
				<span>{$t('logs.viewer.clearAll')}</span>
			</button>
		</div>
	</div>

	<div class="logs-container unified">
		<div class="unified-toolbar">
			<div class="unified-search">
				<LogToolbar bind:searchQuery bind:levelFilter />
			</div>
			<div class="unified-actions">
				<button class="icon-btn" onclick={copyLogs} title="Copy filtered logs">
					<Icon name={copied ? 'check' : 'content_copy'} size={16} />
				</button>
				<button class="icon-btn" onclick={exportLogs} title="Export filtered logs">
					<Icon name="download" size={16} />
				</button>
				<button class="icon-btn danger" onclick={handleClearAll} title="Clear all">
					<Icon name="delete_sweep" size={16} />
				</button>
			</div>
		</div>

		<div class="unified-status">
			<span class="status-text">{totalCounts.filtered} entries</span>
			{#if !showBackend || !showFrontend || !showWallpaper}
				<span class="status-muted">· filtered by source</span>
			{/if}
			{#if levelFilter !== 'all'}
				<span class="status-muted">· level: {levelFilter}</span>
			{/if}
			{#if searchQuery}
				<span class="status-muted">· search: “{searchQuery}”</span>
			{/if}
		</div>

		<div
			class="log-box unified-box"
			class:empty={filteredLogs.length === 0}
			bind:this={logContainer}
			onscroll={handleScroll}
		>
			{#if filteredLogs.length === 0}
				<div class="empty-state">
					<Icon name="view_week" size={48} />
					<h3>
						{#if !showBackend && !showFrontend && !showWallpaper}
							{$t('logs.viewer.allHidden')}
						{:else}
							No logs match filters.
						{/if}
					</h3>
					<p>
						{#if !showBackend && !showFrontend && !showWallpaper}
							{$t('logs.viewer.allHiddenDesc')}
						{:else}
							Try adjusting source pills, level or search.
						{/if}
					</p>
				</div>
			{:else}
				{#each filteredLogs as log, i}
					<LogLine {log} index={i} {searchQuery} {wrapText} />
				{/each}
			{/if}
		</div>

		{#if !autoScroll && filteredLogs.length > 0}
			<button
				class="scroll-bottom-btn"
				onclick={forceScrollToBottom}
				transition:fly={{ y: 15, duration: 250, opacity: 0 }}
				title="Scroll to Bottom"
			>
				<Icon name="arrow_downward" size={18} />
			</button>
		{/if}
	</div>
</div>

<style lang="scss">
	.logs-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		box-sizing: border-box;
		color: var(--text-color);

		&.full {
			flex-grow: 1;
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
		gap: 8px;
		flex-wrap: wrap;
		padding: 10px 15px;
		background: var(--top-bar-bg);
		border-radius: 20px;
		margin-bottom: 10px;
		box-sizing: border-box;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		min-width: 0;

		h2 {
			margin: 0;
			font-size: 1.25em;
			font-weight: 700;
			color: var(--text-color);
			white-space: nowrap;
		}
	}

	.tabs-switcher {
		display: flex;
		background: rgba(255, 255, 255, 0.03);
		padding: 3px;
		border-radius: var(--radius-full);
		border: 1px solid rgba(255, 255, 255, 0.06);
		gap: 2px;
		flex-wrap: wrap;
		align-items: center;
		box-sizing: border-box;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 12px 0 6px;
		height: 30px;
		box-sizing: border-box;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.85em;
		font-weight: 600;
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;

		:global(.material-icons) {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 22px;
			height: 22px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.08);
			font-size: 16px !important;
			flex-shrink: 0;
			transition: all 0.2s ease;
		}

		&:hover {
			color: var(--text-color);
			background: rgba(255, 255, 255, 0.06);
		}

		&.active {
			color: var(--text-color);
			background: rgba(255, 255, 255, 0.06);

			:global(.material-icons) {
				background: var(--btn-primary-bg);
				color: #fff;
				box-shadow: 0 2px 6px rgba(var(--primary-raw-rgb), 0.3);
			}
		}

		.badge {
			font-size: 0.8em;
			padding: 1px 6px;
			border-radius: var(--radius-full);
			background: rgba(255, 255, 255, 0.15);
			color: inherit;
		}
	}

	:global(.modal-header .header-left .toggle-button) {
		height: 36px;
		box-sizing: border-box;
	}

	.header-actions {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-shrink: 0;

		button {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 0 14px;
			height: 36px;
			box-sizing: border-box;
			font-size: 0.85em;
			font-weight: 600;
			cursor: pointer;
			background-color: var(--btn-secondary-bg);
			border: 1px solid var(--border-color);
			color: var(--text-color);
			border-radius: var(--radius-md);
			transition: all 0.2s ease;
			white-space: nowrap;

			&:hover {
				background-color: var(--btn-secondary-hover-bg);
				border-color: var(--border-color-hover);
			}

			&.danger {
				background-color: var(--error-bg-translucent, rgba(220, 53, 69, 0.1));
				border-color: var(--error-border, rgba(220, 53, 69, 0.2));
				color: var(--error-color, #ff3131);

				&:hover {
					background-color: color-mix(in srgb, var(--error-bg, #dc3545), transparent 80%);
					border-color: var(--error-border, rgba(220, 53, 69, 0.4));
					color: var(--text-color);
				}
			}
		}
	}

	.logs-container {
		flex: 1;
		min-height: 0;
		background-color: color-mix(in srgb, var(--bg-app), black 30%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-lg);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;

		&.unified {
			padding: 0;
		}
	}

	.unified-toolbar {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 8px 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.12);
		flex-shrink: 0;

		.unified-search {
			flex: 1;
			min-width: 0;

			:global(.panel-toolbar) {
				background: transparent;
				border-bottom: none;
				padding: 0;
			}
		}

		.unified-actions {
			display: flex;
			gap: 4px;
			flex-shrink: 0;
		}

		.icon-btn {
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(255, 255, 255, 0.06);
			color: var(--text-muted);
			padding: 6px;
			border-radius: var(--radius-md, 6px);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.15s ease;
			width: 32px;
			height: 32px;

			&:hover {
				color: var(--text-color);
				background: rgba(255, 255, 255, 0.1);
				border-color: rgba(255, 255, 255, 0.15);
			}

			&.danger:hover {
				color: var(--error-color, #ff3131);
				background: var(--error-bg-translucent, rgba(239, 68, 68, 0.15));
				border-color: var(--error-border, rgba(220, 53, 69, 0.3));
			}
		}
	}

	.unified-status {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 14px;
		font-size: 0.78em;
		color: var(--text-muted);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		flex-shrink: 0;
		flex-wrap: wrap;

		.status-text {
			font-weight: 600;
			color: var(--text-color);
		}
		.status-muted {
			opacity: 0.8;
		}
	}

	.log-box {
		flex: 1;
		padding: 12px 6px;
		overflow-y: auto;
		overflow-x: auto;
		box-sizing: border-box;
		position: relative;

		&.empty {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		&::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}
		&::-webkit-scrollbar-track {
			background: transparent;
		}
		&::-webkit-scrollbar-thumb {
			background: rgba(255, 255, 255, 0.08);
			border-radius: var(--radius-full);
			&:hover {
				background: rgba(255, 255, 255, 0.18);
			}
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 12px;
		color: var(--text-muted);
		opacity: 0.5;
		user-select: none;
		text-align: center;
		padding: 20px;

		h3 {
			margin: 0;
			font-size: 1.1em;
			font-weight: 600;
			color: var(--text-color);
		}

		p {
			margin: 0;
			font-size: 0.85em;
			max-width: 320px;
		}
	}

	.scroll-bottom-btn {
		position: absolute;
		bottom: 12px;
		right: 6px;
		background: var(--btn-primary-bg);
		color: var(--text-color);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 50%;
		width: 32px;
		height: 32px;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		transition:
			transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.25s ease,
			background-color 0.2s,
			opacity 0.2s;
		z-index: 20;
		pointer-events: auto;

		&:hover {
			transform: scale(1.08);
			box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
			background: var(--btn-primary-hover-bg, var(--btn-primary-bg));
		}

		&:active {
			transform: scale(0.95);
		}
	}

	:global(body.is-resizing),
	:global(body.is-resizing) * {
		cursor: col-resize !important;
		user-select: none !important;
	}
</style>
