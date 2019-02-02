import * as React from 'react'

// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'

// local to this app
import * as _u from './Utilities'
import { Subcaucus } from './Subcaucus'
import { ValueCard } from './ValueCard'

interface Props {
	subcaucus: Subcaucus
	dismiss: (() => void)
}

interface State { }

/**
 * Component to show a subcaucus row info cards.
 */
export class SubcaucusRowInfoCard extends React.Component<Props, State> {

	constructor(props: Props) {
		super(props)
		this.state = {}
	}

	render() {
		_u.debug("render info card", this.props.subcaucus.id)

		const { subcaucus: s, dismiss } = this.props

		return (
			<ValueCard
				title={s.displayName()}
				footer={
					<Button
						label="OK"
						onClick={dismiss}
					/>
				}
			>
				{s.delegates
					? <p>The <strong>{s.count.singularPlural("member", "members")}</strong> of this subcaucus may elect <strong>{s.delegates.singularPlural("delegate", "delegates")}</strong>.</p>
					: <p>This subcaucus did not attract enough members to be viable. It may not elect any delegates. Members of this subcaucus should consider joining other subcaucuses in order to have some say in the delegates elected.</p>
				}
				{s.delegates > s.baseDelegates
					? <p>It was awarded an extra delegate because it had a higher remainder ({Math.round(s.remainder * 1000) / 1000}) than some other subcaucuses.</p>
					: ''
				}
				{s.tosses.map((toss) => {
					if (toss.against.delegates != s.delegates) {
						return (
							<p>Is {toss.won ? "won" : "lost"} a coin toss for an extra delegate against {toss.against.displayName()}, which had the same remainder.</p>
						)
					} else {
						return ''
					}
				})}

			</ValueCard>
		)
	}
}
