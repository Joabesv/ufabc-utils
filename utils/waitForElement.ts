export function waitForElement(selector: string, timeout = 5000) {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();
		const checkElement = () => {
			const element = document.querySelector(selector);
			console.log(element);
			if (element) {
				resolve(element);
			} else if (Date.now() - startTime > timeout) {
				reject(new Error(`Element ${selector} not found within ${timeout}ms`));
			} else {
				setTimeout(checkElement, 100);
			}
		};
		checkElement();
	});
}
