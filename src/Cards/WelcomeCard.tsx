/**
 * WelcomeCard.tsx
 *
 * A card that welcomes a new user and 
 * allows the user to change the meeting name
 * built on the our ValueCard component.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react'

// local to this app
import * as _u from '../Utilities'
import { ValueCard } from '../ValueCard'

/**
 * React props for the card.
 */
interface Props {
	name: string
	upgrade?: string
	save: (value?: string) => void
}

/**
 * React state for the card.
 */
interface State {
	value: string
}


/**
 * A card that welcomes a new user and allows the user to change the meeting name.
 */
export class WelcomeCard extends React.Component<Props, State> {
	render() {
		let text = <p>We will start you off with an example from the DFL call.</p>

		if (this.props.upgrade == 'subcalc2') {
			text = <p>This is a new version of the calculator. Your old caucuses have been saved as snapshots and can be retreived by using the <strong>Open Snapshot</strong> item under the <strong>Meetings</strong> menu.</p>
		}

		return (
			<ValueCard key="welcome-card" id="welcome-card"
				title="Welcome to the Minnesota DFL Subcaucus Calculator"
				image="dfl.jpg"
				allowEmpty={false}
				onSave={this.props.save}
			>
				{text}
				<p>When you are ready to create your own meeting, choose <strong>New Meeting</strong> from the <strong>Meetings</strong> menu at the top of the calculator. Please send us feedback any time using the <strong>Feedback</strong> option under the <strong>About</strong> menu. Have a great walking subcaucus!</p>
			</ValueCard>
		)
	}

}