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

	interface String {
		trim(): string
	}

	interface Number {
		toCommaString(): string
		singularPlural(singular: string, plural: string): string
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

// see: https://stackoverflow.com/a/2901298
//     return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
Number.prototype.toCommaString = function (): string {
	return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

Number.prototype.singularPlural = function (singular: string, plural: string): string {
	return `${this} ${this == 1 ? singular : plural}`
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

export function isDebugging(): boolean {
	return !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
}

/**
 * _u.unwrap...
 * 
 * Unwrap the optional value returning either the actual value
 * or a resonable "empty" value if it was undefined.
 * 
 */

export function unwrapString(optional?: string, empty = ''): string {
	if (optional == undefined) return empty
	return optional
}

export function unwrapNumber(optional?: number, empty = 0): number {
	if (optional == undefined) return empty
	return optional
}

export function unwrapBoolean(optional?: boolean, empty = false): boolean {
	if (optional == undefined) return empty
	return optional
}