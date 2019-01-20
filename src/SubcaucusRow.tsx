import * as React from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import * as _u from './Utilities'
import { Subcaucus } from './Subcaucus'

export type SubcaucusRowAction = 'sync' | 'remove' | 'enter' | State

interface Props {
	id: number
	exchange: ((subcaucusID: number, action: SubcaucusRowAction) => Subcaucus | undefined)
}

interface State {
	name: string
	count: number
	delegates: number
}

export class SubcaucusRow extends React.Component<Props, State> {

	constructor(props: Props) {
		super(props)
		this.state = {
			name: '',
			count: 0,
			delegates: 0,
		}
	}

	static getDerivedStateFromProps(nextProps: Props, prevState: State) {
		let newState = {}
		const subcaucus = nextProps.exchange(nextProps.id, 'sync')
		if (subcaucus) {
			newState = {
				name: subcaucus.name,
				count: subcaucus.count,
				delegates: subcaucus.delegates
			}
		}
		return newState
	}

	handleName = () => (event: React.FormEvent<HTMLTextAreaElement>) => {
		var value = event.currentTarget.value
		this.setState({ name: value })
		this.props.exchange(this.props.id, { ...this.state, name: value })
	}

	handleCount = () => (event: React.FormEvent<HTMLInputElement>) => {
		var num = Number(event.currentTarget.value)
		if (num < 0) {
			num = 0
		}
		this.setState({ count: num })
		this.props.exchange(this.props.id, { ...this.state, count: num })
	}

	handleKey = () => (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (event.key === 'Enter' || event.key === 'Tab') {
			this.props.exchange(this.props.id, 'enter')
		}
	}

	focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement>) => {
		// event properties must be copied to use async
		const target = event.currentTarget
		// do this async to try to make Safari behave
		setTimeout(() => target.setSelectionRange(0, 9999), 0)
	}

	remove = () => (event: React.MouseEvent<HTMLButtonElement>) => {
		this.props.exchange(this.props.id, 'remove')
		this.forceUpdate()
	}

	idPlus = (suffix: string): string | undefined => {
		return `subcaucus-${this.props.id}-${suffix}`
	}

	render() {
		_u.debug("render row", this.props.id, this.state)

		const { name, count, delegates } = this.state

		return (
			<div id={this.idPlus("row")} className="subcaucus-row">
				<Button id={this.idPlus("row-remove-button")}
					className="subcaucus-remove-button p-button-danger"
					icon="pi pi-times"
					onClick={this.remove()}
				/>
				<InputTextarea id={this.idPlus("row-name")}
					className="subcaucus-field subcaucus-name"
					type="text"
					value={name}
					rows={1}
					cols={1}
					// PrimeReact has a bug with the InputTextarea placeholder
					// for now, it will not update this placeholder
					// see: https://github.com/primefaces/primereact/issues/747
					// placeholder={`Subcaucus ${this.props.id}`}
					placeholder={`Subcaucus name`}
					onChange={this.handleName()}
					onKeyUp={this.handleKey()}
				/>
				<InputText id={this.idPlus("row-count")}
					className="subcaucus-field subcaucus-count"
					keyfilter="pint"
					type="text"
					pattern="\\d*"
					value={count ? count : ''}
					placeholder={`—`}
					onChange={this.handleCount()}
					onFocus={this.focusOnWholeText()}
					onKeyUp={this.handleKey()}
				/>
				<Button id={this.idPlus("row-delegates")}
					className={`subcaucus-delegates-button ${delegates > 0 ? "has-delegates p-button-success" : "p-button-secondary"}`}
					label={`${delegates ? delegates : "—"}`}
				/>
			</div>
		)
	}
}
