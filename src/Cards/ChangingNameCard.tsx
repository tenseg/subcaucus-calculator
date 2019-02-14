/**
 * ChangingNameCard.tsx
 *
 * A card that allows the user to change the meeting name
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
	name: string
	defaultName: string
	save: (value?: string) => void
	newMeeting: () => void
}

/**
 * React state for the card.
 */
interface State {
	value: string
}


/**
 * A card that allows the user to change the meeting name.
 */
export class ChangingNameCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="name-value" id="name-value"
				title="Meeting name?"
				value={this.props.name}
				defaultValue={this.props.defaultName}
				allowEmpty={false}
				extraButtons={this.props.name
					? <Button id="new-meeting-button"
						label="New meeting"
						icon="pi pi-calendar-plus"
						className="p-button-secondary"
						onClick={this.props.newMeeting}
					/>
					: <></>
				}
				onSave={this.props.save}
			>
				{this.props.name
					? <p>You can rename the current meeting. However, if this is really a new event, you may want to start a new meeting altogether.</p>
					: <p>Please provide a name for this meeting. Consider a descriptive name like "Ward 4 Precinct 7 Caucus".</p>
				}
			</ValueCard>
		)
	}

}