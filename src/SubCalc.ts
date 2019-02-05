/**
 * SubCalcStorage.ts
 * 
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 */

// see https://github.com/ClickSimply/typescript-map
import { TSMap } from 'typescript-map'

// see: https://github.com/mojotech/json-type-validation
import { Decoder, object, string, number, array } from '@mojotech/json-type-validation'

// local to this app
import * as _u from './Utilities'
import { Snapshot } from './Snapshot'

declare global {

	/**
	 * JSON representation of subcalc2 in storage.
	 */
	interface SubCalcJSON {
		v: number
		device: number
		snapshot: SnapshotJSON
	}

}

/**
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 */
export class SubCalc {

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

		// then we look for local data
		// if found, it will override the values above

		this.read()

		// check to see if the read succeeded
		if (!this.snapshot.created) {

			// since no actual snapshot was assigned
			// we will get a real one now

			this.snapshot = this.newSnapshot()
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
			// TODO: check for old subcalc1 data
		}
	}

	/**
	 * Given a snapshot key, this functions looks for that meeting in
	 * local storage and returns a new meeting object to holding that information.
	 */
	readSnapshot = (storedSnapshotKey: string): Snapshot | undefined => {
		let json: SnapshotJSON

		try {
			json = JSON.parse(localStorage.getItem(storedSnapshotKey) || 'false')
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

}