// we will need a way to type validate the json we import
// see https://github.com/mojotech/json-type-validation
// or maybe just use a JSON.parse reviver to type the data

declare global {
	interface SubcaucusJSON {
		name: string,
		count: number
	}
	interface SubcaucusInitializer {
		id: number,
		with?: {
			name?: string
			count?: number
			delegates?: number
		},
		json?: SubcaucusJSON
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
	constructor(init: SubcaucusInitializer) {
		this.id = init.id

		this.name = ''
		this.count = 0
		this.delegates = 0

		if (init.with) {
			this.name = init.with["name"] || this.name
			this.count = init.with["count"] || this.count
			this.delegates = init.with["delegates"] || this.delegates
		}

		if (init.json) {
			this.fromJSON(init.json)
		}
	}

	clone = (): Subcaucus => {
		return new Subcaucus({
			id: this.id,
			with: {
				name: this.name,
				count: this.count,
				delegates: this.delegates,
			}
		})
	}

	toJSON = (): SubcaucusJSON => {
		return {
			name: this.name,
			count: this.count
		}
	}

	fromJSON = (json: SubcaucusJSON) => {
		this.name = json["name"]
		this.count = json["count"]
	}
}