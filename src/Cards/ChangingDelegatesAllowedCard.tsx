/**
 * ChangingDelegatesAllowedCard.tsx
 *
 * A card that allows the user to change the 
 * number of delegates a meeting is allowed
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
	allowed: number
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
 * A card that allows the user to change the number of delegates a meeting is allowed.
 */
export class ChangingDelegatesAllowedCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="delegate-value" id="delegate-value"
				title="Number of delegates allowed?"
				type="positive integer"
				value={this.props.allowed.toString()}
				allowEmpty={false}
				extraButtons={this.props.allowed
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
				<p>Specify the number of delegates that your meeting or caucus is allowed to send on to the next level. This is the number of delegates to be elected by your meeting.
                {this.props.allowed
						? <span> If this is actually a new event, you may want to start a new meeting instead</span>
						: <></>
					}
				</p>
			</ValueCard>
		)
	}

}