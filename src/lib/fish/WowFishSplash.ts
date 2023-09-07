import { compareColors } from "../WowColor";
import { sleep } from "../WowSleep";
import { WowWindow } from "../WowWindow";
import { WowFishBob } from "./WowFishBob";

export const findSplash = async (gameWindow: WowWindow, config: Wow.Fish.Splash.Config, bob: WowFishBob) => {
	const dimensions = gameWindow.getDimensions();

	const splashWidth = 0.1 * dimensions.width;
	const splashHeight = 0.11 * dimensions.height;

	const relativeBoundaries = {
		x: [
			bob.position.x - Math.round(splashWidth / 2),
			bob.position.x + Math.round(splashWidth / 2)
		],
		y: [
			bob.position.y - Math.round(splashHeight / 2),
			bob.position.y + Math.round(splashHeight / 2)
		]
	};

	const startTime = Date.now();
	console.log(relativeBoundaries)
	while (Date.now() - startTime < 15000) {
		if (splashIsPresent(gameWindow, config, relativeBoundaries))
			return true;

		await sleep(100);
	}

	return false;

};

const splashIsPresent = (gameWindow: WowWindow, config: Wow.Fish.Splash.Config, relativeBoundaries: any) => {
	const bitmap = gameWindow.readWindowPixels();
	let count = 0;

	let best = 0;

	for (let x = relativeBoundaries.x[0]; x < relativeBoundaries.x[1]; x += 1) {
		for (let y = relativeBoundaries.y[0]; y < relativeBoundaries.y[1]; y += 1) {
			const color = gameWindow.getPixelColor(bitmap, { x, y });
			const diff = compareColors(color, config.color);
			if (diff > best)
				best = diff;
			if (diff > config.similarityThreshold)
				count++;
		}
	}

	return count >= config.counter;
}