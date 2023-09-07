export const compareColors = (a: Wow.Window.Color, b: Wow.Window.Color) => {
	const distance = Math.sqrt(
		Math.pow(b.r - a.r, 2) +
		Math.pow(b.g - a.g, 2) +
		Math.pow(b.b - a.b, 2)
	);

	const maxDistance = Math.sqrt(255 * 255 * 3);
	const similarity = 1 - (distance / maxDistance);

	return similarity;
}