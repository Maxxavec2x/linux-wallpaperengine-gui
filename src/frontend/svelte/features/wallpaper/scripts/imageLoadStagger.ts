let counter = 0;

export function getNextLoadOrder(): number {
	const order = counter;
	counter = (counter + 1) % 10000;
	return order;
}

export function resetLoadOrder() {
	counter = 0;
}
