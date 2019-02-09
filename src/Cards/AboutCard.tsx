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
	showCredits: () => void
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
export class AboutCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="about-card" id="about-card"
				title="Minnesota DFL Subcaucus Calculator"
				image="dfl.jpg"
				onSave={this.props.save}
				extraButtons={
					<Button id="show-credits-button"
						label="Credits"
						icon="pi pi-user"
						className="p-button-secondary"
						onClick={this.props.showCredits}
					/>
				}
			>
				<p>Originally written for <a href="http://sd64dfl.org">SD64 DFL</a>, this app assists convenors of precinct caucuses and conventions in Minnesota. The Minnesota Democratic Farmer Labor (DFL) party uses a wonderful, but bit arcane, “walking subcaucus” process that is simple enough to do, but rather difficult to tabulate.</p>
				<p>Given the number of delegates your meeting or caucus is allowed to send forward and the count of members of each subcaucus, this calculator determines how many of those delegates each subcaucus will elect. The rules it follows appeared on page 4 of the <a href="https://www.dfl.org/wp-content/uploads/2018/04/2017-12-14-Call-Amended-2-December-2017-Final2c-Rev-B.pdf">DFL 2018-2019 Official Call</a>, including the proper treatment of remainders. It makes the math involved in a walking subcaucus disappear.</p>
				<p>The app could be used to facilitate a “walking subcaucus” or “<a href="https://en.wikipedia.org/wiki/Proportional_representation">proportional representation</a>” system for any group.</p>
			</ValueCard>
		)
	}

}