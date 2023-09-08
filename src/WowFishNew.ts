import { sleep } from "./lib/WowSleep";
import { WowWindow } from "./lib/WowWindow";
import { WowFishBob } from "./lib/fish/WowFishBob";
import { findSplash } from "./lib/fish/WowFishSplash";
import { readLoot } from "./lib/fish/WowFishReadLoot";
import fs from "fs";

class WowFish {
	private window: WowWindow;
	private config: Wow.Fish.Config;
	private stats: Record<string, Wow.Fish.Stat>;
	private sessionName: string;
	private startTime: Date;

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

		this.startTime = new Date();

		console.log("Launching. Please activate the game window.");
		await sleep(2000);

		while (true) {
			await this.loop(this.getRandomMethod());
			await sleep(250);
		}

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

		this.log(`Waiting to catch`);
		const foundSplash = await this.waitAndLoot(method, bob);
		if (! foundSplash) {
			this.setStat(method, "timedOut", startTime);
			return;
		}

		this.setStat(method, "succeeded", startTime);

		this.log("Succeeded in catch, checking loot...");

		await this.checkLoot(method);

		console.log(JSON.stringify(this.computeStats(), null, 2))
		console.log(`Loot per hour (${method.name}): ${this.computeHourlyRate(method)}`)

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

		await sleep(150);
		this.window.rightClick();

		return true;

	}

	async checkLoot(method: Wow.Fish.Method) {
		this.window.pressKey(this.config.keyBindings.clearChat);
		await sleep(250);
		
		const found = await readLoot(this.window, method.lootConfig);
		if (found) {
			console.log("Found loot, writing stats");
			this.stats[method.name].loot.qty++;
			this.writeStat();
		}
	}

	setStat(method: Wow.Fish.Method, context: "succeeded" | "failed" | "timedOut" | "couldNotFindBob", startTime: Date, qty = 1) {
		const timeSpent = Date.now() - startTime.getTime();
		this.log(`Setting stat for ${method.name} ${context}, time spent: ${timeSpent}ms`);

		this.stats[method.name].casts[context].timeSpent += timeSpent;
		this.stats[method.name].casts[context].qty += qty;
		this.writeStat();
	}

	computeStats() {
		return {
			stats: this.stats,
			startTime: this.startTime.toISOString(),
			endTime: new Date().toISOString(),
			durationMinutes: Math.round((Date.now() - this.startTime.getTime()) / 1000 / 60)
		};
	}

	computeHourlyRate(method: Wow.Fish.Method) {
		// Determine loot per minute
		const stats = this.computeStats();
		const lootPerMinute = stats.stats[method.name].loot.qty / stats.durationMinutes;
		return lootPerMinute * 60;
	}

	writeStat() {
		fs.promises.writeFile(`./stats/${this.sessionName}.json`, JSON.stringify(this.computeStats(), null, 2))
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
					similarityThreshold: 0.65,
					counter: 30
				},
				lootConfig: {
					color: {
						r: 244,
						g: 251,
						b: 53
					},
					similarityThreshold: 0.9,
					counter: 20
				}
			}
		}
	});
	wowFish.main();
}