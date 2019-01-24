/**
 * Storage.ts
 * 
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 */
import * as _u from './Utilities'
import { Subcaucus } from './Subcaucus'

declare global {

	/**
	 * A snapshot of an meeting in time.
	 */
	interface MeetingSnapshot {
		created: string
		revised: string
		snapshot: string
		name: string
		allowed: number
		seed: number
		subcacucuses: Array<Subcaucus>
	}

	interface Meeting {
		current: MeetingSnapshot,
		snapshots: Array<MeetingSnapshot>
	}

}

/**
 * Manages storage in app or localStorage.
 * Handles conversion to and from JSON.
 */
export class Storage {

	prefix = 0
	currentMeetingKey = 0
	meetings: { [meetingKey: number]: Meeting } = {}

	constructor() {

		// then we look for local data

		this.importSubCalc2Data()

		if (!this.prefix) {

			this.importSubCalc1Data()

			if (!this.prefix) {

				// no prefix means that subcalc has never run in this browser
				// so we gather together some basics to be stored in subcalc2

				const created = (new Date()).toJSON()
				this.prefix = `${created} ${Math.random()}`.hashCode()
				this.currentMeetingKey = this.meetingKey(created)

				const subcalcJSON = JSON.stringify({
					version: 2,
					prefix: this.prefix,
					current: this.currentMeetingKey,
					meetings: [this.currentMeetingKey]
				})

				localStorage.setItem("subcalc2", subcalcJSON)

				// since there was no data at all, we also don't have a
				// current meeting, so we have to create that and write
				// it out as well

				const currentSnapshot = this.newMeetingSnapshot(created)

				this.meetings = {
					[this.currentMeetingKey]: {
						current: currentSnapshot,
						snapshots: []
					}
				}

				this.storeMeetingSnapshot(currentSnapshot)
			}
		}


		// then we look for URI data
		// this would become current if we find it

	}

	meetingKey = (created: string): number => {
		return `${this.prefix}-${created}`.hashCode()
	}

	newMeetingSnapshot = (created?: string): MeetingSnapshot => {
		if (created === undefined) {
			created = (new Date()).toJSON()
		}
		return {
			created: created,
			revised: '',
			snapshot: '',
			name: '',
			allowed: 0,
			seed: _u.randomSeed(),
			subcacucuses: []
		}
	}

	storeMeetingSnapshot(snapshot: MeetingSnapshot) {
		// const meetingKey = this.meetingKey(snapshot.created)

		// I AM HERE
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
	getSnapshot = (meetingKey = 0, timestamp?: string): MeetingSnapshot | undefined => {
		const { currentMeetingKey, meetings } = this

		if (!meetingKey) {
			if (!currentMeetingKey) {
				console.log(new Error("No current meeting data"))
				return undefined
			}
			meetingKey = currentMeetingKey
		}

		const meeting = meetings[meetingKey]

		if (meeting === undefined) {
			console.log(new Error(`No data for meeting ${meetingKey}`))
			return undefined
		}

		if (timestamp === undefined) {
			this.currentMeetingKey = meetingKey
			return meeting.current
		}

		const snapshot = meeting.snapshots.find((snapshot) => {
			return snapshot.revised === timestamp
		})

		if (snapshot === undefined) {
			console.log(new Error(`No data for meeting ${currentMeetingKey} snapshot ${timestamp}`))
			return undefined
		}

		this.currentMeetingKey = meetingKey
		return snapshot
	}


}