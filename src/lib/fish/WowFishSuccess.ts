import { compareColors } from "../WowColor";
import { WowWindow } from "../WowWindow";

const textBoundaries = {
	x: [0.44, 0.56],
	y: [0.15, 0.19]
};
const textColor = {
	r: 255,
	g: 255,
	b: 0
};

export const detectNoFishHooked = (gameWindow: WowWindow) => {
	const dimensions = gameWindow.getDimensions();
	const relativeBoundaries = {
		x: [
			Math.round(textBoundaries.x[0] * dimensions.width),
			Math.round(textBoundaries.x[1] * dimensions.width)
		],
		y: [
			Math.round(textBoundaries.y[0] * dimensions.height),
			Math.round(textBoundaries.y[1] * dimensions.height)
		]
	};

	const bitmap = gameWindow.readWindowPixels();
	let count = 0;
	for (let x = relativeBoundaries.x[0]; x < relativeBoundaries.x[1]; x += 1) {
		for (let y = relativeBoundaries.y[0]; y < relativeBoundaries.y[1]; y += 1) {
			const color = gameWindow.getPixelColor(bitmap, { x, y });
			const diff = compareColors(color, textColor);
			if (diff > 0.9)
				count++;
		}
	}

	return count >= 100;

};