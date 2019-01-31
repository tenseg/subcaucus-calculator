// we will need a way to type validate the json we import
// see https://github.com/mojotech/json-type-validation
// or maybe just use a JSON.parse reviver to type the data

// see https://github.com/ClickSimply/typescript-map
import { TSMap } from 'typescript-map'

// see: https://github.com/mojotech/json-type-validation
import { Decoder, object, string, array, number } from '@mojotech/json-type-validation'

// local to this app
import * as _u from './Utilities'
import { Snapshot } from './Snapshot'

declare global {

	/**
	 * An object with which to initialize a meeting.
	 * Both a `key` string and an `author` number are required.
	 */
	interface MeetingInitializer {
		key: string
		author: number
		with?: {
			created?: TimestampString
			current?: Snapshot
			snapshots?: TSMap<TimestampString, Snapshot>
		}
		json?: MeetingJSON
	}

	/**
	 * JSON representation of a meeting.
	 */
	interface MeetingJSON {
		v: number
		author: number
		created: TimestampString
		current: SnapshotJSON
		snapshots: Array<SnapshotJSON>
	}

}

/**
 * A meeting, made up of an author, a created timestamp,
 * and several snapshots.
 */
export class Meeting {

	meetingID = ` >>>>>> ${_u.uniqueNumber()} <<<<<< `
	debug = (): string => {
		return "\nMeeting " + this.meetingID
			+ this.current.name
			+ "\ncurrent " + this.current.debug()
			+ "\nsnapshots " + this.snapshots.map((s) => s.debug()).join("; ")
	}
	/**
	 * The identifier of this meeting,
	 * presently made up of the created timestamp
	 * and the author number.
	 */
	readonly key: string

	/**
	 * The author number of the creator of this meeting.
	 */
	author: number

	/**
	 * The time this meeting was created.
	 */
	created: TimestampString

	/**
	 * A snapshot of the most recent state of this meeting.
	 */
	current: Snapshot

	/**
	 * Snapshots of the state of this meeting named and saved by the user.
	 */
	snapshots: TSMap<TimestampString, Snapshot>


	/**
	 * A decoder to help validate JSON for this class.
	 */
	static decoder: Decoder<MeetingJSON> = object({
		v: number(),
		author: number(),
		created: string(),
		current: Snapshot.decoder,
		snapshots: array(Snapshot.decoder)
	})


	/**
	 * Creates a new meeting instance.
	 * 
	 * ```typescript
	 * interface MeetingInitializer {
	 *   key: string
	 *   author: number
	 *   with?: {
	 *     created?: TimestampString
	 *     current?: Snapshot
	 *     snapshots?: TSMap<string, Snapshot>
	 *   }
	 *   json?: MeetingJSON
	 * }
	 * ```
	 * Using `with` will assign the `current` and `snapshots` by reference,
	 * still connected to the instances that you send in.
	 * 
	 * Using the `json` option will create new instances of `current` and `snapshots`.
	 * 
	 * @param {MeetingInitializer} init
	 */
	constructor(init: MeetingInitializer) {
		this.key = init.key
		this.author = init.author

		this.created = (new Date()).toTimestampString()
		this.current = new Snapshot({ author: this.author, created: this.created })
		this.snapshots = new TSMap<TimestampString, Snapshot>()

		if (init.with) {
			this.created = init.with["created"] || this.created
			this.current = init.with["current"] || this.current
			this.snapshots = init.with["snapshots"] || this.snapshots
		}

		if (init.json) {
			this.fromJSON(init.json)
		}
	}

	/**
	 * Provides a deep copy of this meeting instance
	 * with no lingering deeper references.
	 */
	recreate = (): Meeting => {
		// TSMap clones break classes and don't go deep enough
		// so we loop through and recreate snapshots
		const snapshots = new TSMap<string, Snapshot>()
		this.snapshots.forEach((snapshot) => {
			snapshots.set(snapshot.revised, snapshot.recreate())
		})
		return new Meeting({
			key: this.key,
			author: this.author,
			with: {
				created: this.created,
				current: this.current.recreate(),
				snapshots: snapshots,
			}
		})
	}

	/**
	 * Converts this meeting instance into a JSON representation.
	 * 
	 * NOTE: This is _not_ yet stringified.
	 */
	toJSON = (): MeetingJSON => {
		return {
			v: 2,
			author: this.author,
			created: this.created,
			current: this.current.toJSON(),
			snapshots: this.snapshots.map((snapshot) => snapshot.toJSON())
		}
	}

	/**
	 * Fills this instace with data from a JSON representation
	 * of a meeting.
	 * 
	 * NOTE: This does _not_ parse a JSON string, but takes an actual object.
	 */
	fromJSON = (json: MeetingJSON) => {
		const decoded = Meeting.decoder.run(json)

		if (decoded.ok) {
			this.author = decoded.result.author
			this.created = decoded.result.created
			this.current = new Snapshot({
				author: this.author,
				created: this.created,
				json: decoded.result.current
			})
			this.snapshots = new TSMap<TimestampString, Snapshot>()
			decoded.result.snapshots.forEach((jsnap) => {
				this.snapshots.set(jsnap.revised, new Snapshot({
					author: jsnap.author,
					created: jsnap.created,
					json: jsnap
				}))
			})
		} else {
			_u.debug(decoded.error)
		}
	}

	/**
	 * Add a snapshot to the meeting using the current snapshot with a new name.
	 */
	addSnapshot = (revision: string) => {
		const snapshot = this.current.recreate()
		snapshot.revised = (new Date()).toTimestampString()
		snapshot.revision = revision
		this.snapshots.set(snapshot.revised, snapshot)
	}

	setCurrentSnapshot = (snapshot: Snapshot) => {
		this.current = snapshot.recreate()
	}
}