<script lang="ts">
	import Icon from '@/ui/Icon.svelte';

	export let icon: string | null = null;
	export let image: string | null = null;
	export let imageAlt: string = '';
	export let title: string = '';
	export let description: string = '';
</script>

<div class="empty-state">
	{#if image}
		<img src={image} alt={imageAlt} class="empty-image" />
	{:else if icon}
		<div class="empty-icon">
			<Icon name={icon} size={42} />
		</div>
	{/if}
	{#if title}
		<p class="empty-title">{title}</p>
	{/if}
	{#if description}
		<p class="empty-hint">{description}</p>
	{/if}
	<slot name="hint" />
	<div class="empty-actions">
		<slot />
	</div>
</div>

<style lang="scss">
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		max-width: 520px;
		padding: 12px;
		text-align: center;
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 84px;
		height: 84px;
		margin-bottom: 6px;
		border-radius: 50%;
		background: var(--bg-surface-hover);
		color: var(--text-muted);
	}

	.empty-image {
		width: 84px;
		height: 84px;
		object-fit: contain;
		filter: invert(1);
		opacity: 0.7;
		margin-bottom: 6px;
	}

	.empty-title {
		margin: 0;
		font-size: 1.35em;
		font-weight: 700;
	}

	.empty-hint {
		margin: 0;
		font-size: 1em;
		color: var(--text-muted);
		text-align: center;
		line-height: 1.5;
	}

	.empty-actions {
		display: flex;
		gap: 12px;
		margin-top: 6px;
		flex-wrap: wrap;
		justify-content: center;

		:global(button) {
			white-space: nowrap;
		}
	}
</style>
