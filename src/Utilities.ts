/**
 * Utilities.ts
 *
 * A number of helpful functions used throughout the app.
 *
 * Recommend this file be imported as:
 * 
 * import * as _u from './Utilities'
 *
 * We use the name "_u" so that tslint won't complain if we
 * do not actually use any _u functions in our file. This way
 * we still can import the prototype extensions.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

// Prototype extensions

declare global {

	type TimestampString = string
	type ComparisonValue = -1 | 0 | 1

	// about extending classes
	// see: https://stackoverflow.com/a/53392268/383737

	interface String {

		/**
		 * Trim whitespace off both ends of a string.
		 */
		trim(): string

		/**
		 * Return a simple hash code for the string.
		 */
		hashCode(): number

		/**
		 * Turn this string into a `Date` object as best you can.
		 */
		toDate(): Date

		/**
		 * Make sure this string is quoted as it would need to be for CSV output.
		 */
		csvQuoted(): string
	}

	interface Number {

		/**
		 * Turn number into a string with commas to indicate thousands.
		 */
		toCommaString(): string

		/**
		 * Return one string if this number is a 1, 
		 * another string if it is anything else.
		 */
		singularPlural(singular: string, plural: string): string

		/**
		 * Turns values < 0 into -1, values > 0 into 1.
		 */
		comparisonValue(): ComparisonValue

		/**
		 * Round this number to this many places after the decimal point.
		 */
		decimalPlaces(decimalPlaces: number): number
	}

	interface Array<T> {

		/**
		 * Push this value onto the array only if it is not already there.
		 */
		pushUnique(something: T): Array<T>

		/**
		 * Return the maximum numeric value from this array.
		 */
		max(): number
	}

	/**
	 * Converts a date to our typical timestamp string,
	 * which is really just JSON format with a type to be clearer.
	 */
	interface Date {

		/**
		 * Render the date as a string consistently for this app.
		 */
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

/**
 * A placeholder for an alert callback function.
 */
var alertFunction: ((message: string) => void)

/**
 * Set the alert callback function.
 */
export function setAlertFunction(callback: ((message: string) => void)) {
	alertFunction = callback
}

/**
 * Alert the user to an error using either the alert callback function
 * or a plain JavaScript alert.
 */
export function alertUser(error: Error, ...optionalParams: any[]) {
	if (alertFunction) {
		alertFunction(error.message)
	} else {
		alert(error.message)
	}
	debug(error, ...optionalParams)
}

/**
 * Return true if we are debugging.
 */
export function isDebugging(): boolean {
	return !process.env.NODE_ENV || process.env.NODE_ENV === "development" || window['_tg_debug']
}

/**
 * Return an object with some version and build information about our iOS app.
 */
export function getApp(): { app: string, version: string, build: string } {
	return {
		app: process.env.REACT_APP_IOS_VERSION ? 'ios' : '',
		version: process.env.REACT_APP_IOS_VERSION || '',
		build: process.env.REACT_APP_IOS_BUILD || ''
	}
}

/**
 * Return true if this site is being run inside of an iOS app.
 */
export function isApp(): boolean {
	return Boolean(process.env.REACT_APP_IOS_VERSION)
}

/**
 * Return the value of a query key, if it exists.
 */
export function getQueryVariable(key: string): string | undefined {
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (decodeURIComponent(pair[0]) == key) {
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
export function uniqueNumber(): number {
	window['_tg_counter'] = window['_tg_counter'] || 1
	return window['_tg_counter']++
}

/**
 * Returns the TimestampString of the current time.
 */
export function now(): TimestampString {
	return (new Date()).toTimestampString()
}

/**
 * Create a file download link, click it, and remove it.
 * 
 * NOTE: Will have to rethink this for non-string formats.
 */
export function download(data: string, filename: string, mime = 'text/plain') {

	if (typeof window.navigator.msSaveBlob !== 'undefined') {
		// IE workaround for "HTML7007: One or more blob URLs were 
		// revoked by closing the blob for which they were created. 
		// These URLs will no longer resolve as the data backing 
		// the URL has been freed."
		const blob = new Blob([data], { type: mime || 'application/octet-stream' });
		window.navigator.msSaveBlob(blob, filename);
	}
	else {
		const element = document.createElement('a')
		element.setAttribute('href', `data:${mime};charset=utf-8,` + encodeURIComponent(data))
		element.setAttribute('download', filename)
		element.style.display = 'none'
		document.body.appendChild(element)
		element.click()
		document.body.removeChild(element)
	}
}

/**
 * Copy the string to the clipboard.
 */
export function copyToClipboard(data: string): boolean {
	var textArea = document.createElement("textarea");

	//
	// *** This styling is an extra step which is likely not required. ***
	//
	// Why is it here? To ensure:
	// 1. the element is able to have focus and selection.
	// 2. if element was to flash render it has minimal visual impact.
	// 3. less flakyness with selection and copying which **might** occur if
	//    the textarea element is not visible.
	//
	// The likelihood is the element won't even render, not even a flash,
	// so some of these are just precautions. However in IE the element
	// is visible whilst the popup box asking the user for permission for
	// the web page to copy to the clipboard.
	//
	// see: https://stackoverflow.com/a/30810322/383737

	// Place in top-left corner of screen regardless of scroll position.
	textArea.style.position = 'fixed';
	textArea.style.top = '0';
	textArea.style.left = '0';

	// Ensure it has a small width and height. Setting to 1px / 1em
	// doesn't work as this gives a negative w/h on some browsers.
	textArea.style.width = '2em';
	textArea.style.height = '2em';

	// We don't need padding, reducing the size if it does flash render.
	textArea.style.padding = '0';

	// Clean up any borders.
	textArea.style.border = 'none';
	textArea.style.outline = 'none';
	textArea.style.boxShadow = 'none';

	// Avoid flash of white box if rendered for any reason.
	textArea.style.background = 'transparent';


	textArea.value = data;

	document.body.appendChild(textArea);
	textArea.focus();

	// textArea.select();
	// do this async to try to make Safari behave
	// see: https://stackoverflow.com/a/34046084
	textArea.contentEditable = 'true'
	textArea.readOnly = false

	const range = document.createRange()
	range.selectNodeContents(textArea)

	const selection = window.getSelection()
	selection.removeAllRanges()
	selection.addRange(range)

	textArea.setSelectionRange(0, 99999)

	const success = document.execCommand("copy")

	document.body.removeChild(textArea)

	return success
}