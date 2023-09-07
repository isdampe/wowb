import { WowWindow } from "./lib/WowWindow";
import { WowFishBob } from "./lib/fish/WowFishBob";
import fs from "fs";

type TConfig = {
	windowTitle: string;
	fishKey: string;
	methods: {
		[key: string]: {
			color: Wow.Window.Color;
			similarityThreshold: number;
			splashThreshold: number;
			splashCounter: number;
		}
	}
};

type TStat = {
	[key: string]: {
		succeeded: number;
		failed: number;
		timeout: number;
	};
};

class WowFish {
	private window: WowWindow;
	private config: TConfig;
	private stats: TStat;
	private sessionName: string;

	constructor(config: TConfig) {
		this.config = config;
		this.window = new WowWindow(config.windowTitle);
		this.stats = {};

		for (const key in this.config.methods) 
			this.stats[key] = {succeeded: 0, failed: 0, timeout: 0};

		this.sessionName = `${new Date().toISOString().replace(/:/g, "-")}`;
	}

	async sleep(timeout: number) {
		return new Promise(resolve => setTimeout(resolve, timeout));
	}

	async main() {

		console.log("Launching. Please activate the game window.");
		await this.sleep(2000);

		while (true) {
			await this.loop();
			await this.sleep(250);
		}

	}

	async loop() {

		this.window.pressKey(this.config.fishKey);

		this.window.moveMouseTo({
			x: 50,
			y: 50
		});

		await this.sleep(2500);

		// Get random color from this.config.methods
		const methodKeys = Object.keys(this.config.methods);
		const randomMethodKey = methodKeys[Math.floor(Math.random() * methodKeys.length)];
		const randomColor = this.config.methods[randomMethodKey];

		console.log(`Picked the ${randomMethodKey} method.`);
		console.log("Searching for fishing bob...");
		const bob = this.findBob(randomColor.color, randomColor.similarityThreshold, randomColor.splashCounter, randomColor.splashThreshold);
		if (! bob) {
			console.log("Couldn't find bob!");
			return;
		}

		this.window.moveMouseTo({
			x: bob.position.x + 5,
			y: bob.position.y + 5
		});

		await this.sleep(500);

		console.log("Found bob at", bob.position);
		const foundSplash = await bob.waitForSplash();

		if (foundSplash) {
			console.log("Got it! Fishing...");
			this.window.rightClick();

			await this.sleep(750);
			
			const noFish = (await bob.detectNoFishHooked());
			console.log(noFish ? "Failed!" : "Succeeded!")

			this.stats[randomMethodKey][noFish ? "failed" : "succeeded"]++;
			await this.writeStatFile();

			console.log(this.stats);

		} else {
			console.log("Time out...");
			this.stats[randomMethodKey].timeout++;
			await this.writeStatFile();
		}
	}

	findBob(color: Wow.Window.Color, similarityThreshold: number, splashCounter: number, splashThreshold: number) {
		const bob = new WowFishBob(this.window, color, similarityThreshold, splashCounter, splashThreshold);

		bob.findBob();
		if (bob.position.x === -1 || bob.position.y === -1)
			return null;

		return bob;
	}

	async writeStatFile() {
		await fs.promises.writeFile(`./stats/${this.sessionName}.json`, JSON.stringify({
			methods: this.config.methods,
			stats: this.stats
		}, null, 2));
	}

}

// Check if script is running as main module
if (require.main === module) {
	const wowFish = new WowFish({
		windowTitle: "Wow",
		fishKey: "1",
		methods: {
			methodA: {
				similarityThreshold: 0.95,
				splashCounter: 8,
				splashThreshold: 0.9,
				color: {
					r: 59,
					g: 38,
					b: 15
				}
			},
			methodB: {
				similarityThreshold: 0.95,
				splashCounter: 12,
				splashThreshold: 0.85,
				color: {
					r: 59,
					g: 38,
					b: 15
				}
			},
			methodC: {
				similarityThreshold: 0.9,
				splashCounter: 15,
				splashThreshold: 0.85,
				color: {
					r: 59,
					g: 38,
					b: 15
				}
			},
			methodD: {
				similarityThreshold: 0.93,
				splashCounter: 8,
				splashThreshold: 0.9,
				color: {
					r: 56,
					g: 50,
					b: 26
				}
			},
			methodE: {
				similarityThreshold: 0.9,
				splashCounter: 9,
				splashThreshold: 0.88,
				color: {
					r: 29,
					g: 16,
					b: 7
				}
			}
		}
	});
	wowFish.main();
}