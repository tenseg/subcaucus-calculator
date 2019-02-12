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
		this.props.save(value)
	}

	render() {
		return (
			<ValueCard key="snapshot-value" id="snapshot-value"
				title={this.props.title || "Save changes?"}
				value={this.props.revisionName || ''}
				defaultValue={`Snapshot of ${this.props.meetingName}`}
				allowEmpty={false}
				extraButtons={
					<>
						<Button id="just-load-snapshot-button"
							label="Don't save"
							icon="pi pi-folder-open"
							className="p-button-warning"
							onClick={this.save("")}
						/>
						<Button id="cancel-save-and-load-snapshot-button"
							label="Cancel"
							icon="pi pi-times"
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