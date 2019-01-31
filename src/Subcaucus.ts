// we will need a way to type validate the json we import
// see https://github.com/mojotech/json-type-validation
// or maybe just use a JSON.parse reviver to type the data

// see: https://github.com/mojotech/json-type-validation
import { Decoder, object, string, optional, number, boolean } from '@mojotech/json-type-validation'

// local to this app
import * as _u from './Utilities'

declare global {

	interface SubcaucusInitializer {
		id: number
		with?: Partial<SubcaucusJSON>
		json?: SubcaucusJSON
	}

	interface SubcaucusJSON {
		name: string
		count: number
		delegates?: number
	}

}

export class Subcaucus {

	debug = (): string => {
		return `${this.name} (${this.count})`
	}
	readonly id: number
	name: string
	count: number
	delegates: number

	static decoder: Decoder<SubcaucusJSON> = object({
		name: string(),
		count: number(),
		delegates: optional(number())
	})

	/**
	 * Creates a new subcacucus instance.
	 * 
	 * ```typescript
	 * interface SubcaucusInitializer {
	 *   id: number
	 *   with?: {
	 *     name?: string
	 *     count?: number
	 * 	   delegates?: number
	 *   }
	 *   json?: SubcaucusJSON
	 * }
	 * ```
	 * @param {SubcaucusInitializer} init
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

	recreate = (): Subcaucus => {
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
		const decoded = Subcaucus.decoder.run(json)

		if (decoded.ok) {
			this.name = decoded.result.name
			this.count = decoded.result.count
			this.delegates = decoded.result.delegates || 0
		} else {
			_u.debug(decoded.error)
		}
	}
}