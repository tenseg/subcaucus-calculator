/**
 * ParticipantsCard.tsx
 *
 * A card that shows the user credits for the app
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
	cancel: () => void
	clear: () => void
	analyze: () => void
}

/**
 * React state for the card.
 */
interface State {
	value: string
}


/**
 * A card that shows the user credits for the app.
 */
export class ParticipantsCard extends React.Component<Props, State> {

	render() {
		const { app, version, build } = _u.getApp()
		return (
			<ValueCard key="participants-card" id="participants-card"
				title="Participants"
				onSave={this.props.cancel}
				footer={
					<>
						<Button id="analyze-participants-button"
							label="Analyze participants"
							icon="fa fa-fw fa-users"
							onClick={() => {
								_u.switchHistory()
								this.props.analyze()
							}}
						/>
						<Button id="clear-participants-button"
							label="Clear all participants"
							icon="fa fa-fw fa-user-slash"
							className="p-button-warning"
							onClick={this.props.clear}
						/>
						<Button id="cancel-participants-button"
							label="Cancel"
							icon="fa fa-fw fa-times"
							className="p-button-secondary"
							onClick={this.props.cancel}
						/>
					</>
				}
			>
				<p>You might also find it informative to analyze the participation by looking at some charts showing the frequency of words within subcaucus names.</p>
				<p>In between "walks" it may be helpful to clear out all the participants. This can make it easier to spot subcaucuses that still have to report their memeber counts.</p>
			</ValueCard>
		)
	}

}