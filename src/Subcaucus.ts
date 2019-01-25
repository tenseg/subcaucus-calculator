// we will need a way to type validate the json we import
// see https://github.com/mojotech/json-type-validation
// or maybe just use a JSON.parse reviver to type the data

declare global {
	interface SubcaucusInitializer {
		name?: string
		count?: number
		delegates?: number
	}
}

export class Subcaucus {

	readonly id: number
	name: string
	count: number
	delegates: number

	/**
	 * Creates a new subcacucus instance.
	 * 
	 * @param {number} withID required number
	 * @param {SubcaucusInitializer | undefined} init optional {name?: string, count?: number, delegates?: number}
	 */
	constructor(withID: number, init?: SubcaucusInitializer) {
		if (init === undefined) init = {}

		this.id = withID
		this.name = init["name"] ? String(init["name"]) : ''
		this.count = init["count"] ? Number(init["count"]) : 0
		this.delegates = init["delegates"] ? Number(init["delegates"]) : 0
	}

	toJSON = (): { name: string, count: number } => {
		return {
			name: this.name,
			count: this.count
		}
	}
}