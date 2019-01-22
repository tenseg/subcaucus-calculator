import * as React from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import * as _u from './Utilities'
import { Subcaucus } from './Subcaucus'

export type SubcaucusRowAction = 'sync' | 'enter' | State

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
		const subcaucus = this.props.exchange(this.props.id, 'sync')
		if (subcaucus) {
			this.state = {
				name: subcaucus.name,
				count: subcaucus.count,
				delegates: subcaucus.delegates
			}
		}
	}

	// static getDerivedStateFromProps(nextProps: Props, prevState: State) {
	// 	let newState = {}
	// 	const subcaucus = nextProps.exchange(nextProps.id, 'sync')
	// 	if (subcaucus) {
	// 		newState = {
	// 			name: subcaucus.name,
	// 			count: subcaucus.count,
	// 			delegates: subcaucus.delegates
	// 		}
	// 	}
	// 	return newState
	// }

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
	}

	notify = () => (event: React.FormEvent<HTMLInputElement>) => {
		this.props.exchange(this.props.id, { ...this.state })
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

	idPlus = (suffix: string): string | undefined => {
		return `subcaucus-${this.props.id}-${suffix}`
	}

	render() {
		_u.debug("render row", this.props.id, this.state)

		const { name, count, delegates } = this.state

		return (
			<div id={this.idPlus("row")}
				className={`subcaucus-row ${delegates > 0 ? "has-delegates" : ""}`}
			>
				{_u.isDebugging ? <div className="subcaucus-id">{this.props.id}</div> : ''}
				<InputTextarea id={this.idPlus("row-name")}
					className="subcaucus-field subcaucus-name"
					type="text"
					value={name}
					rows={1}
					cols={1}
					// PrimeReact has a bug with the InputTextarea placeholder
					// for now, it will not update this placeholder
					// see: https://github.com/primefaces/primereact/issues/747
					placeholder={`Subcaucus ${this.props.id}`}
					// placeholder={`Subcaucus name`}
					onChange={this.handleName()}
					onKeyUp={this.handleKey()}
				/>
				<InputText id={this.idPlus("row-count")}
					className="subcaucus-field subcaucus-count"
					keyfilter="pint"
					type="text"
					pattern="\d*"
					value={count ? count : ''}
					placeholder={`—`}
					onChange={this.handleCount()}
					onBlur={this.notify()}
					// forcing the selction of the whole text seems to lead to problems
					// see https://grand.clst.org:3000/tenseg/subcalc-pr/issues/3
					// onFocus={this.focusOnWholeText()}
					onKeyUp={this.handleKey()}
				/>
				<Button id={this.idPlus("row-delegates")}
					className={`subcaucus-delegates-button ${delegates > 0 ? "p-button-success" : "p-button-secondary"}`}
					label={`${delegates ? delegates : "—"}`}
				/>
			</div>
		)
	}
}
