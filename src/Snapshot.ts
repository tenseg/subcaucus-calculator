/**
 * Snapshot.ts
 * 
 * Holds all the information for a single snapshot.
 * Handles the calculation of delegates for a snapshot.
 * Handles conversion to and from JSON.
 */

// see https://github.com/ClickSimply/typescript-map
import { TSMap } from 'typescript-map'

// see: https://github.com/mojotech/json-type-validation
import { Decoder, object, string, number, dict } from '@mojotech/json-type-validation'

// local to this app
import * as _u from './Utilities'
import { Subcaucus } from './Subcaucus'

declare global {

	interface SnapshotInitializer {
		author: number
		created: TimestampString
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

	interface SnapshotJSON {
		author: number
		created: TimestampString
		revised: TimestampString
		revision: string
		name: string
		allowed: number
		seed: number
		subcaucuses: { [id: string]: SubcaucusJSON }
	}

}

export class Snapshot {

	snapshotID = ` ------ ${_u.uniqueNumber()} ------ `
	debug = (): string => {
		return "\nSnapshot" + this.snapshotID
			+ this.name + "/" + this.revision + "/" + this.allowed
			+ " " + this.subcaucuses.map((s) => s.debug()).join(", ")
	}
	created: TimestampString
	author: number
	revised: TimestampString
	revision: string
	name: string
	allowed: number
	seed: number
	subcaucuses: TSMap<number, Subcaucus>

	static decoder: Decoder<SnapshotJSON> = object({
		author: number(),
		created: string(),
		revised: string(),
		revision: string(),
		name: string(),
		allowed: number(),
		seed: number(),
		subcaucuses: dict(Subcaucus.decoder)
	})

	/**
	 * Creates a new snapshot instance.
	 * 
	 * ```typescript
	 * interface SnapshotInitializer {
	 *   author: number
	 *   created: TimestampString
	 *   with?: {
	 * 	   revised?: TimestampString
	 * 	   revision?: string
	 * 	   name?: string
	 * 	   allowed?: number
	 * 	   seed?: number
	 * 	   subcaucuses?: TSMap<number, Subcaucus>
	 *   }
	 *   json?: SnapshotJSON
	 * }
	 * ```
	 * 
	 * @param {SnapshotInitializer} init
	 */
	constructor(init: SnapshotInitializer) {
		this.created = init.created
		this.author = init.author
		this.revised = _u.now()
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

	}

	/**
	 * Provide a copy of this instance of a snapshot,
	 * including deep copies of the subcaucuses.
	 * 
	 * See: https://www.nickang.com/how-to-clone-class-instance-javascript/
	 */
	recreate = (): Snapshot => {
		// TSMap clones break classes and don't go deep enough
		// so we loop through and recreate subcaucuses
		let subcaucuses = new TSMap<number, Subcaucus>()
		this.subcaucuses.forEach((subcaucus) => {
			subcaucuses.set(subcaucus.id, subcaucus.recreate())
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
		const decoded = Snapshot.decoder.run(json)

		if (decoded.ok) {
			this.created = decoded.result.created
			this.author = decoded.result.author
			this.revised = decoded.result.revised
			this.revision = decoded.result.revision
			this.name = decoded.result.name
			this.allowed = decoded.result.allowed
			this.seed = decoded.result.seed
			this.subcaucuses = new TSMap<number, Subcaucus>()
			Object.keys(decoded.result.subcaucuses).forEach((key) => {
				const jsub = decoded.result.subcaucuses[key]
				const keyNum = Number(key)
				this.subcaucuses.set(keyNum, new Subcaucus({
					id: keyNum,
					json: jsub
				}))
			})
		} else {
			_u.debug(decoded.error)
		}
	}

	/**
	 * Update the snapshot with new values. 
	 * If signalling a change to subcaucuses
	 * just send without any update.
	 */
	revise = (update?: {
		name?: string,
		allowed?: number,
		seed?: number,
	}) => {
		// we mark the snapshot as revised even if no updates were sent
		// because it may be a signal that the subcaucuses changed
		this.revised = _u.now()
		this.revision = ""
		if (update) {
			if (update.name) {
				this.name = update.name
			}
			if (update.allowed) {
				this.allowed = update.allowed
			}
			if (update.seed) {
				this.seed = update.seed
			}
		}
	}

	/**
	 * Derive the appropriate meeting key from
	 * the data in this snapshot.
	 */
	meetingKey = (): string => {
		return `${this.created} ${this.author}`
	}

	/**
	 * The next ID in use for subcacuses in this snapshot.
	 * 
	 * One more than the current maximum ID.
	 */
	nextSubcaucusID = (): number => {
		if (this.subcaucuses.length === 0) {
			return 1
		}
		const max = Math.max(...this.subcaucuses.keys())
		return max + 1
	}

    /**
     * Add a subcaucus (empty by default).
     */
	addSubcaucus = (name = '', count = 0, delegates = 0) => {
		const newID = this.nextSubcaucusID()
		this.subcaucuses.set(newID, new Subcaucus({
			id: newID,
			with: {
				name: name,
				count: count,
				delegates: delegates
			}
		}))
	}

	/**
	 * Delete a subcaucus from this snapshot.
	 */
	deleteSubcaucus = (id: number) => {
		this.subcaucuses.delete(id)
	}

}