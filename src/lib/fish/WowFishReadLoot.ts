import { compareColors } from "../WowColor";
import { WowWindow } from "../WowWindow";
import { WowFishBob } from "./WowFishBob";

const LOOT_TEXT_BOUNDARIES = {
	x: [0.03, 0.242],
	y: [0.819, 0.867]
};

export const readLoot = async (gameWindow: WowWindow, config: Wow.Fish.ReadLoot.Config) => {
	const dimensions = gameWindow.getDimensions();

	const relativeBoundaries = {
		x: [
			Math.round(LOOT_TEXT_BOUNDARIES.x[0] * dimensions.width),
			Math.round(LOOT_TEXT_BOUNDARIES.x[1] * dimensions.width)
		],
		y: [
			Math.round(LOOT_TEXT_BOUNDARIES.y[0] * dimensions.height),
			Math.round(LOOT_TEXT_BOUNDARIES.y[1] * dimensions.height)
		]
	};

	const bitmap = gameWindow.readWindowPixels();
	let count = 0;

	for (let x = relativeBoundaries.x[0]; x < relativeBoundaries.x[1]; x += 1) {
		for (let y = relativeBoundaries.y[0]; y < relativeBoundaries.y[1]; y += 1) {
			const color = gameWindow.getPixelColor(bitmap, { x, y });
			const diff = compareColors(color, config.color);
			if (diff > config.similarityThreshold)
				count++;
		}
	}

	return count >= config.counter;
};