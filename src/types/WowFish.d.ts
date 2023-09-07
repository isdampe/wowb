declare namespace Wow.Fish {
	type Method = {
		name: string;
		bobConfig: Wow.Fish.Bob.Config;
		splashConfig: Wow.Fish.Splash.Config;
	};

	type Config = {
		windowTitle: string;
		keyBindings: {
			cast: string;
			clearChat: string;
		};
		methods: Record<string, Method>;
	};

	type Qty = {
		qty: number;
		timeSpent: number;
	};

	type Stat = {
		casts: {
			succeeded: Qty;
			failed: Qty;
			timedOut: Qty;
			couldNotFindBob: Qty;
		};
		loot: Qty;
	};
}