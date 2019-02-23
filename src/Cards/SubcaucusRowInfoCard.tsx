/**
 * SubcaucusRowInfoCard.tsx
 *
 * A card that shows details about a single subcaucus
 * built on the our ValueCard component.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react'

// local to this app
import * as _u from '../Utilities'
import { Subcaucus } from '../Subcaucus'
import { ValueCard } from '../ValueCard'

interface Props {
	subcaucus: Subcaucus
	dismiss: (() => void)
}

interface State { }

/**
 * A card that shows details about a single subcaucus.
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
			<ValueCard id="subcaucus-info-card"
				className='subcaucus-info-card'
				title={s.displayName()}
				onSave={dismiss}
			>
				{s.delegates
					? <>
						<p>The <strong>{s.count.singularPlural("member", "members")}</strong> of this subcaucus may elect <strong>{s.delegates.singularPlural("delegate", "delegates")}</strong>.</p>
						<div className="fineprint">
							{s.baseDelegates}+{s.delegates - s.baseDelegates} (r{s.rank})
						</div>
					</>
					: <p>This subcaucus did not attract enough members to be viable. It may not elect any delegates. Members of this subcaucus should consider joining other subcaucuses in order to have some say in the delegates elected.</p>
				}
				<p>{s.remainder === 0 ? '' : <span>This subcaucus had a remainder of <strong>{s.remainder.decimalPlaces(3)}</strong>. </span>}
					{s.delegates > s.baseDelegates ? <span>It was awarded a <strong>remainder delegate</strong> because it had one of the higher remainders. </span> : ''}
					{s.tosses().map((toss) => {
						return <span>It {toss.won ? "won" : "lost"} a coin toss against {toss.against.displayName()}. </span>
					})}
				</p>
			</ValueCard>
		)
	}
}
