/**
 * SavingSnapshotBeforeCard.tsx
 *
 * A card to save a snapshot of the current state 
 * of the calculator before loading another snapshot
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
	title?: string
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
 * calculator before loading another snapshot.
 */
export class SavingSnapshotBeforeCard extends React.Component<Props, State> {

	save = (value?: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
		_u.switchHistory()
		this.props.save(value)
	}

	render() {
		return (
			<ValueCard key="snapshot-before-card" id="snapshot-before-card"
				title={this.props.title || "Save changes?"}
				value={this.props.revisionName || ''}
				valueLabel="Name for the snapshot?"
				defaultValue={`Snapshot of ${this.props.meetingName}`}
				allowEmpty={false}
				extraButtons={
					<>
						<Button id="just-load-snapshot-button"
							label="Don't save"
							icon="fa fa-fw fa-exclamation-triangle"
							className="p-button-warning"
							onClick={this.save("")}
						/>
						<Button id="cancel-save-and-load-snapshot-button"
							label="Cancel"
							icon="fa fa-fw fa-times"
							className="p-button-secondary"
							onClick={this.save()}
						/>
					</>
				}
				onSave={this.props.save}
			>
				<p>Do you want to save your changes as a snapshot? If so, provide a name like "First walk" or "Final result". Note that the date and time of this snapshot will be stored with the snapshot, so you don't really need to include that information in the name.</p>
				<p>If you don't save a snapshot, your changes may be lost when you continue.
                </p>
			</ValueCard>
		)
	}

}