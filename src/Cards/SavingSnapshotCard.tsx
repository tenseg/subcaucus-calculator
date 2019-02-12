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
	name: string
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
				value=""
				defaultValue={`Snapshot of ${this.props.name}`}
				allowEmpty={false}
				extraButtons={
					<Button id="cancel-save-snapshot-button"
						label="Cancel"
						icon="pi pi-times"
						className="p-button-secondary"
						onClick={() => this.props.save()}
					/>
				}
				onSave={this.props.save}
			>
				<p>Consider names like "First walk" or "Final result".</p>
			</ValueCard>
		)
	}

}