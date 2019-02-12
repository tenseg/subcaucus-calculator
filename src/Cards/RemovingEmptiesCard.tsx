/**
 * RemovingEmptiesCard.tsx
 *
 * A card that allows the user to back out of removing empty subcaucuses
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
	removeEmpties: (subset?: 'all' | 'unnamed') => void
	cancel: () => void
}

/**
 * React state for the card.
 */
interface State {
	value: string
}


/**
 * A card that allows the user to back out of removing empty subcaucuses.
 */
export class RemovingEmptiesCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="remove-empties-card" id="remove-empties-card"
				title="Remove empty subcaucuses"
				footer={
					<>
						<Button id="remove-all-empties-button"
							label="Remove All Empties"
							icon="pi pi-trash"
							onClick={() => this.props.removeEmpties()}
						/>
						<Button id="remove-some-empties-button"
							label="Remove Only Unnamed"
							icon="pi pi-trash"
							className="p-button-warning"
							onClick={() => this.props.removeEmpties('unnamed')}
						/>
						<Button id="cancel-remove-button"
							label="Cancel"
							icon="pi pi-times"
							className="p-button-secondary"
							onClick={() => this.props.cancel()}
						/>
					</>
				}
			>
				<p>An "empty" subcaucus is one with no participants &mdash; a zero count.</p>
				<p>You can choose to remove all empty subcaucuses, or only those which also have no names.</p>
			</ValueCard>
		)
	}

}