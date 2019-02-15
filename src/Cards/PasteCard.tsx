/**
 * PasteCard.tsx
 *
 * A card that allows the user to paste in data from the clipboard.
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
	save: (value?: string) => void
}

/**
 * React state for the card.
 */
interface State {
	value: string
}


/**
 * A card that allows the user to paste in data from the clipboard.
 */
export class PasteCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="name-value" id="name-value"
				title="Paste..."
				value=""
				allowEmpty={true}
				onSave={this.props.save}
			>
				<p>This system requires that you personally paste data from the clipboard. Just paste whatever is on the clipboard into the field below.</p>
			</ValueCard>
		)
	}

}