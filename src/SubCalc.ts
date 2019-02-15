/**
 * SubCalcStorage.ts
 * 
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

// see: https://github.com/mojotech/json-type-validation
import { Decoder, object, number } from '@mojotech/json-type-validation'

// local to this app
import * as _u from './Utilities'
import { Snapshot } from './Snapshot'
import { SubCalcOne } from './SubCalcOne';
import { isArray } from 'util';

declare global {

	/**
	 * JSON representation of subcalc2 in storage.
	 * 
	```typescript
	interface SubCalcJSON {
		v: number
		device: number
		snapshot: SnapshotJSON
	}
	```
	 */
	interface SubCalcJSON {
		v: number
		device: number
		snapshot: SnapshotJSON
	}

}

export enum SubCalcUpgrades {
	None = '',
	New = 'new user',
	FromV1 = 'subcalc1'
}


/**
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 */
export class SubCalc {

	/**
	 * Consise textual representation of an instance of SubCalc for debugging.
	 */
	debug = (): string => {
		return this.snapshot.debug()
	}

	/**
	 * Version helps to future-proof the stored JSON.
	 */
	version = 2

	/**
	 * This device is just a random number that will help
	 * distinguish meeting identifiers if they start to be
	 * shared among devices. Hopefully a combination of 
	 * device and meeting creation date won't collide.
	 */
	device: number

	/**
	 * This is the snapshot that is currently being
	 * edited. The unique creator and device combo 
	 * will make it part of a "meeting".
	 * 
	 * This snapshot will always be its own unique object,
	 * separate from the saved snapshots. The saved snapshots
	 * are only used to "load up" this one. This is the only
	 * one the App ever tries to change.
	 */
	snapshot: Snapshot

	/**
	 * This is where we save snapshots awaiting import.
	 * 
	 * If there is more than one in the array, then the 
	 * first would be come the current snapshot and the
	 * remainder would be saved.
	 */
	incoming: Array<Snapshot> = []

	/**
	 * Set this to trigger special welcome messages for users.
	 */
	upgrade?: 'new' | 'subcalc1'

	/**
	 * A prefix to be used when creating local storage items
	 * for each snapshot.
	 */
	storedSnapshotPrefix = "sc-save"

	/**
	 * A prefix for snapshots in local storage trash.
	 */
	trashedSnapshotPrefix = "sc-trash"

	/**
	 * The json-type-validation decoder for this class.
	 */
	static decoder: Decoder<SubCalcJSON> = object({
		v: number(),
		device: number(),
		snapshot: Snapshot.decoder,
	})

	/**
	 * Create an instance of a storage object to manage local storage.
	 */
	constructor() {

		// no device means that subcalc has never run in this browser
		// so we gather together some basics about this instance

		this.device = _u.randomSeed()

		// a poorly formed snapshot to mark failure of the read
		this.snapshot = new Snapshot({ device: 0, created: "" })

		// store any incoming query items into the incoming variable
		this.query()

		// look for local data
		// if found, it will override the values above

		this.read()

		// check to see if the read succeeded
		if (!this.snapshot.created) {

			// since no actual snapshot was assigned
			// we will load the DFL examples

			this.saveAndShowExamples()
		}

	}

	/**
	 * Returns a string to be used to retrive a snapshot from local storage.
	 * 
	 * Returns the key for the current shapshot by default.
	 */
	storedSnapshotKey = (snapshot?: Snapshot) => {
		if (snapshot === undefined) {
			snapshot = this.snapshot
		}
		return `${this.storedSnapshotPrefix} ${snapshot.snapshotKey()}`
	}

	/**
	 * Return an array of all the snapshots found in local storage.
	 */
	snapshots = (status: 'saved' | 'trashed' = 'saved'): Array<Snapshot> => {
		let snapshots: Array<Snapshot> = []

		const length = localStorage.length
		const prefix = status === 'saved'
			? this.storedSnapshotPrefix
			: this.trashedSnapshotPrefix

		for (let i = 0; i < length; i++) {
			const storedKey = localStorage.key(i)
			if (!storedKey) break
			if (storedKey.startsWith(prefix)) {
				const snapshot = this.readSnapshot(storedKey)
				if (snapshot) {
					snapshots.push(snapshot)
				}
			}
		}

		return snapshots
	}

	/**
	 * Ensures that not only is the current meeting set properly,
	 * but that this change is reflected in local storage as well.
	 * Returns the new copy of the snapshot now considered current.
	 * 
	 * NOTE: This method recreates the snapshot as the current
	 * snapshot so that all connections to the orginal are broken.
	 */
	setSnapshot = (snapshot: Snapshot): Snapshot => {
		this.snapshot = snapshot.recreate()
		this.write()
		return this.snapshot
	}

	/**
	 * Creates a new snapshot, amounting to a new meeting.
	 */
	newSnapshot = (): Snapshot => {
		const created = _u.now()

		// first create a new snapshot and make it current
		const snapshot = new Snapshot({
			device: this.device,
			created: created
		})

		// add three subcaucuses to give the user a clue
		snapshot.addSubcaucus()
		snapshot.addSubcaucus()
		snapshot.addSubcaucus()

		// make this the current snapshot
		this.setSnapshot(snapshot)

		// note, we return the copy of the snapshot we
		// want used, which is this.snapshot, not snapshot
		return this.snapshot
	}

	/**
	 * Load the DFL example snapshots to help new users get oriented.
	 */
	saveAndShowExamples = () => {
		const time = new Date().getTime()
		const created = new Date(time - 120000).toTimestampString()

		const firstExample = new Snapshot({
			device: this.device,
			created: created,
			json: {
				"created": created,
				"device": this.device,
				"revised": new Date(time - 60000).toTimestampString(),
				"revision": "First Count",
				"name": "Example",
				"allowed": 6,
				"seed": 99938,
				"subcaucuses": {
					"1": {
						"name": "Subcaucus A",
						"count": 15
					},
					"2": {
						"name": "Subcaucus B",
						"count": 30
					},
					"3": {
						"name": "Subcaucus C",
						"count": 5
					}
				}
			}
		})

		const secondExample = new Snapshot({
			device: this.device,
			created: created,
			json: {
				"created": created,
				"device": this.device,
				"revised": new Date(time).toTimestampString(),
				"revision": "Second Count",
				"name": "Example",
				"allowed": 6,
				"seed": 99938,
				"subcaucuses": {
					"1": {
						"name": "Subcaucus A",
						"count": 15
					},
					"2": {
						"name": "Subcaucus B",
						"count": 30
					},
					"3": {
						"name": "Subcaucus C",
						"count": 1
					}
				}
			}
		})

		this.snapshot = firstExample
		this.writeSnapshot(firstExample)
		this.writeSnapshot(secondExample)
		this.upgrade = 'new'
	}

	/**
	 * Creates a duplicate of the current snapshot, 
	 * giving it a new created date and new name,
	 * amounting to a new meeting.
	 * 
	 * Note, it will keep the same random seed ("coin")
	 * as the original.
	 */
	duplicateSnapshot = (): Snapshot => {
		// first create a new snapshot and make it current
		this.snapshot.created = _u.now()
		this.snapshot.name = `Copy of ${this.snapshot.name}`
		this.snapshot.revised = this.snapshot.created
		this.snapshot.revision = ""

		// make this the current snapshot
		this.setSnapshot(this.snapshot)

		// note, we return the copy of the snapshot we
		// want used, which is this.snapshot, not snapshot
		return this.snapshot
	}

	/**
	 * Write the current subcalc2 item out to local storage.
	 * 
	 * This includes writing the current snapshot out.
	 */
	write = () => {
		const jsonSubCalc = {
			v: this.version,
			device: this.device,
			snapshot: this.snapshot.toJSON()
		}
		try {
			const jsonSubCalcString = JSON.stringify(jsonSubCalc)
			_u.debug("storing subcalc2", jsonSubCalcString)
			localStorage.setItem("subcalc2", jsonSubCalcString)
		} catch (e) {
			_u.alertUser(new Error("Failed to save subcalc2 to local storage"), e)
		}
	}

	/**
	 * Write a single snapshot to local storage.
	 * 
	 * Defaults to writing the current snapshot.
	 */
	writeSnapshot = (snapshot?: Snapshot) => {
		// default to this.snapshot and if it is this.snapshot then write the subcalc2 record
		if (!snapshot) {
			snapshot = this.snapshot
		}
		if (snapshot === this.snapshot) {
			this.write()
		}
		// if the snapshot is a revision, then save it in its own place as well
		if (snapshot.revision) {
			const storedSnapshotKey = this.storedSnapshotKey(snapshot)
			const jsnap = snapshot.toJSON()
			try {
				const jsnapString = JSON.stringify(jsnap)
				_u.debug(`storing ${storedSnapshotKey}`, jsnapString)
				localStorage.setItem(storedSnapshotKey, jsnapString)
			} catch (e) {
				_u.alertUser(new Error(`Error saving ${storedSnapshotKey} to local storage`), e)
				return
			}
		} else if (snapshot != this.snapshot) {
			_u.alertUser(new Error("Snapshot was not saved."), snapshot)
		}
	}

	/**
	 * Pass along a revision to the snapshot,
	 * then write the snapshot to local storage.
	 */
	reviseSnapshot = (update?: {
		name?: string,
		allowed?: number,
		seed?: number,
	}, snapshot?: Snapshot) => {
		if (!snapshot) {
			snapshot = this.snapshot
		}
		snapshot.revise(update)
		this.writeSnapshot()
	}

	/**
	 * Zero out the counts of all the subcaucuses in our snapshot.
	 */
	zeroSubcaucuses = () => {
		this.snapshot.clearCounts()
		this.writeSnapshot()
	}

	/**
	 * Saves a snapshot with the given revision name.
	 */
	saveSnapshot = (revision: string) => {
		this.snapshot.revision = revision
		this.writeSnapshot()
	}

	/**
	 * Uses the current snapshot to rename the meeting by propagating
	 * that change to all the other snapshots in the meeting.
	 */
	renameMeeting = (name: string) => {
		// rename the current snapshot
		this.snapshot.name = name
		this.write()
		const meetingKey = this.snapshot.meetingKey()
		this.snapshots().forEach((snapshot) => {
			if (snapshot.meetingKey() === meetingKey) {
				snapshot.name = name
				this.writeSnapshot(snapshot)
			}
		})
	}

	/**
	 * Remove a snapshot from local storage. If this is the last
	 * snapshot in a meeting, this will also remove the meeting.
	 * 
	 * NOTE: This method will not remove the "current" snapshot.
	 */
	trashSnapshot = (snapshot: Snapshot) => {
		const snapshotKey = snapshot.snapshotKey()
		const keyContent = localStorage.getItem(`${this.storedSnapshotPrefix} ${snapshotKey}`)
		if (keyContent) {
			localStorage.removeItem(`${this.storedSnapshotPrefix} ${snapshotKey}`)
			localStorage.setItem(`${this.trashedSnapshotPrefix} ${snapshotKey}`, keyContent)
		} else {
			_u.alertUser(new Error(`Could not find ${this.storedSnapshotPrefix} ${snapshotKey}`))
		}
	}

	/**
	 * Delete all the trashed snapshots from local storage.
	 */
	emptyTrash = () => {
		this.snapshots("trashed").forEach((snapshot) => {
			const snapshotKey = snapshot.snapshotKey()
			localStorage.removeItem(`${this.trashedSnapshotPrefix} ${snapshotKey}`)
		})
	}


	/**
	 * Try to populate this instance with subcalc2 data from local storage.
	 */
	read = () => {
		let json: SubCalcJSON

		try {
			json = JSON.parse(localStorage.getItem("subcalc2") || 'false')
		} catch (e) {
			_u.debug(e)
			return
		}

		if (json) {

			let decoded = SubCalc.decoder.run(json)

			if (decoded.ok) {
				if (this.version !== decoded.result.v) {
					_u.debug(`Expected subcalc version ${this.version}, got ${decoded.result.v}`)
				}
				this.device = decoded.result.device
				this.snapshot = new Snapshot({
					device: decoded.result.snapshot.device,
					created: decoded.result.snapshot.created,
					json: decoded.result.snapshot
				})
			} else {
				_u.debug(decoded.error)
			}

		} else {
			// try to populate this instance with subcalc1 data
			const subcalcOne = new SubCalcOne(this.device)
			if (subcalcOne.snapshot) {
				this.snapshot = subcalcOne.snapshot
				this.write()
				subcalcOne.saved.forEach((snapshot) => {
					this.writeSnapshot(snapshot)
				})
				this.upgrade = 'subcalc1'
			}

			// still nothing, look for incoming query data
			if (!this.snapshot && this.incoming.length > 0) {
				this.completeIncoming()
			}
		}
	}

	/**
	 * Given a snapshot key, this method looks for that meeting in
	 * local storage and returns a new meeting object to holding that information.
	 */
	readSnapshot = (storedSnapshotKey: string): Snapshot | undefined => {

		return this.decodeSnapshot(localStorage.getItem(storedSnapshotKey) || 'false')

	}

	/**
	 * Given a jsonString, this method tries to decode it into a Snapshot.
	 */
	decodeSnapshot = (jsonString: string): Snapshot | undefined => {
		let json: SnapshotJSON

		try {
			json = JSON.parse(jsonString)
		} catch (e) {
			_u.debug(e)
			return undefined
		}

		const decoded = Snapshot.decoder.run(json)

		if (decoded.ok) {
			return new Snapshot({
				created: decoded.result.created,
				device: decoded.result.device,
				json: decoded.result
			})
		} else {
			_u.debug(decoded.error)
		}

		return undefined
	}

	/**
	 * Given a jsonString, this method tries to decode it into an array of Snapshots.
	 */
	decodeSnapshots = (jsonString: string): Array<Snapshot> => {
		const result: Array<Snapshot> = []

		let json: any

		try {
			json = JSON.parse(jsonString)
		} catch (e) {
			_u.debug(e)
		}

		if (isArray(json)) {
			json.forEach((jsnap) => {
				const decoded = Snapshot.decoder.run(jsnap)

				if (decoded.ok) {
					result.push(new Snapshot({
						created: decoded.result.created,
						device: decoded.result.device,
						json: decoded.result
					}))
				} else {
					_u.debug(decoded.error)
				}
			})
		}

		return result
	}

	/**
	 * Given a jsonString, this method tries to decode it into a Snapshot.
	 */
	decodeCaucus = (jsonString: string): Snapshot | undefined => {
		let json: SnapshotJSON

		try {
			json = JSON.parse(jsonString)
		} catch (e) {
			_u.debug(e)
			return undefined
		}

		const decoded = SubCalcOne.caucusDecoder.run(json)

		if (decoded.ok) {
			const created = new Date(decoded.result.seed)
			const snapshot = new Snapshot({
				device: this.device,
				created: created.toTimestampString(),
				with: {
					name: "Imported from " + created.toLocaleDateString(),
					allowed: decoded.result.allowed,
					revised: created.toTimestampString(),
					revision: decoded.result.precinct || "via link"
				}
			})

			Object.keys(decoded.result.members).forEach((key) => {
				snapshot.addSubcaucus(decoded.result.names[key], decoded.result.members[key])
			})

			return snapshot

		} else {
			_u.debug(decoded.error)
		}

		return undefined
	}

	/**
	 * Finish importing from the query parameters.
	 */
	completeIncoming = () => {
		this.snapshot = this.incoming[0]
		this.write()
		this.incoming.forEach((snapshot) => {
			this.writeSnapshot(snapshot)
		})
		this.incoming = []
		this.snapshot.redistributeDelegates()
	}

	/**
	 * Clear local storage and our own copies.
	 */
	clear = () => {
		localStorage.clear()
	}

	/**
	 * Check the query for snapshots to import.
	 * 
	 * The query was already moved from the URL to local storage,
	 * this function will use the local storage version and then
	 * remove the query from local storage.
	 */
	query = (query?: string | undefined | null) => {

		if (!query) {
			query = localStorage.getItem("query") // may return null
		}

		if (!query) return

		_u.debug("found query")

		const params = new URLSearchParams(query)

		const caucus = decodeURIComponent(params.get("caucus") || '')
		const subcalc1 = decodeURIComponent(params.get("subcalc1") || '')
		const snap = decodeURIComponent(params.get("snapshot") || '')
		const subcalc2 = decodeURIComponent(params.get("subcalc2") || '')

		const debug = decodeURIComponent(params.get("debug") || '')

		if (subcalc2) {
			_u.debug("query subcalc2", subcalc2)
			const snapshots = this.decodeSnapshots(subcalc2)
			this.incoming.push(...snapshots)
		}

		if (snap) {
			_u.debug("query snapshot", snap)
			const snapshot = this.decodeSnapshot(snap)
			if (snapshot) this.incoming.push(snapshot)
		}

		if (subcalc1) {
			_u.debug("query subcalc1", subcalc1)
			localStorage.setItem("incoming", subcalc1)
			const incoming = new SubCalcOne(this.device, "incoming")
			localStorage.removeItem("incoming")
			this.incoming.push(...incoming.saved)
			this.upgrade = 'subcalc1'
		}

		if (caucus) {
			_u.debug("query caucus", caucus)
			const snapshot = this.decodeCaucus(caucus)
			if (snapshot) this.incoming.push(snapshot)
		}

		if (debug) {
			window['_tg_debug'] = true
		}

		localStorage.removeItem("query")
	}

}