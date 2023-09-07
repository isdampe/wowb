import { compareColors } from "../WowColor";
import { sleep } from "../WowSleep";
import { WowWindow } from "../WowWindow";
import fs from "fs"

const FishBobRelativeBoundaries = {
	x: [0.33, 0.66],
	y: [0.15, 0.66]
};

export class WowFishBob {
	private gameWindow: WowWindow;
	private config: Wow.Fish.Bob.Config;
	public position: Wow.Window.Position = {
		x: -1,
		y: -1
	};

	constructor(gameWindow: WowWindow, config: Wow.Fish.Bob.Config) {
		this.gameWindow = gameWindow;
		this.config = config;
	}

	async findBob() {
		const dimensions = this.gameWindow.getDimensions();
		const relativeBoundaries = {
			x: [
				Math.round(FishBobRelativeBoundaries.x[0] * dimensions.width),
				Math.round(FishBobRelativeBoundaries.x[1] * dimensions.width)
			],
			y: [
				Math.round(FishBobRelativeBoundaries.y[0] * dimensions.height),
				Math.round(FishBobRelativeBoundaries.y[1] * dimensions.height)
			]
		};

		this.gameWindow.moveMouseTo({
			x: relativeBoundaries.x[0],
			y: relativeBoundaries.y[0]
		});

		await sleep(250);

		this.gameWindow.moveMouseTo({
			x: relativeBoundaries.x[1],
			y: relativeBoundaries.y[0]
		})

		await sleep(250);

		this.gameWindow.moveMouseTo({
			x: relativeBoundaries.x[1],
			y: relativeBoundaries.y[1]
		})

		await sleep(250);

		this.gameWindow.moveMouseTo({
			x: relativeBoundaries.x[0],
			y: relativeBoundaries.y[1]
		})

		await sleep(250);

		let bestMatch = 0;

		const position: Wow.Window.Position = {x: -1, y: -1};
		const bitmap = this.gameWindow.readWindowPixels();
		for (let x=relativeBoundaries.x[0]; x<relativeBoundaries.x[1]; x += 1) {
			for (let y=relativeBoundaries.y[0]; y<relativeBoundaries.y[1]; y += 1) {
				const color = this.gameWindow.getPixelColor(bitmap, {x, y});
				const diff = compareColors(color, this.config.color);
				if (diff > this.config.similarityThreshold) {
					if (diff > bestMatch) {
						console.log(bestMatch, x, y, color, this.config.color)
						bestMatch = diff;
						position.x = x;
						position.y = y;
					}
				}
			}
		}


		this.position = position;
		console.log(this.position)
		return position.x !== -1 && position.y !== -1;
	}

}