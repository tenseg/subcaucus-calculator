/**
 * ViabilityCard.tsx
 *
 * A card that provides a summary of the snapshot
 * in the language of the DFL call
 * built on the our ValueCard component.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react'

// local to this app
import * as _u from '../Utilities'
import { ValueCard } from '../ValueCard'
import { Snapshot } from '../Snapshot'

/**
 * React props for the card.
 */
interface Props {
	save: (value?: string) => void
	snapshot: Snapshot
}

/**
 * React state for the card.
 */
interface State {
	value: string
}


/**
 * A card that provides a summary of the snapshot
 * in the language of the DFL call.
 */
export class ViabilityCard extends React.Component<Props, State> {

	render() {
		const s = this.props.snapshot
		return (
			<ValueCard key="about-card" id="about-card"
				title="Explaining the numbers"
				onSave={this.props.save}
			>
				<p><em>The numbers are from the current calculator values. The current "coin" has a random seed of <strong>{s.seed}</strong>. The text below comes from page 4 of the <a href="https://www.dfl.org/wp-content/uploads/2018/04/2017-12-14-Call-Amended-2-December-2017-Final2c-Rev-B.pdf">2018-2019 Official Call of the DFL</a>.</em></p>

				<p>The threshold for subcaucus viability is the number of persons needed to elect one delegate. Viability is determined in the following manner:</p>

				<p><strong>Step No. 1:</strong> Add up the total number of members of all the subcaucuses. [{s.participants}]</p>

				<p><strong>Step No. 2:</strong> Divide the result of Step No. 1 by the total number of delegates to be elected [<strong>{s.participantsPerDelegate.decimalPlaces(3)}</strong>]. If there is a remainder, round the result up to the next whole number. This is the viability number [<strong>{s.viabilityNumber}</strong>].</p>

				<p>If all remaining subcaucuses are viable on the first count, then there shall be no second count. Any subcaucus which has fewer delegates than the initial viability number is informed that it is not viable and members must join a viable subcaucus to continue participating in subcaucusing. [<strong>{
					s.participants === s.viableParticipants
						? "Subcaucuses are all viable."
						: "Some subcaucuses are not viable."
				}</strong>]</p>

				<p>A time is specified (by majority vote of the precinct caucus or in the convention rules) for the second and final count. Prior to this time, individuals may move among the subcaucuses. At the specified time all movement ceases and the members of each subcaucus are counted by the convention tellers. Results of that count are reported to the chair. Delegate allocation is then determined by the chair as follows:</p>

				<p><strong>First:</strong> Add up the total number of members of all the viable subcaucuses [<strong>{s.viableParticipants}</strong>].</p>

				<p><strong>Second:</strong> Divide the result of the first step by the total number of delegates to be elected. Carry this division out to at least three decimal places [<strong>{s.delegateDivisor.decimalPlaces(3)}</strong>].</p>

				<p><strong>Finally:</strong> Divide the number of members of each subcaucus by the result of the second step. The whole number result is the minimum number of delegates allotted to that subcaucus.</p>

				<p>After allotting delegates in this manner, allot any remaining delegates to subcaucuses in the order of the largest remainder to the smallest remainder. (A subcaucus whose number is less than "1" on the final count will not be allotted any delegates or alternates.)</p>

				<p><em>You can click on the number of delegates for any subcaucus to see this breakdown of "minimal number of delegates" and "remaining delegates".</em></p>
			</ValueCard>
		)
	}

}