import * as React from 'react'
// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
// local to this app
import * as _u from './Utilities'
import { Subcaucus } from './Subcaucus'
import { SubcaucusRowInfoCard } from './SubcaucusRowInfoCard'

export type SubcaucusRowAction = 'recalc' | 'enter'

interface Props {
	subcaucus: Subcaucus
	index: number
	rows: number
	exchange: ((subcaucus: Subcaucus, action: SubcaucusRowAction, index?: number, callback?: () => void) => void)
}

interface State {
	name: string
	count: number
	delegates: number
	showInfo: boolean
}

/**
 * Component to show a single subcaucus row.
 * Also controls subcaucus row info cards.
 */
export class SubcaucusRow extends React.Component<Props, State> {

	constructor(props: Props) {
		super(props)
		this.state = {
			name: this.props.subcaucus.name,
			count: this.props.subcaucus.count,
			delegates: this.props.subcaucus.delegates,
			showInfo: false
		}
	}

	handleName = () => (event: React.FormEvent<HTMLTextAreaElement>) => {
		const currentTabIndex = event.currentTarget.tabIndex
		var value = event.currentTarget.value
		_u.debug("handle name index", currentTabIndex, "is", value)
		this.setState({ name: value })
	}

	handleCount = () => (event: React.FormEvent<HTMLInputElement>) => {
		const currentTabIndex = event.currentTarget.tabIndex
		var num = Number(event.currentTarget.value)
		_u.debug("handle count index", currentTabIndex, "is", num)
		if (num < 0) {
			num = 0
		}
		this.setState({ count: num })
	}

	handleBlur = () => (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { subcaucus } = this.props
		const currentTabIndex = event.currentTarget.tabIndex
		_u.debug("handle blur index", currentTabIndex)
		if (subcaucus.name !== this.state.name || subcaucus.count !== this.state.count) {
			subcaucus.name = this.state.name
			subcaucus.count = this.state.count
			this.props.exchange(subcaucus, 'recalc')
		}
	}

	handleKey = () => (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { rows, subcaucus } = this.props
		const currentTabIndex = event.currentTarget.tabIndex
		_u.debug("handle key index", currentTabIndex, "got", event.key, "for", subcaucus.id, subcaucus.debug())
		if (event.key === 'Enter' || event.key === 'Tab') {
			event.preventDefault()
			subcaucus.name = this.state.name
			subcaucus.count = this.state.count
			// enters will not normally select the next row
			// so we have to force it with a callback that happens after the add subcaucus
			this.props.exchange(subcaucus, 'enter', currentTabIndex, () => {
				// if we are in the last position of the count column,
				// then the next position after adding a subcaucus will be 2 ahead
				const next = currentTabIndex == rows * 2 ? 2 : 1
				// walk through all the subcaucus fields looking for the next one
				document.querySelectorAll(".subcaucus-field").forEach((e) => {
					const element = e as HTMLElement
					if (element.tabIndex === currentTabIndex + next) {
						// then force the focus to this field
						element.focus()
					}
				})
			})
		}
	}

	focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		// event properties must be copied to use async
		const target = event.currentTarget
		// do this async to try to make Safari behave
		setTimeout(() => target.setSelectionRange(0, 9999), 0)
	}

	idPlus = (suffix: string): string | undefined => {
		return `subcaucus-${this.props.subcaucus.id}-${suffix}`
	}

	render() {
		const { subcaucus: s } = this.props

		_u.debug("render row", s.id, this.state)

		const { name, count, showInfo } = this.state

		const infoCard = showInfo
			? <SubcaucusRowInfoCard
				subcaucus={s}
				dismiss={() => this.setState({ showInfo: false })}
			/>
			: ''

		return (
			<>
				<div id={this.idPlus("row")}
					className={`subcaucus-row ${s.delegates > 0 ? "has-delegates" : (count > 0 ? "no-delegates" : "")}`}
				>
					{_u.isDebugging() ? <div className="subcaucus-id">{s.id}</div> : ''}
					<InputTextarea id={this.idPlus("row-name")}
						className="subcaucus-field subcaucus-name"
						autoComplete="off"
						tabIndex={this.props.index}
						type="text"
						value={name}
						rows={1}
						cols={1}
						// PrimeReact has a bug with the InputTextarea placeholder
						// for now, it will not update this placeholder
						// see: https://github.com/primefaces/primereact/issues/747
						placeholder={s.defaultName()}
						onChange={this.handleName()}
						onKeyDown={this.handleKey()}
						onBlur={this.handleBlur()}
						onFocus={this.focusOnWholeText()}
					/>
					<InputText id={this.idPlus("row-count")}
						className="subcaucus-field subcaucus-count"
						autoComplete="off"
						tabIndex={this.props.index + this.props.rows}
						keyfilter="pint"
						type="text" // number does not support selection of the whole text on
						pattern="\d*"
						value={count ? count : ''}
						placeholder={`—`}
						onChange={this.handleCount()}
						onKeyDown={this.handleKey()}
						onBlur={this.handleBlur()}
						// forcing the selction of the whole text seems to lead to problems
						// see https://grand.clst.org:3000/tenseg/subcalc-pr/issues/3
						onFocus={this.focusOnWholeText()}
					/>
					<Button id={this.idPlus("row-delegates")}
						className={`subcaucus-delegates-button ${s.delegates > 0 ? "p-button-success" : "p-button-secondary"}`}
						label={s.delegates ? `${s.delegates}` : undefined}
						icon={s.delegates ? undefined : (count ? 'pi pi-ban' : 'pi')}
						onClick={() => this.setState({ showInfo: true })}
						disabled={count === 0}
					>
						<div className="shape">{
							s.reportTosses
								? s.delegates > s.baseDelegates
									? <div className="coin won"></div>
									: <div className="coin lost"></div>
								: s.delegates > s.baseDelegates
									? <div className="plus"></div>
									: ''
						}</div>
						<div className={
							s.reportTosses
								? s.delegates > s.baseDelegates
									? "coin won"
									: "coin lost"
								: s.delegates > s.baseDelegates
									? "plus"
									: ""
						}></div>
					</Button>
				</div>
				{infoCard}
			</>
		)
	}
}
