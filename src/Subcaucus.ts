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
```typescript
interface SubcaucusInitializer {
	id: number
	with?: {
		name?: string
		count?: number
			delegates?: number
	}
	json?: SubcaucusJSON
}
```
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

	defaultName = () => {
		return `Subcaucus ${this.id}`
	}

	displayName = () => {
		return this.name || this.defaultName()
	}

	/**
	 * The viability number provided by the snapshot.
	 * This is the `delegateViability` number.
	 */
	viability = 0

	/**
	 * The number of delegates based on the simple viability number,
	 * before any remainders have been considered.
	 */
	baseDelegates = 0

	/**
	 * The remainder left after apportioning base delegates.
	 */
	remainder = 0

	/**
	 * Reported coin toss results.
	 */
	private _tosses: Array<{ won: boolean, against: Subcaucus }> = []

	/**
	 * This will flag subcaucuses which should report out
	 * the details of their coin tosses.
	 */
	reportTosses = false

	/**
	 * Clear all delegate calculation-related variables
	 * in preparation for a recalculation.
	 */
	clearDelegateInfo = () => {
		this.delegates = 0
		this.viability = 0
		this.baseDelegates = 0
		this.remainder = 0
		this.reportTosses = false
		this._tosses = []
	}

	/**
	 * Set the internal viability number and calculate base delegates
	 * and remainder values.
	 */
	setViability = (viability: number) => {
		this.viability = viability
		const delegateScore = this.count / this.viability
		this.baseDelegates = Math.floor(delegateScore)
		this.delegates = this.baseDelegates
		this.remainder = delegateScore - this.baseDelegates
	}

	/**
	 * Report coin tosses to the subcaucus.
	 */
	coinToss = (won: boolean, against: Subcaucus) => {
		this._tosses.push({ won: won, against: against })
	}

	/**
	 * An array of the last toss exchanged with each opponent subcaucus.
	 */
	tosses = (): Array<{ won: boolean, against: Subcaucus }> => {
		// return an empty array if we are not to be reporting any tosses
		if (!this.reportTosses) return []

		// we only want to convey the result of the last toss between two partners
		let tosses: { [props: string]: { won: boolean, against: Subcaucus } } = {}
		this._tosses.forEach((toss) => {
			tosses[String(toss.against.id)] = toss
		})
		return Object.keys(tosses).map((key) => tosses[key])
	}

	/**
	 * Add a delegate due to the remainder allocations.
	 */
	addRemainderDelegate = () => {
		this.delegates++
	}

	/**
	 * A textual representation of the subcaucus.
	 */
	asText = (): string => {
		let text = ''

		if (!this.name && !this.count) return text

		text += this.displayName() + ": "

		text += this.count.singularPlural("member", "members")

		if (this.delegates === 0) {
			text += " in a non-viable subcaucus."
			return text
		}

		text += " may elect " + this.delegates.singularPlural("delegate", "delegates")

		if (this.remainder) {
			text += " ("

			if (this.remainder) {
				text += "remainder " + this.remainder.decimalPlaces(3)
			}

			this.tosses().forEach((toss) => {
				text += ", " + (toss.won ? "won" : "lost") + " vs " + toss.against.displayName()
			})

			if (this.delegates > this.baseDelegates) {
				text += ", awarded a remainder delegate"
			}

			text += ")"
		}

		return text + "."
	}

	/**
	 * A CSV representation of the subcaucus.
	 */
	asCSV = (): string => {
		let csv = this.displayName().csvQuoted()

		if (!this.name && !this.count) return ''

		csv += ',' + this.count
		csv += ',' + this.delegates
		csv += ',' + this.remainder
		csv += ',' + this.tosses().map((toss) => {
			return (toss.won ? "won" : "lost") + " vs " + toss.against.displayName()
		}).join(', ').csvQuoted()
		csv += ',' + (this.delegates - this.baseDelegates)

		return csv
	}

}