<script lang="ts">
	import Button from '@/ui/Button.svelte';
	import EmptyState from '@/ui/EmptyState.svelte';
	import steamIcon from '@/ui/icons/steam.png';

	export let searchError: string | null = null;
	export let onLaunchSteam: () => void;
	export let onRetry: () => void;
</script>

<div class="steam-fallback">
	<EmptyState
		image={steamIcon}
		imageAlt="Steam"
		title="Steam is not running"
		description="The Workshop browser requires Steam to be running in the background to fetch wallpapers."
	>
		<svelte:fragment slot="hint">
			{#if searchError}
				<div class="error-notice">
					<p><strong>Error:</strong> {searchError}</p>
				</div>
			{/if}
		</svelte:fragment>
		<Button variant="primary" on:click={onLaunchSteam}>
			Launch Steam
		</Button>
		<Button variant="secondary" on:click={onRetry}>
			Retry Connection
		</Button>
	</EmptyState>
</div>

<style lang="scss">
	.steam-fallback {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		text-align: center;
		background: var(--bg-surface);
		border-radius: 20px;
		margin-top: 10px;

			:global(.empty-hint) {
			max-width: 400px;
		}

		:global(.empty-actions) {
			margin-top: 8px;
		}

		.error-notice {
			width: 100%;
			max-width: 400px;
			padding: 12px 16px;
			background: var(--error-bg-translucent);
			border: 1px solid var(--error-color);
			border-radius: var(--radius-md);
			text-align: left;
			font-size: 0.9rem;

			p {
				color: var(--error-color);
				margin: 0;
				line-height: 1.6;
			}
		}
	}
</style>
