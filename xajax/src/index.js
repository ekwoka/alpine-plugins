const xParser = new DOMParser();

export default function (Alpine) {
	Alpine.directive('ajax', async (el, { expression, modifiers }, { effect, evaluateLater }) => {

		const target = evaluateLater(expression);
		let query;

		if (modifiers.includes('query')) query = modifiers[modifiers.indexOf(modifiers.includes('class') ? 'class' : 'query') + 1];
		if (modifiers.includes('class')) query = '.' + query;

		effect(() => {
			target(async (target) => {
				if (!target) return el.dispatchEvent(new CustomEvent('halted', { detail: 'Target is not defined', ...eventDefaults }));
				try {
					const response = await fetch(target, { mode: 'no-cors' });
					if (!response.ok) throw new Error(response.statusText);
					const content = await response.text();
					const doc = xParser.parseFromString(content, 'text/html');

					// If both 'all' and 'children' modifiers, append '>*' to the query to select all children of the selected element.
					const updatedQuery = modifiers.includes('all') ?
						doc.body.querySelectorAll(modifiers.includes('children') ? query + '>*' : query) :
						doc.body.querySelector(query);

					const selector = query ? updatedQuery : doc.body;
					if (!selector) throw new Error('Selected element not found');

					el.dispatchEvent(new Event('load', eventDefaults));

					// Handles edge case where combination of all, replace, and children modifiers are used
					if (modifiers.includes('replace') && modifiers.includes('all') && modifiers.includes('children')) {
						if (selector instanceof NodeList) {
							console.log('xajax: Fetched NodeList:', selector);
							let fragment = document.createDocumentFragment();
							selector.forEach(node => {
								console.log('xajax: Node children:', node.children);
								Array.from(node.children).forEach(child => fragment.appendChild(child.cloneNode(true)));
							});
							console.log('xajax: Final fragment:', fragment);
							el.replaceWith(fragment);
							return;
						}
					}

					// Added Conditon for 'replace' and 'children' modifiers
					if (modifiers.includes('replace') && modifiers.includes('children')) return el.replaceWith(...selector.children);

					// Handle 'replace' modifier for NodeList case - spreads the NodeList and replaces the current element with all nodes from the list
					// Corrects behavior for the scenario where fetching all instances of an element and replacing them, but the element is not a direct child of the parent
					if (modifiers.includes('replace')) {
						if (selector instanceof NodeList) {
							el.replaceWith(...selector);
						} else {
							el.replaceWith(selector);
						}
						return;
					}

					if (modifiers.includes('all')) return el.replaceChildren(...selector);

					// Include a check for 'children' modifier
					if (selector.tagName == 'BODY' || modifiers.includes('children')) return el.replaceChildren(...selector.children);
					return el.replaceChildren(selector);
				} catch (e) {
					console.error(e);
					el.dispatchEvent(new Event('error', { detail: e, ...eventDefaults }));
				}
			});
		});
	});
}

const eventDefaults = {
	bubbles: false
};
