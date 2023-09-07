import { windowManager, Window } from "node-window-manager";
import RobotJS from "robotjs";
const robot = require("robotjs")

export class WowWindow {
	private windowTitle: string;
	private window: Window;
	private dimensions: Wow.Window.Dimensions;

	constructor(windowTitle = "Wow") {
		this.windowTitle = windowTitle;

		const windows = windowManager.getWindows();
		let found = false;
		for (const window of windows) {
			if (window.getTitle() === this.windowTitle) {
				this.window = window;
				found = true;
				break;
			}
		}

		if (! found)
			throw new Error(`Could not find window with title ${this.windowTitle}`);

		this.dimensions = this.getDimensions();
	}

	getDimensions(): Wow.Window.Dimensions {
		const bounds = this.window.getBounds();
		return {
			x: bounds.x,
			y: bounds.y,
			width: bounds.width,
			height: bounds.height
		};
	}

	windowPositionToScreenPosition(position: Wow.Window.Position) {
		const windowPosition = this.getDimensions();
		if (! windowPosition.x || ! windowPosition.y)
			throw new Error("Could not get window position");

		return {
			x: windowPosition.x + position.x,
			y: windowPosition.y + position.y
		};
	}

	focus() {
		this.window.show();
		this.window.bringToTop();
	}

	readWindowPixels() {
		return RobotJS.screen.capture(this.dimensions.x, this.dimensions.y, this.dimensions.width, this.dimensions.height);
	}

	getPixelColor(bitmap: RobotJS.Bitmap, position: Wow.Window.Position) {
		const pixelAtPositionB = bitmap.image[bitmap.bytesPerPixel * (position.x + position.y * bitmap.width)];
		const pixelAtPositionG = bitmap.image[bitmap.bytesPerPixel * (position.x + position.y * bitmap.width) + 1];
		const pixelAtPositionR = bitmap.image[bitmap.bytesPerPixel * (position.x + position.y * bitmap.width) + 2];

		return {
			r: pixelAtPositionR,
			g: pixelAtPositionG,
			b: pixelAtPositionB
		};
	}

	readWindowPixel(position: Wow.Window.Position) {
		const bitmap = RobotJS.screen.capture(this.dimensions.x + position.x, this.dimensions.y + position.y, 1, 1);
		return this.getPixelColor(bitmap, {x: 0, y: 0});
	}

	moveMouseTo(position: Wow.Window.Position) {
		RobotJS.moveMouse(this.dimensions.x + position.x, this.dimensions.y + position.y);
	}

	rightClick() {
		RobotJS.mouseClick("right");
	}

	pressKey(key: string) {
		RobotJS.keyTap(key);
	}

}