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
				value=""
				defaultValue={`Revision of ${this.props.name}`}
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
				<p>It looks like you have unsaved changes in the calculator. Do you want to save a snapshot? If so, provide a name like "First walk" or "Final result". If you don't save a snapshot, your changes may be lost when you continue.
                </p>
			</ValueCard>
		)
	}

}