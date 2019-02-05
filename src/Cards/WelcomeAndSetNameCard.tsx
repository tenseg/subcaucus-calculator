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
export class WelcomeAndSetNameCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="welcome-card" id="welcome-card"
				title="Welcome to the Minnesota DFL Subcacus Calculator"
				image="dfl.jpg"
				description='Please start by specifying the name of your meeting here. Most meetings have a name, like the "Ward 4 Precinct 7 Caucus" or the "Saint Paul City Convention".'
				value={this.props.name}
				defaultValue={this.props.defaultName}
				allowEmpty={false}
				onSave={this.props.save}
			/>
		)
	}

}