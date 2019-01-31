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
		current: string
	}

}

/**
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 */
export class SubCalc {

	debug = (): string => {
		return "" + this.meetings.map((m) => m.debug()).join("\n")
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
	author = 0

	/**
	 * Used to find the current meeting.
	 */
	currentMeetingKey = ''

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
		current: string()
	})

	/**
	 * Create an instance of a storage object to manage local storage.
	 */
	constructor() {

		// then we look for local data

		this.readSubCalc2Data()

		if (!this.author) {

			this.readSubCalc1Data()

			if (!this.author) {

				// no author means that subcalc has never run in this browser
				// so we gather together some basics about this instance

				this.author = _u.randomSeed()

				// since there was no data at all, we also don't have a
				// current meeting, so we have to create that and write
				// it out as well

				this.newMeeting()
			}
		}


		// then we look for URI data
		// this would become current if we find it

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
	 */
	setCurrentMeetingKey = (meetingKey: string) => {
		this.currentMeetingKey = meetingKey
		const jsonSubCalc = {
			v: this.version,
			author: this.author,
			current: meetingKey
		}
		try {
			const jsonSubCalcString = JSON.stringify(jsonSubCalc)
			_u.debug("storing subcalc2", jsonSubCalcString)
			localStorage.setItem("subcalc2", jsonSubCalcString)
		} catch (e) {
			_u.alertUser(new Error("Failed to save subcalc2 to local storage"), e)
			return
		}
	}

	setCurrentSnapshot = (snapshot: Snapshot) => {
		const meeting = this.meetings.get(snapshot.meetingKey())
		meeting.setCurrentSnapshot(snapshot)
		this.setCurrentMeetingKey(meeting.key)
		this.writeMeeting(meeting)
	}

	/**
	 * Returns a meeting from the SubCalc instance's list of meetings.
	 * 
	 * Defaults to returning the current meeting.
	 */
	getMeeting = (meetingKey?: string): Meeting => {
		if (!meetingKey) {
			meetingKey = this.currentMeetingKey
		}
		this.setCurrentMeetingKey(meetingKey)
		return this.meetings.get(meetingKey)
	}

	/**
	 * Creates a new meeting and returns the current snapshot
	 * from that new meeting.
	 */
	newMeeting = (): Snapshot => {
		const created = (new Date()).toTimestampString()

		const snapshot = new Snapshot({
			author: this.author,
			created: created
		})
		const meetingKey = snapshot.meetingKey()

		this.meetings.set(meetingKey, new Meeting({
			key: meetingKey,
			author: this.author,
			with: {
				created: created,
				current: snapshot,
			}
		}))

		this.setCurrentMeetingKey(meetingKey)
		this.writeSnapshot(snapshot)

		return snapshot
	}

	/**
	 * Writes a meeting to local storage.
	 */
	writeMeeting = (meeting: Meeting) => {

		this.setCurrentMeetingKey(meeting.key)

		const jsonMeeting = meeting.toJSON()

		const storedMeetingKey = this.storedMeetingKey(meeting.key)
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
	 * Writes the a meeting snapshot to local storage.
	 */
	writeSnapshot(snapshot: Snapshot) {
		const meetingKey = snapshot.meetingKey()
		const isCurrent = (snapshot.revision === '')
		const meeting = this.meetings.get(meetingKey)
		const snapshotClone = snapshot.recreate()

		if (meeting) {
			// add the snapshot to our instance data
			if (isCurrent) {
				meeting.current = snapshotClone
			} else {
				meeting.snapshots.set(snapshot.revised, snapshotClone)
			}

			// synchronize our instance data with local storage
			this.writeMeeting(meeting)
		} else {
			_u.alertUser(new Error(`Meeting not found for ${meetingKey}`))
		}
	}

	/**
	 * Remove a whole meeting from local storage.
	 */
	deleteMeeting = (meetingKey: string) => {
		// if we are trying to delete the current meeting, 
		// then we must also clear the currentMeetingKey
		if (meetingKey == this.currentMeetingKey) {
			this.setCurrentMeetingKey('')
		}
		try {
			this.meetings.delete(meetingKey)
			localStorage.removeItem(`${this.storedMeetingPrefix} ${meetingKey}`)
		} catch (e) {
			_u.alertUser(new Error(`Failed to remove ${meetingKey} from local storage`), e)
			return
		}
	}


	/**
	 * Remove a snapshot from local storage.
	 * 
	 * NOTE: This method will not remove the "current" snapshot.
	 */
	deleteSnapshot = (snapshot: Snapshot) => {
		const meetingKey = this.meetingKey(snapshot.created)
		const isCurrent = (snapshot.revision == '')

		// we never delete the current snapshot
		if (isCurrent) return

		const meeting = this.meetings.get(meetingKey)

		// can't do anything with a meeting that does not exist
		if (!meeting) return

		meeting.snapshots.delete(snapshot.revised)

		this.writeMeeting(meeting)
	}

	/**
	 * TODO: Reads in original subcalc local storage
	 * and converts it to subcalc2.
	 */
	readSubCalc1Data = () => {

	}

	/**
	 * Try to populate this instance with subcalc2 data from local storage.
	 */
	readSubCalc2Data = () => {
		let json: SubCalcJSON

		try {
			json = JSON.parse(localStorage.getItem("subcalc2") || 'false')
		} catch (e) {
			_u.debug(e)
			return
		}

		let decoded = SubCalc.decoder.run(json)

		if (decoded.ok) {
			if (this.version !== decoded.result.v) {
				_u.debug(`Expected subcalc version ${this.version}, got ${decoded.result.v}`)
			}
			this.author = decoded.result.author
			this.currentMeetingKey = decoded.result.current
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
	}

	/**
	 * Given a meeting key, this functions looks for that meeting in
	 * local storage and returns a new meeting object to holding that information.
	 * 
	 * Defaults to reading in the current meeting from storage.
	 */
	readMeeting = (storedMeetingKey?: string): Meeting | undefined => {
		let json: MeetingJSON

		if (!storedMeetingKey) {
			storedMeetingKey = this.storedMeetingKey(this.currentMeetingKey)
		}

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