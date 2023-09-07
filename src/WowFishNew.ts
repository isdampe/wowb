import { sleep } from "./lib/WowSleep";
import { WowWindow } from "./lib/WowWindow";
import { WowFishBob } from "./lib/fish/WowFishBob";
import fs from "fs";
import { findSplash } from "./lib/fish/WowFishSplash";
import { detectNoFishHooked } from "./lib/fish/WowFishSuccess";

class WowFish {
	private window: WowWindow;
	private config: Wow.Fish.Config;
	private stats: Record<string, Wow.Fish.Stat>;
	private sessionName: string;

	constructor(config: Wow.Fish.Config) {
		this.config = config;
		this.window = new WowWindow(config.windowTitle);
		this.stats = {};

		for (const key in this.config.methods)  {
			this.stats[key] = {
				casts: {
					succeeded: {
						qty: 0,
						timeSpent: 0
					},
					failed: {
						qty: 0,
						timeSpent: 0
					},
					timedOut: {
						qty: 0,
						timeSpent: 0
					},
					couldNotFindBob: {
						qty: 0,
						timeSpent: 0
					}
				},
				loot: {
					qty: 0,
					timeSpent: 0
				}
			};
		}

		this.sessionName = `${new Date().toISOString().replace(/:/g, "-")}`;
	}

	private getRandomMethod() {
		const methods = Object.keys(this.config.methods);
		return this.config.methods[methods[Math.floor(Math.random() * methods.length)]];
	}

	private log(message: string) {
		console.log(message);
	}

	async main() {

		console.log("Launching. Please activate the game window.");
		await sleep(2000);

		while (true)
			await this.loop(this.getRandomMethod());

	}

	async loop(method: Wow.Fish.Method) {

		const startTime = new Date();
		this.log(`Starting loop at ${startTime.toISOString()}. Method: ${method.name}`);

		await this.cast();

		this.log(`Looking for bob`);
		const bob = await this.findBob(method);
		if (! bob) {
			this.setStat(method, "couldNotFindBob", startTime);
			return;
		}

		this.log(`Found bob at ${bob.position.x}, ${bob.position.y}`);
		this.window.moveMouseTo(bob.position);

		this.log(`Waiting to catch`);
		const foundSplash = await this.waitAndLoot(method, bob);
		if (! foundSplash) {
			this.setStat(method, "timedOut", startTime);
			return;
		}

		this.log(`Looted! Check if we succeeded...`);
		const noFish = detectNoFishHooked(this.window);
		if (noFish) {
			this.setStat(method, "failed", startTime);
			return;
		}

		this.setStat(method, "succeeded", startTime);

		this.log("Succeeded in catch, checking loot...");
		await sleep(1000);

	}

	async cast() {
		this.log(`Casting...`);
		this.window.pressKey(this.config.keyBindings.cast);
		this.window.moveMouseTo({
			x: 100,
			y: 100
		});

		await sleep(2500);
	}

	async findBob(method: Wow.Fish.Method) {
		const bob = new WowFishBob(this.window, method.bobConfig);

		await bob.findBob();
		if (bob.position.x === -1 || bob.position.y === -1)
			return null;

		return bob;
	}

	async waitAndLoot(method: Wow.Fish.Method, bob: WowFishBob) {
		const found = await findSplash(this.window, method.splashConfig, bob);
		if (! found)
			return false;

		this.window.pressKey(this.config.keyBindings.clearChat);

		this.window.moveMouseTo({
			x: bob.position.x,
			y: bob.position.y
		});

		await sleep(250);

		this.window.rightClick();
	}

	setStat(method: Wow.Fish.Method, context: "succeeded" | "failed" | "timedOut" | "couldNotFindBob", startTime: Date, qty = 1) {
		const timeSpent = Date.now() - startTime.getTime();
		this.log(`Setting stat for ${method.name} ${context}, time spent: ${timeSpent}ms`);

		this.stats[method.name].casts[context].timeSpent += timeSpent;
		this.stats[method.name].casts[context].qty += qty;
	}

	writeStat() {
		fs.promises.writeFile(`./stats/${this.sessionName}.json`, JSON.stringify(this.stats, null, 2))
			.catch(err => {
				this.log(`Error writing stat: ${err}`);
			});
	}

}

// Check if script is running as main module
if (require.main === module) {
	const wowFish = new WowFish({
		windowTitle: "Wow",
		keyBindings: {
			cast: "1",
			clearChat: "2"
		},
		methods: {
			methodB: {
				name: "methodB",
				bobConfig: {
					color: {
						r: 59,
						g: 38,
						b: 15
					},
					similarityThreshold: 0.95
				},
				splashConfig: {
					color: {
						r: 93,
						g: 249,
						b: 246
					},
					similarityThreshold: 0.58,
					counter: 5
				}
			}
		}
	});
	wowFish.main();
}