/**
 * SubCalcStorage.ts
 * 
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 */

// see https://github.com/ClickSimply/typescript-map
import { TSMap } from 'typescript-map'
// local to this app
import * as _u from './Utilities'
import { Subcaucus } from './Subcaucus'

declare global {

	/**
	 * A snapshot of an meeting in time.
	 */
	interface MeetingSnapshot {
		created: TimestampString
		revised: TimestampString
		revision: string
		name: string
		allowed: number
		seed: number
		nextSubcaucusID: number
		subcaucuses: TSMap<number, Subcaucus>
	}

	interface Meeting {
		key: string
		created: TimestampString
		author: number
		current: MeetingSnapshot
		snapshots: TSMap<string, MeetingSnapshot>
	}

}

/**
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 */
export class SubCalcStorage {

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
	meetingPrefix = "sc-meeting"

	/**
	 * Create an instance of a storage object to manage local storage.
	 */
	constructor() {

		// then we look for local data

		this.importSubCalc2Data()

		if (!this.author) {

			this.importSubCalc1Data()

			if (!this.author) {

				// no prefix means that subcalc has never run in this browser
				// so we gather together some basics about this instance

				const created = (new Date()).toTimestampString()
				this.author = _u.randomSeed()
				this.currentMeetingKey = this.meetingKey(created)

				// since there was no data at all, we also don't have a
				// current meeting, so we have to create that and write
				// it out as well

				const currentSnapshot = this.emptyMeetingSnapshot(created)

				this.meetings.set(this.currentMeetingKey, {
					key: this.currentMeetingKey,
					author: this.author,
					created: created,
					current: currentSnapshot,
					snapshots: new TSMap<string, MeetingSnapshot>()
				})

				this.writeMeetingSnapshot(currentSnapshot)
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
	 * Create a new and empty snapshot of a meeting.
	 */
	emptyMeetingSnapshot = (created?: TimestampString): MeetingSnapshot => {
		if (created === undefined) {
			created = (new Date()).toTimestampString()
		}

		// create a subcaucus ID and three subcaucuses
		let nextSubcaucusID = 1
		let subcaucuses = new TSMap<number, Subcaucus>()
		subcaucuses.set(nextSubcaucusID, new Subcaucus(nextSubcaucusID++))
		subcaucuses.set(nextSubcaucusID, new Subcaucus(nextSubcaucusID++))
		subcaucuses.set(nextSubcaucusID, new Subcaucus(nextSubcaucusID++))

		return {
			created: created,
			revised: '',
			revision: '',
			name: '',
			allowed: 0,
			seed: _u.randomSeed(),
			nextSubcaucusID: nextSubcaucusID,
			subcaucuses: subcaucuses
		}
	}

	/**
	 * Writes the a meeting snapshot to local storage.
	 * 
	 * @param snapshot 
	 */
	writeMeetingSnapshot(snapshot: MeetingSnapshot) {
		const meetingKey = this.meetingKey(snapshot.created)
		const isCurrent = (snapshot.revision == '')
		const meeting = this.meetings.get(meetingKey)

		if (meeting) {
			// add the snapshot to our instance data
			if (isCurrent) {
				this.meetings.get(meetingKey).current = snapshot
			} else {
				this.meetings.get(meetingKey).snapshots[snapshot.revised] = snapshot
			}

			// synchronize our instance data with local storage
			this.writeMeeting(meeting)
		} else {
			_u.alertUser(new Error(`Meeting not found for ${meetingKey}`))
		}
	}

	/**
	 * Writes a meeting to local storage.
	 */
	writeMeeting = (meeting: Meeting) => {
		const jsonSubCalc = {
			v: this.version,
			author: this.author,
			current: meeting.key
		}

		try {
			const jsonSubCalcString = JSON.stringify(jsonSubCalc)
			_u.debug("storing subcalc2", jsonSubCalcString)
			localStorage.setItem("subcalc2", jsonSubCalcString)
		} catch (e) {
			_u.alertUser(new Error("Failed to save subcalc2 to local storage"), e)
			return
		}

		const jsonMeeting = {
			v: this.version,
			created: meeting.created,
			author: meeting.author,
			current: this.meetingSnapshotToJSON(meeting.current),
			snapshots: meeting.snapshots.map((snapshot) => {
				return this.meetingSnapshotToJSON(snapshot)
			})
		}

		const localStorageKey = `${this.meetingPrefix} ${meeting.key}`
		try {
			const jsonMeetingString = JSON.stringify(jsonMeeting)
			_u.debug(`storing ${localStorageKey}`, jsonMeetingString)
			localStorage.setItem(`${localStorageKey}`, jsonMeetingString)
		} catch (e) {
			_u.alertUser(new Error(`Error saving ${localStorageKey} to local storage`), e)
			return
		}
	}

	/**
	 * Create a JSON object from a meeting snapshot.
	 * 
	 * NOTE: This object is _not_ stringified yet.
	 */
	meetingSnapshotToJSON = (snapshot: MeetingSnapshot): Object => {
		return { ...snapshot, created: undefined, nextSubcaucusID: undefined }
	}

	importSubCalc1Data = () => {

	}

	importSubCalc2Data = () => {
		const subcalc = JSON.parse(localStorage.getItem("subcalc2") || 'false')

		if (!subcalc) return // we just don't have any subcalc2 data yet

		this.author = Number(subcalc["author"]) || 0

		if (!this.author) {
			_u.debug(new Error("No author in subcalc2"), subcalc)
			return // the subcalc2 data we have is malformed and will be overwritten
		}

		this.currentMeetingKey = String(subcalc["current"]) || ''

		const length = localStorage.length

		this.meetings = new TSMap<string, Meeting>()

		for (let i = 0; i < length; i++) {
			const key = localStorage.key(i)
			if (!key) break
			if (key.startsWith(this.meetingPrefix)) {
				const meeting = this.getMeetingFromLocalStorage(key)
				if (meeting) {
					this.meetings.set(meeting.key, meeting)
				}
			}
		}
	}

	getMeetingFromLocalStorage = (key: string): Meeting | undefined => {
		let jsonMeeting: Object

		try {
			jsonMeeting = JSON.parse(localStorage.getItem(key) || 'false')
		} catch (e) {
			_u.debug(e)
			return undefined
		}

		if (!jsonMeeting) {
			_u.debug(new Error(`Could not retreive ${key}`))
			return undefined
		}

		const author = Number(jsonMeeting["author"])
		const created = String(jsonMeeting["created"])

		if (!author || !created) {
			_u.debug(new Error(`Missing author or created in ${key}`), jsonMeeting)
			return undefined
		}

		const currentMeeting = this.jsonToMeetingSnapshot(jsonMeeting["current"], created)

		if (!currentMeeting) {
			_u.debug(new Error(`Could not find current snapshot in ${key}`), jsonMeeting)
			return undefined
		}

		if (!Array.isArray(jsonMeeting["snapshots"])) {
			_u.debug(new Error(`No "snapshots" array in ${key}`), jsonMeeting)
			return undefined
		}

		let snapshots = new TSMap<string, MeetingSnapshot>()

		jsonMeeting["snapshots"].forEach((jsonSnapshot: any) => {
			const snapshot = this.jsonToMeetingSnapshot(jsonSnapshot, created)
			if (snapshot) {
				snapshots.set(snapshot.revised, snapshot)
			}
		})

		return {
			key: this.meetingKey(created, author),
			author: author,
			created: created,
			current: currentMeeting,
			snapshots: snapshots
		}
	}

	jsonToMeetingSnapshot = (jsonSnapshot: any, created: TimestampString): MeetingSnapshot | undefined => {

		const revised = String(jsonSnapshot['revised'] || '')
		const revision = String(jsonSnapshot['revision'] || '')
		const name = String(jsonSnapshot['name'] || '')
		const allowed = Number(jsonSnapshot['allowed'] || 0)
		const seed = Number(jsonSnapshot['seed'])

		if (!seed) {
			_u.debug(new Error("Seed missing in snapshot"), jsonSnapshot)
			return undefined
		}

		const jsonSubcaucuses = jsonSnapshot['subcaucuses']

		if (typeof jsonSubcaucuses != "object") {
			_u.debug(new Error("Non-object subcaucuses"), jsonSnapshot)
			return undefined
		}

		let nextSubcaucusID = 0
		let subcaucuses = new TSMap<number, Subcaucus>()

		Object.keys(jsonSubcaucuses).forEach((key: any) => {
			key = Number(key)
			const subcaucus = this.jsonToSubcaucus(key, jsonSubcaucuses[key])
			if (subcaucus) {
				nextSubcaucusID = Math.max(nextSubcaucusID, key)
				subcaucuses.set(key, subcaucus)
			}
		})

		return {
			created: created,
			revised: revised,
			revision: revision,
			name: name,
			allowed: allowed,
			seed: seed,
			nextSubcaucusID: nextSubcaucusID,
			subcaucuses: subcaucuses
		}
	}

	jsonToSubcaucus = (key: number, jsonSubcaucus: any): Subcaucus | undefined => {

		if (typeof jsonSubcaucus != "object") {
			_u.debug(new Error(`Non-object subcaucus ${key}`), jsonSubcaucus)
			return undefined
		}

		return new Subcaucus(key, {
			name: jsonSubcaucus["name"],
			count: jsonSubcaucus["count"]
		})
	}

	/**
	 * Retrieve a snapshot (by default, the current meeting's current state),
	 * from storage.
	 * 
	 * NOTE: A side effect of this function is that the `currentMeetingKey`
	 * of the Storage instance is reset when retrieval is successful.
	 */
	getSnapshot = (meetingKey = '', timestamp?: string): MeetingSnapshot | undefined => {
		const { currentMeetingKey, meetings } = this

		if (meetingKey === '') {
			if (!currentMeetingKey) {
				_u.alertUser(new Error("No current meeting data"))
				return undefined
			}
			meetingKey = currentMeetingKey
		}

		const meeting = meetings[meetingKey]

		if (meeting === undefined) {
			_u.alertUser(new Error(`No data for meeting ${meetingKey}`))
			return undefined
		}

		if (timestamp === undefined) {
			this.currentMeetingKey = meetingKey
			return meeting.current
		}

		const snapshot = meeting.snapshots[timestamp]

		if (snapshot === undefined) {
			_u.alertUser(new Error(`No data for meeting ${currentMeetingKey} snapshot ${timestamp}`))
			return undefined
		}

		this.currentMeetingKey = meetingKey
		return snapshot
	}


}