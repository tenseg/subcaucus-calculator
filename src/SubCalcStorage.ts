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
		created: string
		revised: string
		snapName: string
		name: string
		allowed: number
		seed: number
		subcacucuses: Array<Subcaucus>
	}

	interface Meeting {
		created: string
		current: MeetingSnapshot,
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
	currentMeetingKey = ''
	meetings = new TSMap<string, Meeting>()

	constructor() {

		// then we look for local data

		this.importSubCalc2Data()

		if (!this.author) {

			this.importSubCalc1Data()

			if (!this.author) {

				// no prefix means that subcalc has never run in this browser
				// so we gather together some basics about this instance

				const created = (new Date()).toJSON()
				this.author = _u.randomSeed()
				this.currentMeetingKey = this.meetingKey(created)

				// since there was no data at all, we also don't have a
				// current meeting, so we have to create that and write
				// it out as well

				const currentSnapshot = this.newMeetingSnapshot(created)

				this.meetings.set(this.currentMeetingKey, {
					created: created,
					current: currentSnapshot,
					snapshots: new TSMap<string, MeetingSnapshot>()
				})

				this.storeMeetingSnapshot(currentSnapshot)
			}
		}


		// then we look for URI data
		// this would become current if we find it

	}

	meetingKey = (created: string): string => {
		return `${this.author}-${created}`
	}

	newMeetingSnapshot = (created?: string): MeetingSnapshot => {
		if (created === undefined) {
			created = (new Date()).toJSON()
		}
		return {
			created: created,
			revised: '',
			snapName: '',
			name: '',
			allowed: 0,
			seed: _u.randomSeed(),
			subcacucuses: []
		}
	}

	storeMeetingSnapshot(snapshot: MeetingSnapshot) {
		const meetingKey = this.meetingKey(snapshot.created)
		const isCurrent = (snapshot.snapName == '')

		// add the snapshot to our instance data

		if (isCurrent) {
			this.meetings.get(meetingKey).current = snapshot
		} else {
			this.meetings.get(meetingKey).snapshots[snapshot.revised] = snapshot
		}

		// synchronize our instance data with local storage

		this.writeLocalStorage(meetingKey)
	}

	writeLocalStorage = (meetingKey: string) => {

		const meeting = this.meetings.get(meetingKey)

		if (meeting === undefined) {

		}

		const jsonSubCalc = {
			v: this.version,
			author: this.author,
			current: meetingKey,
			meetings: this.meetings.keys
		}

		try {
			const jsonSubCalcString = JSON.stringify(jsonSubCalc)
			console.log("storing subcalc2", jsonSubCalcString)
			localStorage.setItem("subcalc2", jsonSubCalcString)
		} catch (e) {
			alert(`Error saving subcalc2 to local storage: ${e.message}`)
			console.log(e)
			return
		}

		const jsonMeeting = {
			v: this.version,
			author: this.author,
			created: meeting.created,
			current: this.jsonForMeetingSnapshot(meeting.current),
			snapshots: meeting.snapshots.map((snapshot) => {
				return this.jsonForMeetingSnapshot(snapshot)
			})
		}

		try {
			const jsonMeetingString = JSON.stringify(jsonMeeting)
			console.log(`storing sc-${meetingKey}`, jsonMeetingString)
			localStorage.setItem(`sc-${meetingKey}`, jsonMeetingString)
		} catch (e) {
			alert(`Error saving sc-${meetingKey} to local storage: ${e.message}`)
			console.log(e)
			return
		}
	}

	jsonForMeetingSnapshot = (snapshot: MeetingSnapshot): Object => {
		let o: Object = { ...snapshot }
		let jsonSubcaucuses = {}

		snapshot.subcacucuses.forEach((subcaucus) => {
			jsonSubcaucuses[subcaucus.id] = {
				name: subcaucus.name,
				count: subcaucus.count
			}
		})

		o["Subcaucuses"] = jsonSubcaucuses

		return o
	}

	importSubCalc1Data = () => {

	}

	importSubCalc2Data = () => {

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
				const message = "No current meeting data"
				alert(message)
				console.log(new Error(message))
				return undefined
			}
			meetingKey = currentMeetingKey
		}

		const meeting = meetings[meetingKey]

		if (meeting === undefined) {
			const message = `No data for meeting ${meetingKey}`
			alert(message)
			console.log(new Error(message))
			return undefined
		}

		if (timestamp === undefined) {
			this.currentMeetingKey = meetingKey
			return meeting.current
		}

		const snapshot = meeting.snapshots[timestamp]

		if (snapshot === undefined) {
			const message = `No data for meeting ${currentMeetingKey} snapshot ${timestamp}`
			alert(message)
			console.log(new Error(message))
			return undefined
		}

		this.currentMeetingKey = meetingKey
		return snapshot
	}


}