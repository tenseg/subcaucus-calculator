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
			name?: string
			created?: TimestampString
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
		name: string
		created: TimestampString
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
			+ this.name
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
	 * The name by which this meeting is known. This name is shared by all the snapshots.
	 */
	name: string

	/**
	 * The time this meeting was created.
	 */
	created: TimestampString

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
		name: string(),
		created: string(),
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
	 *     name?: string
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

		this.name = "No Name"
		this.created = _u.now()
		this.snapshots = new TSMap<TimestampString, Snapshot>()

		if (init.with) {
			this.name = init.with["name"] || this.name
			this.created = init.with["created"] || this.created
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
			name: this.name,
			created: this.created,
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
			this.name = decoded.result.name
			this.created = decoded.result.created
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

}