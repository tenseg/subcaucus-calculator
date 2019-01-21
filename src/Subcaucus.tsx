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