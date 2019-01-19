declare global {
	interface String {
		trim(): string
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

export function debug(message?: any, ...optionalParams: any[]) {
	if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
		console.log(message, ...optionalParams)
	}
}
