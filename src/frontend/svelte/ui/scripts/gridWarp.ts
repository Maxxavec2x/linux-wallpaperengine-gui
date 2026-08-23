import { tick } from 'svelte';

export function captureRects(gridElement: HTMLElement | null): Map<string, DOMRect> {
	const rectsByKey = new Map<string, DOMRect>();
	if (!gridElement) return rectsByKey;
	for (const element of gridElement.querySelectorAll<HTMLElement>('[data-flip-key]')) {
		const flipKey = element.dataset.flipKey;
		if (flipKey) rectsByKey.set(flipKey, element.getBoundingClientRect());
	}
	return rectsByKey;
}

export async function animateWarp(
	gridElement: HTMLElement | null,
	previousRectsByKey: Map<string, DOMRect>
) {
	if (!gridElement || previousRectsByKey.size === 0) return;
	await tick();
	for (const element of gridElement.querySelectorAll<HTMLElement>('[data-flip-key]')) {
		const flipKey = element.dataset.flipKey;
		if (!flipKey) continue;
		const previousRect = previousRectsByKey.get(flipKey);
		if (!previousRect) continue;
		const currentRect = element.getBoundingClientRect();
		const deltaX = previousRect.left - currentRect.left;
		const deltaY = previousRect.top - currentRect.top;
		if (deltaX === 0 && deltaY === 0) continue;
		if (Math.abs(deltaX) > 800 || Math.abs(deltaY) > 800) continue;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		const duration = Math.min(500, Math.max(200, distance * 0.7));
		element.animate(
			[{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: 'translate(0, 0)' }],
			{ duration, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
		);
	}
}
