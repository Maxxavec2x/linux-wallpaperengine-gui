<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { t } from '@/core/i18n';
	import Icon from '@/ui/Icon.svelte';
	import type { Wallpaper } from '@shared/types';

	export let activeWallpaper: Wallpaper | null = null;
	export let searchQuery: string = '';

	let inputValue = '';
	let hovered = false;
	let focused = false;
	let inputElement: HTMLInputElement | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let lastPushed = '';

	$: pinned = focused || searchQuery.trim().length > 0;
	$: showSearch = hovered || pinned;

	// Sync when parent clears searchQuery externally (e.g. "Clear search" button).
	$: if (searchQuery === '' && lastPushed !== '' && inputValue !== '') {
		clearTimeout(debounceTimer);
		inputValue = '';
		lastPushed = '';
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			searchQuery = inputValue;
			lastPushed = inputValue;
		}, 200);
	}

	function handleFocus() {
		focused = true;
	}

	function handleBlur() {
		focused = false;
		if (!inputValue.trim()) {
			clearTimeout(debounceTimer);
			searchQuery = '';
			lastPushed = '';
		}
	}

	async function clearSearch() {
		clearTimeout(debounceTimer);
		inputValue = '';
		searchQuery = '';
		lastPushed = '';
		await tick();
		inputElement?.focus();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (inputValue.trim()) {
				clearSearch();
			} else {
				inputElement?.blur();
				hovered = false;
			}
		}
	}

	onMount(() => {
		const handleGlobalKeydown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
				e.preventDefault();
				inputElement?.focus();
				inputElement?.select();
				return;
			}

			const target = e.target as HTMLElement;
			const isTyping =
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.tagName === 'SELECT' ||
				target.isContentEditable;

			if (
				!isTyping &&
				e.key === '/' &&
				!e.ctrlKey &&
				!e.metaKey &&
				!e.altKey &&
				!e.shiftKey
			) {
				e.preventDefault();
				inputElement?.focus();
			}
		};

		window.addEventListener('keydown', handleGlobalKeydown);
		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
			clearTimeout(debounceTimer);
		};
	});
</script>

<div
	class="status-search"
	class:show-search={showSearch}
	role="search"
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
>
	<div class="layer status-layer">
		<span class="label">{$t('wallpaper.toolbar.currentlyUsing')}</span>
		{#if activeWallpaper}
			<div class="value-container">
				{#key activeWallpaper.projectData?.title || activeWallpaper.folderName}
					<span
						in:fly={{ y: 10, duration: 300, delay: 100 }}
						out:fly={{ y: -10, duration: 300 }}
						class="value truncate-text"
						title={activeWallpaper.projectData?.title || activeWallpaper.folderName}
					>
						{activeWallpaper.projectData?.title || activeWallpaper.folderName}
					</span>
				{/key}
			</div>
		{/if}
		<span class="hint-icon">
			<Icon name="search" size={15} />
		</span>
	</div>

	<div class="layer search-layer">
		<Icon name="search" size={17} />
		<input
			type="text"
			aria-label={$t('wallpaper.search.placeholder')}
			placeholder={$t('wallpaper.search.placeholder')}
			bind:this={inputElement}
			bind:value={inputValue}
			on:input={handleInput}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:keydown={handleKeydown}
		/>
		{#if inputValue}
			<button
				class="clear-btn"
				tabindex="-1"
				title="Clear"
				on:mousedown|preventDefault
				on:click={clearSearch}
			>
				<Icon name="close" size={15} />
			</button>
		{/if}
	</div>
</div>

<style lang="scss">
	.status-search {
		display: grid;
		align-items: center;
		flex: 1 1 180px;
		min-width: 120px;
		height: 36px;
		padding: 0 12px;
		box-sizing: border-box;
		border-radius: 10px;
		border: 1px solid transparent;
		background: transparent;
		cursor: default;
		transition: var(--transition-base);

		&:hover {
			background: var(--bg-surface-hover);
		}

		&.show-search {
			background: var(--bg-surface);
			border-color: var(--border-color);
		}

		&:focus-within {
			border-color: var(--btn-primary-bg);
			box-shadow: 0 0 0 3px var(--focus-ring-light);
		}

		.layer {
			grid-area: 1 / 1;
			display: flex;
			align-items: center;
			gap: 8px;
			min-width: 0;
			transition:
				opacity 150ms ease,
				transform 150ms ease;
		}

		.status-layer {
			opacity: 1;

			.label {
				color: var(--text-muted);
				font-weight: 600;
				font-size: 0.85em;
				flex-shrink: 0;
			}

			.value-container {
				display: grid;
				flex-grow: 1;
				min-width: 0;
				overflow: hidden;

				> span {
					grid-area: 1 / 1;
				}
			}

			.value {
				color: var(--btn-primary-bg);
				font-weight: 700;
				text-transform: uppercase;
			}

			.truncate-text {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				display: inline-block;
				max-width: 100%;
			}

			.hint-icon {
				margin-left: auto;
				flex-shrink: 0;
				display: inline-flex;
				color: var(--text-muted);
				opacity: 0.5;
			}
		}

		.search-layer {
			opacity: 0;
			transform: translateY(4px);
			pointer-events: none;

			input {
				flex-grow: 1;
				min-width: 0;
				background: none;
				border: none;
				outline: none;
				color: var(--text-color);
				font-size: 0.9em;
				font-weight: 500;

				&::placeholder {
					color: var(--text-muted);
					opacity: 0.7;
				}
			}

			.clear-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				background: none;
				border: none;
				color: var(--text-muted);
				cursor: pointer;
				padding: 2px;
				border-radius: 50%;
				flex-shrink: 0;
				transition: var(--transition-base);

				&:hover {
					color: var(--text-color);
					background: var(--bg-surface-active);
				}
			}
		}

		&.show-search .status-layer {
			opacity: 0;
			transform: translateY(-4px);
			pointer-events: none;
		}

		&.show-search .search-layer {
			opacity: 1;
			transform: translateY(0);
			pointer-events: auto;
		}
	}
</style>
