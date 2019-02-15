/**
 * SavingSnapshotCard.tsx
 *
 * A card to save a snapshot of the current state of the calculator
 * built on the our ValueCard component.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react'

// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'

// local to this app
import * as _u from '../Utilities'
import { ValueCard } from '../ValueCard'

/**
 * React props for the card.
 */
interface Props {
	meetingName: string
	revisionName?: string
	save: (value?: string) => void
}

/**
 * React state for the card.
 */
interface State {
	value: string
}


/**
 * A card to save a snapshot of the current state of the
 * calculator.
 */
export class SavingSnapshotCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="snapshot-value" id="snapshot-value"
				title="Name for the snapshot?"
				value={this.props.revisionName || ''}
				defaultValue={`Snapshot of ${this.props.meetingName}`}
				allowEmpty={false}
				extraButtons={
					<Button id="cancel-save-snapshot-button"
						label="Cancel"
						icon="fa fa-fw fa-times"
						className="p-button-secondary"
						onClick={() => this.props.save()}
					/>
				}
				onSave={this.props.save}
			>{this.props.revisionName
				? <p>You have already saved this snapshot. By saving it again you are simply renaming it.</p>
				: <p>Consider simple names like "First walk" or "Final result". Note that the date and time of this snapshot will be stored with the snapshot, so you don't really need to include that information in the name.</p>
				}</ValueCard>
		)
	}

}