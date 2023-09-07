import { WowWindow } from "../WowWindow";

const boundaries = {
	x: [0.33, 0.66],
	y: [0.15, 0.66]
};

const textBoundaries = {
	x: [0.44, 0.56],
	y: [0.15, 0.19]
};
const textColor = {
	r: 255,
	g: 255,
	b: 0
};

export class WowFishBob {
	private gameWindow: WowWindow;
	private bobColor: Wow.Window.Color;
	private similarityThreshold: number;
	private splashCounter: number;
	private splashThreshold: number;
	public position: Wow.Window.Position = {
		x: -1,
		y: -1
	};

	constructor(gameWindow: WowWindow, bobColor: Wow.Window.Color, similarityThreshold: number, splashCounter: number, splashThreshold: number) {
		this.gameWindow = gameWindow;
		this.bobColor = bobColor;
		this.similarityThreshold = similarityThreshold;
		this.splashCounter = splashCounter;
		this.splashThreshold = splashThreshold;
	}

	async sleep(timeout: number) {
		return new Promise(resolve => setTimeout(resolve, timeout));
	}

	findBob() {
		const dimensions = this.gameWindow.getDimensions();
		const relativeBoundaries = {
			x: [
				Math.round(boundaries.x[0] * dimensions.width),
				Math.round(boundaries.x[1] * dimensions.width)
			],
			y: [
				Math.round(boundaries.y[0] * dimensions.height),
				Math.round(boundaries.y[1] * dimensions.height)
			]
		};

		let bestMatch = 0;
		let leftMost = dimensions.width;
		let rightMost = 0;
		let topMost = dimensions.height;
		let bottomMost = 0;

		const position: Wow.Window.Position = {x: -1, y: -1};
		const bitmap = this.gameWindow.readWindowPixels();
		for (let x=relativeBoundaries.x[0]; x<relativeBoundaries.x[1]; x += 5) {
			for (let y=relativeBoundaries.y[0]; y<relativeBoundaries.y[1]; y += 5) {
				const color = this.gameWindow.getPixelColor(bitmap, {x, y});
				const diff = this.compareColors(color, this.bobColor);
				if (diff > this.similarityThreshold) {
					if (diff > bestMatch) {
						bestMatch = diff;
						position.x = x;
						position.y = y;
					}

					if (x < leftMost)
						leftMost = x;
					else if (x > rightMost)
						rightMost = x;

					if (y < topMost)
						topMost = y;
					else if (y > bottomMost)
						bottomMost = y;

				}
			}
		}

		const relativeWidth = (rightMost - leftMost) / dimensions.width;
		const relativeHeight = (bottomMost - topMost) / dimensions.height;
		console.log(relativeWidth, relativeHeight)
		if (relativeWidth < 0.55 && relativeHeight < 0.55) {
			console.log("Use relatives...")
			this.position = {
				x: leftMost + ((rightMost - leftMost) / 2),
				y: topMost + ((bottomMost - topMost) / 2)
			}
		}

		this.position = position;
		return position.x !== -1 && position.y !== -1;
	}

	compareColors(a: Wow.Window.Color, b: Wow.Window.Color) {
		const distance = Math.sqrt(
			Math.pow(b.r - a.r, 2) +
			Math.pow(b.g - a.g, 2) +
			Math.pow(b.b - a.b, 2)
		  );
		
		  const maxDistance = Math.sqrt(255 * 255 * 3);
		  const similarity = 1 - (distance / maxDistance);
		
		  return similarity;
	}

	async waitForSplash() {
		let counter = 0;
		const startTime = Date.now();

		const originalPixelColor = this.gameWindow.readWindowPixel(this.position);
		while (counter < this.splashCounter && Date.now() - startTime < 15000) {
			const pixel = this.gameWindow.readWindowPixel(this.position);

			const diff = this.compareColors(pixel, originalPixelColor);
			if (diff < this.splashThreshold)
				counter++;
			else
				counter = 0;

			// console.log(diff, counter)

			await this.sleep(25);
		}

		return (Date.now() - startTime < 15000);
	}

	async detectNoFishHooked() {
		const dimensions = this.gameWindow.getDimensions();
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

		const bitmap = this.gameWindow.readWindowPixels();
		let count = 0;
		for (let x=relativeBoundaries.x[0]; x<relativeBoundaries.x[1]; x += 1) {
			for (let y=relativeBoundaries.y[0]; y<relativeBoundaries.y[1]; y += 1) {
				const color = this.gameWindow.getPixelColor(bitmap, {x, y});
				const diff = this.compareColors(color, textColor);
				if (diff > 0.9)
					count++;
			}
		}

		return count >= 100;

	}

}