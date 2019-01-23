// we will need a way to type validate the json we import
// see https://github.com/mojotech/json-type-validation
// or maybe just use a JSON.parse reviver to type the data

export class Subcaucus {

	readonly id: number
	name: string
	count: number
	delegates: number

	constructor(withID: number, name = '', count = 0, delegates = 0) {
		this.id = withID
		this.name = name
		this.count = count
		this.delegates = delegates
	}
}