/**
 * Snapshot.ts
 * 
 * Holds all the information for a single snapshot.
 * Handles the calculation of delegates for a snapshot.
 * Handles conversion to and from JSON.
 */

// see https://github.com/ClickSimply/typescript-map
import { TSMap } from 'typescript-map'
// local to this app
import * as _u from './Utilities'
import { Subcaucus } from './Subcaucus'

declare global {
	interface SnapshotJSON {
		created: TimestampString
		author: number
		revised: TimestampString
		revision: string
		name: string
		allowed: number
		seed: number
		subcaucuses: any
	}

	interface SnapshotInitializer {
		author: number,
		created: TimestampString,
		with?: {
			revised?: TimestampString
			revision?: string
			name?: string
			allowed?: number
			seed?: number
			subcaucuses?: TSMap<number, Subcaucus>
		},
		json?: SnapshotJSON
	}
}

export class Snapshot {

	readonly created: TimestampString
	readonly author: number
	revised: TimestampString
	revision: string
	name: string
	allowed: number
	seed: number
	subcaucuses: TSMap<number, Subcaucus>

	/**
	 * Creates a new snapshot instance.
	 * 
	 * NOTE: If there is an author number in the `init` object, it will override the
	 * author number from the `author` parameter.
	 * 
	 * @param {number} author author of the enclosing meeting number (may be overridden in init)
	 * @param {TimestampString} created date the enclosing meeting was created (may be overridden in init)
	 * @param {SnapshotInitializer | undefined} init optional `{created?: TimestampString, author?: number, revised?: TimestampString, revision?: string, name?: string, allowed?: number, seed?: number, subcaucuses?: TSMap<number, Subcaucus>}`
	 */
	constructor(init: SnapshotInitializer) {
		this.created = init.created
		this.author = init.author
		this.revised = (new Date()).toTimestampString()
		this.revision = ''
		this.name = ''
		this.allowed = 0
		this.seed = _u.randomSeed()
		this.subcaucuses = new TSMap<number, Subcaucus>()

		if (init.with) {
			this.revised = init.with["revised"] || this.revised
			this.revision = init.with["revision"] || this.revision
			this.name = init.with["name"] || this.name
			this.allowed = init.with["allowed"] || this.allowed
			this.seed = init.with["seed"] || this.seed
			if (init.with["subcaucuses"]) {
				this.subcaucuses = init.with["subcaucuses"]
			}
		}

		if (init.json) {
			this.fromJSON(init.json)
		}

		if (this.subcaucuses.length === 0) {
			this.subcaucuses.set(1, new Subcaucus({ id: 1 }))
			this.subcaucuses.set(2, new Subcaucus({ id: 2 }))
			this.subcaucuses.set(3, new Subcaucus({ id: 3 }))
		}

	}

	/**
	 * Provide a copy of this instance of a snapshot,
	 * including deep copies of the subcaucuses.
	 * 
	 * See: https://www.nickang.com/how-to-clone-class-instance-javascript/
	 */
	clone = (): Snapshot => {
		let subcaucuses = new TSMap<number, Subcaucus>()
		this.subcaucuses.forEach((subcaucus) => {
			subcaucuses.set(subcaucus.id, subcaucus.clone())
		})
		return new Snapshot({
			author: this.author,
			created: this.created,
			with: {
				revised: this.revised,
				revision: this.revision,
				name: this.name,
				allowed: this.allowed,
				seed: this.seed,
				subcaucuses: subcaucuses
			}
		})
	}

	/**
	 * Return a JSON object version of the data in this
	 * class wants to share.
	 */
	toJSON = (): {
		created: TimestampString
		author: number
		revised: TimestampString
		revision: string
		name: string
		allowed: number
		seed: number
		subcaucuses: any
	} => {
		return {
			created: this.created,
			author: this.author,
			revised: this.revised,
			revision: this.revision,
			name: this.name,
			allowed: this.allowed,
			seed: this.seed,
			subcaucuses: this.subcaucuses.toJSON(),
		}
	}

	fromJSON = (json: SnapshotJSON) => {

	}

	/**
	 * Derive the appropriate meeting key from
	 * the data in this snapshot.
	 */
	meetingKey = (): string => {
		return `${this.created} ${this.author}`
	}

	/**
	 * The maximum ID in use for subcacuses in this snapshot.
	 */
	maxSubcaucusID = (): number => {
		return Math.max(...this.subcaucuses.keys())
	}

	/**
	 * Add an empty subcaucus to this snapshot.
	 */
	addSubcaucus = () => {
		const newID = this.maxSubcaucusID() + 1
		this.subcaucuses.set(newID, new Subcaucus({ id: newID }))
	}

	/**
	 * Delete a subcaucus from this snapshot.
	 */
	deleteSubcaucus = (id: number) => {
		this.subcaucuses.delete(id)
	}

}