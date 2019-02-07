// Utilities.tsx
//
// A number of helpful functions used throughout the app.
//
// Recommend this file be imported as:
// import * as _u from './Utilities'
//
// We use the name "_u" so that tslint won't complain if we
// do not actually use any _u functions in our file. This way
// we still can import the prototype extensions.

// Prototype extensions

declare global {

	type TimestampString = string
	type ComparisonValue = -1 | 0 | 1

	// about extending classes
	// see: https://stackoverflow.com/a/53392268/383737

	interface String {
		trim(): string
		hashCode(): number
		toDate(): Date
		csvQuoted(): string
	}

	interface Number {
		toCommaString(): string
		singularPlural(singular: string, plural: string): string
		comparisonValue(): ComparisonValue
		decimalPlaces(decimalPlaces: number): number
	}

	interface Array<T> {
		pushUnique(something: T): Array<T>
		max(): number
	}

	/**
	 * Converts a date to our typical timestamp string,
	 * which is really just JSON format with a type to be clearer.
	 */
	interface Date {
		toTimestampString(): TimestampString
	}

}

// see http://blog.stevenlevithan.com/archives/faster-trim-javascript
String.prototype.trim = function (): string {
	var str = this.replace(/^\s+/, '')
	for (var i = str.length - 1; i >= 0; i--) {
		if (/\S/.test(str.charAt(i))) {
			str = str.substring(0, i + 1)
			break
		}
	}
	return str
}

// https://stackoverflow.com/a/7616484
String.prototype.hashCode = function (): number {
	let hash = 0
	if (this.length === 0) return hash;
	for (let i = 0; i < this.length; i++) {
		let chr = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

String.prototype.toDate = function (): Date {
	return new Date(String(this))
}

String.prototype.csvQuoted = function (): string {
	return '"' + this.replace(/"/g, '""') + '"'
}

// see: https://stackoverflow.com/a/2901298
Number.prototype.toCommaString = function (): string {
	return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

Number.prototype.singularPlural = function (singular: string, plural: string, includeNumber?: 'no number'): string {
	const number = includeNumber != 'no number' ? `${this} ` : ''
	return `${number}${this == 1 ? singular : plural}`
}

Number.prototype.comparisonValue = function (): ComparisonValue {
	if (this < 0) return -1
	if (this > 0) return 1
	return 0
}

Number.prototype.decimalPlaces = function (decimalPlaces: number) {
	const multiple = Math.pow(10, decimalPlaces)
	return Math.round(Number(this) * multiple) / multiple
}

// see: https://stackoverflow.com/a/12803141
Array.prototype.pushUnique = function (something) {
	if (this.indexOf(something) === -1) {
		this.push(something)
	}
	return this
}

Array.prototype.max = function (): number {
	return this.reduce((accumulator, current) => {
		return Math.max(accumulator, current)
	})
}

/**
 * Converts a date to our typical timestamp string,
 * which is really just JSON format with a type to be clearer.
 */
Date.prototype.toTimestampString = function (): TimestampString {
	return this.toJSON()
}

// _u functions

/**
 * _u.debug
 * 
 * Pass along message and optionalParams to console.log
 * only if we are in a development environment.
 * 
 */
export function debug(message?: any, ...optionalParams: any[]) {
	if (isDebugging()) {
		console.log(message, ...optionalParams)
	}
}

var alertFunction: ((message: string) => void)

export function setAlertFunction(callback: ((message: string) => void)) {
	alertFunction = callback
}

export function alertUser(error: Error, ...optionalParams: any[]) {
	if (alertFunction) {
		alertFunction(error.message)
	} else {
		alert(error.message)
	}
	debug(error, ...optionalParams)
}

export function isDebugging(): boolean {
	return !process.env.NODE_ENV || process.env.NODE_ENV === "development" || getQueryVariable("debug") === "yes"
}

export function setApp(app: string, version?: string, build?: string) {
	window['_tg_app'] = app
	window['_tg_version'] = version
	window['_tg_build'] = build
}

export function getApp(): { app: string, version: string, build: string } {
	return {
		app: window['_tg_app'] || '',
		version: window['_tg_version'] || '',
		build: window['_tg_build'] || ''
	}
}

export function isApp(): boolean {
	return Boolean(window['_tg_app'])
}

export function getQueryVariable(variable: string) {
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (decodeURIComponent(pair[0]) == variable) {
			return decodeURIComponent(pair[1]);
		}
	}
	return undefined
}

/**
 * Unwrap the optional string, returning '' if it was undefined.
 * 
 * @param {string | undefined} maybeString
 * @param {string} empty An alternative string to return if the input was undefined.
 */
export function unwrapString(maybeString?: string, empty = ''): string {
	if (maybeString == undefined) return empty
	return maybeString
}

/**
 * Unwrap the optional number, returning 0 if it was undefined.
 * 
 * @param {string | undefined} maybeNumber
 * @param {string} empty An alternative number to return if the input was undefined.
 */
export function unwrapNumber(maybeNumber?: number, empty = 0): number {
	if (maybeNumber == undefined) return empty
	return maybeNumber
}

/**
 * Unwrap the optional boolean, returning false if it was undefined.
 * 
 * @param {string | undefined} maybeBoolean
 * @param {string} empty An alternative boolean value to return if the input was undefined.
 */
export function unwrapBoolean(maybeBoolean?: boolean, empty = false): boolean {
	if (maybeBoolean == undefined) return empty
	return maybeBoolean
}

/**
 * A random number provided by Math.random() to use as a seed
 * for our own random number sequences.
 * 
 * Note that in SubCalc1 we used seconds from Unix epoch as seeds,
 * but that makes it somewhat confusing by implying a connection between
 * the time and the seed. There really is no such connection.
 */
export function randomSeed(): number {
	return Math.floor(Math.random() * 1000000)
}

/**
 * Provides a uniqueNumber, simply counting up each time a number is provided.
 */
let _tg_counter = 0
export function uniqueNumber(): number {
	return _tg_counter++
}

/**
 * Returns the TimestampString of the current time.
 */
export function now(): TimestampString {
	return (new Date()).toTimestampString()
}