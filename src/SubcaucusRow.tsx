import * as React from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
// import { debug } from './Utilities'
import { Subcaucus } from './Subcaucus'

interface Props {
	subcaucus: Subcaucus
	onChange?: ((subcaucus: Subcaucus, action?: 'remove' | 'enter') => void)
}
interface State {
	id: number
	name: string
	count: number
	delegates: number
}

export class SubcaucusRow extends React.Component<Props, State> {

	subcaucus: Subcaucus

	constructor(props: Props) {
		super(props)
		this.subcaucus = { ...this.props.subcaucus }
		this.state = {
			id: this.subcaucus.id,
			name: this.subcaucus.name,
			count: this.subcaucus.count,
			delegates: this.subcaucus.delegates,
		}
	}

	handleName = () => (event: React.FormEvent<HTMLTextAreaElement>) => {
		var value = event.currentTarget.value
		this.subcaucus.name = value.trim()
		this.setState({ name: value })
		if (this.props.onChange) {
			this.props.onChange(this.subcaucus)
		}
	}

	handleCount = () => (event: React.FormEvent<HTMLInputElement>) => {
		var num = Number(event.currentTarget.value)
		if (num < 0) {
			num = 0
		}
		this.subcaucus.count = num
		this.setState({ count: num })
		if (this.props.onChange) {
			this.props.onChange(this.subcaucus)
		}
	}

	handleKey = () => (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (event.key === 'Enter') {
			if (this.props.onChange) {
				this.props.onChange(this.subcaucus, 'enter')
			}
		}
	}

	focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement>) => {
		// event properties must be copied to use async
		const target = event.currentTarget
		// do this async to try to make Safari behave
		setTimeout(() => target.setSelectionRange(0, 9999), 0)
	}

	remove = () => (event: React.MouseEvent<HTMLButtonElement>) => {
		if (this.props.onChange) {
			this.props.onChange(this.subcaucus, 'remove')
		}
	}

	idPlus = (suffix: string): string | undefined => {
		return `subcaucus-${this.subcaucus.id}-${suffix}`
	}

	render() {
		const { name, count, delegates } = this.state

		return (
			<div id={this.idPlus("row")} className="subcaucus-row">
				<Button id={this.idPlus("row-remove-button")}
					className="subcaucus-remove-button p-button-danger"
					icon="pi pi-minus"
				/>
				<InputTextarea id={this.idPlus("row-name")}
					className="subcaucus-field subcaucus-name"
					type="text"
					value={name}
					rows={1}
					cols={1}
					placeholder={`Subcaucus ${this.state.id}`}
					onChange={this.handleName()}
					onKeyUp={this.handleKey()}
				/>
				<InputText id={this.idPlus("row-count")}
					className="subcaucus-field subcaucus-count"
					keyfilter="pint"
					type="text"
					pattern="\\d*"
					value={count ? count : ''}
					placeholder="&mdash;"
					onChange={this.handleCount()}
					onFocus={this.focusOnWholeText()}
					onKeyUp={this.handleKey()}
				/>
				<Button id={this.idPlus("row-delegates")}
					className={`subcaucus-delegates-button ${delegates > 0 ? "has-delegates p-button-success" : "p-button-secondary"}`}
					label={`${delegates}`}
				/>
			</div>
		)
	}
}
