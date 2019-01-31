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
import { Meeting } from './Meeting'
import { Snapshot } from './Snapshot'

declare global {

	/**
	 * JSON representation of subcalc2 in storage.
	 */
	interface SubCalcJSON {
		v: number
		author: number
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
			+ "\n" + this.meetings.map((m) => m.debug()).join("\n")
	}

	/**
	 * Version helps to future-proof the stored JSON.
	 */
	version = 2

	/**
	 * This author is just a random number that will help
	 * distinguish meeting identifiers if they start to be
	 * shared among devices. Hopefully a combination of 
	 * author and meeting creation date won't collide.
	 */
	author: number

	/**
	 * This is the snapshot that is currently being
	 * edited. The unique creator and author combo 
	 * will make it part of a "meeting".
	 * 
	 * This snapshot will always be its own unique object,
	 * separate from the saved snapshots. The saved snapshots
	 * are only used to "load up" this one. This is the only
	 * one the App ever tries to change.
	 */
	snapshot: Snapshot

	/**
	 * A map of meeting keys to meeting records.
	 */
	meetings = new TSMap<string, Meeting>()

	/**
	 * A prefix to be used when creating local storage items
	 * for each meeting.
	 */
	storedMeetingPrefix = "sc-meeting"

	static decoder: Decoder<SubCalcJSON> = object({
		v: number(),
		author: number(),
		snapshot: Snapshot.decoder,
	})

	/**
	 * Create an instance of a storage object to manage local storage.
	 */
	constructor() {

		// no author means that subcalc has never run in this browser
		// so we gather together some basics about this instance

		this.author = _u.randomSeed()

		// a poorly formed snapshot to mark failure of the read
		this.snapshot = new Snapshot({ author: 0, created: "" })

		// then we look for local data
		// if found, it will override the values above

		this.read()

		// check to see if the read succeeded
		if (!this.snapshot.created) {

			// since no actual snapshot was assigned
			// we will get a real one now

			this.snapshot = this.newMeetingSnapshot()
		}

	}

	/**
	 * Returns a string to be used as a key for looking up a meeting.
	 */
	meetingKey = (created: TimestampString, author?: number): string => {
		// we include the author number in the key in case meetings are shared
		author = author || this.author
		return `${created} ${author}`
	}

	/**
	 * Returns a string to be used to retrive a meeting from local storage.
	 */
	storedMeetingKey = (meetingKey: string) => {
		return `${this.storedMeetingPrefix} ${meetingKey}`
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
	 * Returns a meeting from the SubCalc instance's list of meetings.
	 * 
	 * Defaults to returning the key of the current snapshot's meeting.
	 */
	getMeeting = (meetingKey?: string): Meeting => {
		if (!meetingKey) {
			meetingKey = this.snapshot.meetingKey()
		}
		return this.meetings.get(meetingKey)
	}

	/**
	 * Creates a new meeting and returns a new snapshot
	 * associated with that meeting. Note that the new
	 * snapshot will not be one saved to the meeting yet.
	 */
	newMeetingSnapshot = (): Snapshot => {
		const created = _u.now()

		// first create a new snapshot and make it current
		const snapshot = new Snapshot({
			author: this.author,
			created: created
		})
		this.setSnapshot(snapshot)

		// note, we return the copy of the snapshot we
		// want used, which is this.snapshot, not snapshot
		return this.snapshot
	}

	/**
	 * Write the current subcalc2 item out to local storage.
	 */
	write = () => {
		const jsonSubCalc = {
			v: this.version,
			author: this.author,
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
	 * Writes a meeting to local storage.
	 */
	writeMeeting = (meeting: Meeting) => {
		const storedMeetingKey = this.storedMeetingKey(meeting.key)
		const jsonMeeting = meeting.toJSON()

		try {
			const jsonMeetingString = JSON.stringify(jsonMeeting)
			_u.debug(`storing ${storedMeetingKey}`, jsonMeetingString)
			localStorage.setItem(storedMeetingKey, jsonMeetingString)
		} catch (e) {
			_u.alertUser(new Error(`Error saving ${storedMeetingKey} to local storage`), e)
			return
		}
	}

	/**
	 * Saves a snapshot with the given revision name.
	 */
	saveSnapshot = (revision: string) => {
		this.snapshot.revision = revision
		this.write() // writes the current snapshot to local storage

		const meetingKey = this.snapshot.meetingKey()
		const meeting = this.meetings.get(meetingKey)

		// if the meeting does not yet exist, then we create it
		if (!meeting) {
			const meeting = new Meeting({
				key: meetingKey,
				author: this.snapshot.author,
				with: {
					name: this.snapshot.name,
					created: this.snapshot.created,
				}
			})
			this.meetings.set(meetingKey, meeting)
		}

		// add a clone of the current snapshot to the meeting
		meeting.snapshots.set(this.snapshot.revised, this.snapshot.recreate())
		this.writeMeeting(meeting) // writes the meeting to local storage
	}

	/**
	 * Remove a whole meeting from local storage.
	 */
	deleteMeeting = (meetingKey: string) => {
		try {
			this.meetings.delete(meetingKey)
			localStorage.removeItem(`${this.storedMeetingPrefix} ${meetingKey}`)
		} catch (e) {
			_u.alertUser(new Error(`Failed to remove ${meetingKey} from local storage`), e)
			return
		}
	}


	/**
	 * Remove a snapshot from local storage. If this is the last
	 * snapshot in a meeting, this will also remove the meeting.
	 * 
	 * NOTE: This method will not remove the "current" snapshot.
	 */
	deleteSnapshot = (snapshot: Snapshot) => {
		const meetingKey = this.snapshot.meetingKey()
		const meeting = this.meetings.get(meetingKey)

		// can't do anything with a meeting that does not exist
		if (!meeting) {
			_u.alertUser(new Error(`Could not find ${meetingKey} from which to remove snapshot`))
			return
		}

		meeting.snapshots.delete(snapshot.revised)

		if (meeting.snapshots.length > 0) {
			this.writeMeeting(meeting)
		} else {
			this.deleteMeeting(meetingKey)
		}
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
				this.author = decoded.result.author
				this.snapshot = new Snapshot({
					author: decoded.result.snapshot.author,
					created: decoded.result.snapshot.created,
					json: decoded.result.snapshot
				})
			} else {
				_u.debug(decoded.error)
			}

			const length = localStorage.length

			this.meetings = new TSMap<string, Meeting>()

			for (let i = 0; i < length; i++) {
				const storedKey = localStorage.key(i)
				if (!storedKey) break
				if (storedKey.startsWith(this.storedMeetingPrefix)) {
					const meeting = this.readMeeting(storedKey)
					if (meeting) {
						this.meetings.set(meeting.key, meeting)
					}
				}
			}

		} else {
			// TODO: check for old subcalc1 data
		}
	}

	/**
	 * Given a meeting key, this functions looks for that meeting in
	 * local storage and returns a new meeting object to holding that information.
	 */
	readMeeting = (storedMeetingKey: string): Meeting | undefined => {
		let json: MeetingJSON

		try {
			json = JSON.parse(localStorage.getItem(storedMeetingKey) || 'false')
		} catch (e) {
			_u.debug(e)
			return undefined
		}

		const decoded = Meeting.decoder.run(json)

		if (decoded.ok) {
			return new Meeting({
				key: this.meetingKey(decoded.result.created, decoded.result.author),
				author: decoded.result.author,
				json: decoded.result
			})
		} else {
			_u.debug(decoded.error)
		}

		return undefined

	}

}