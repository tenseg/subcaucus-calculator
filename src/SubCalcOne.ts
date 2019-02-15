/**
 * SubCalcOne.ts
 * 
 * Manages retrieval of old subcalc v. 1 data from storage.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

// see: https://github.com/mojotech/json-type-validation
import { Decoder, object, string, number, array, dict } from '@mojotech/json-type-validation'

// local to this app
import * as _u from './Utilities'
import { Snapshot } from './Snapshot'

/**
 * JSON representation of subcalc1 in storage.
 * 
```typescript
interface SubCalcOneJSON {
	current: SubCalcOneCaucusJSON
	saved: {
		[key: string]: SubCalcOneSavedItemJSON
	}
}
```
 */
interface SubCalcOneJSON {
	current: SubCalcOneCaucusJSON
	saved: {
		[key: string]: SubCalcOneSavedItemJSON
	}
}

/**
 * JSON representation of a single saved subcalc1 item in storage.
 * 
```typescript
interface SubCalcOneSavedItemJSON {
	caucus: SubCalcOneCaucusJSON
	saved: number
}
```
 */
interface SubCalcOneSavedItemJSON {
	caucus: SubCalcOneCaucusJSON
	saved: number
}

/**
 * JSON representation of subcalc1 caucus in storage.
 * 
```typescript
interface SubCalcOneCaucusJSON {
	allowed: number
	members: { [key: string]: number }
	names: { [key: string]: string }
	precinct: string
	seed: number
}
```
 */
interface SubCalcOneCaucusJSON {
	allowed: number
	members: { [key: string]: number }
	names: { [key: string]: string }
	precinct: string
	seed: number
}

/**
 * Manages retrieval of old subcalc v. 1 data from storage.
 */
export class SubCalcOne {

	/**
	 * The json-type-validation decoder for subcalc v. 1 caucus JSON.
	 */
	static caucusDecoder: Decoder<SubCalcOneCaucusJSON> = object({
		allowed: number(),
		precinct: string(),
		seed: number(),
		names: dict(string()),
		members: dict(number())
	})

	/**
	 * The json-type-validation decoder for subcalc v. 1 saved item JSON.
	 */
	static savedItemDecoder: Decoder<SubCalcOneSavedItemJSON> = object({
		caucus: SubCalcOne.caucusDecoder,
		saved: number()
	})

	/**
	 * The json-type-validation decoder for subcalc v. 1 JSON.
	 */
	static decoder: Decoder<SubCalcOneJSON> = object({
		current: SubCalcOne.caucusDecoder,
		saved: dict(SubCalcOne.savedItemDecoder)
	})

	/**
	 * The updated version of the subcalc v. 1 current caucus.
	 */
	snapshot?: Snapshot

	/**
	 * An array of saved caucuses from the subcalc v. 1 data.
	 */
	saved: Array<Snapshot> = []

	/**
	 *  Device number (passed in at time of construction).
	 */
	device: number

	/**
	 * Create an instance of a storage object to manage local storage.
	 */
	constructor(device: number, storageKey = "subcalc") {

		this.device = device

		this.read(storageKey)

	}

	/**
	 * An awful synchronous sleep function. Only used to delay for initial migration.
	 */
	sleep = (ms: number) => {
		// see: https://stackoverflow.com/a/17936490/383737
		var now = new Date().getTime();
		while (new Date().getTime() < now + ms) { /* do nothing */ }
	}

	/**
	 * Try to populate this instance with subcalc v. 1 data from local storage.
	 */
	read = (storageKey: string) => {
		let json: SubCalcOneJSON

		// if we are running in the phone app, wait a few seconds
		// for the app to get a chance to stuff subcalc data into local storage
		if (_u.isApp()) {
			this.sleep(2000) // hack hack hack... very flimsy
		}

		try {
			json = JSON.parse(localStorage.getItem(storageKey) || 'false')
		} catch (e) {
			_u.debug(e)
			return
		}

		if (json) {

			if (json.current) {
				const decoded = SubCalcOne.caucusDecoder.run(json.current)

				if (decoded.ok) {
					this.snapshot = this.snapshotFromCaucus(decoded.result)
					this.snapshot.revision = "Latest"
					this.saved.push(this.snapshot)
				} else {
					_u.debug("error decoding current caucus from subcalc1", decoded.error)
				}
			}

			if (json.saved) {
				Object.keys(json.saved).forEach((key) => {
					const savedItem = json.saved[key]
					const decoded = SubCalcOne.savedItemDecoder.run(savedItem)
					if (decoded.ok) { // this reassures the compiler since we are in an anonymous function
						this.saved.push(
							this.snapshotFromCaucus(
								json.saved[key].caucus,
								json.saved[key].saved
							)
						)
					} else {
						_u.debug(`error decoding saved caucus ${key} from subcalc1`, decoded.error)
					}
				})
			}
		} else {
			_u.debug("No subcalc 1 data found")
		}
	}

	/**
	 * Creates a current style snapshot from v.1 style caucus data.
	 */
	snapshotFromCaucus = (caucus: SubCalcOneCaucusJSON, saved?: number): Snapshot => {
		const revised = saved
			? new Date(saved).toTimestampString()
			: new Date(caucus.seed).toTimestampString()

		const snapshot = new Snapshot({
			device: this.device,
			created: new Date(caucus.seed).toTimestampString(),
			with: {
				name: "Imported from " + (new Date(caucus.seed)).toLocaleDateString(),
				allowed: caucus.allowed,
				revised: revised,
				revision: caucus.precinct
			}
		})

		Object.keys(caucus.members).forEach((key) => {
			snapshot.addSubcaucus(caucus.names[key], caucus.members[key])
		})

		return snapshot
	}

}