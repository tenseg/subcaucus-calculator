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
 * A card that allows the user to change the meeting name.
 */
export class InstructionsCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="instructions-card" id="instructions-card"
				title="Fill in the subcaucuses"
				image="walking.jpg"
				onSave={this.props.save}
			>
				<p>Now it is time to fill in the subcaucus information. Just add each subcaucus name and the count of participants. Usually a convention or cacucus will solicit the names of subcaucuses first, feel free to enter them right away without a count. Then people will be encouraged to walk around the room and congregate with the subcaucus that most closely represents their views. When each subcacus reports how many members they attracted, you can enter that as the count for that subcaucus.</p>
				<p>As soon as you start entering subcaucus counts, the calculator will go to work determining how many delegates each subcaucus will be assigned. You can ignore those numbers until you have finished entering and confirming all the subcaucus counts. When you are done, the delegate numbers can be reported to the chair of your convention or caucus.</p>
				<p>Since most conventions or caucuses will go through more than one round of "walking", you can just keep reusing your subcaucus list for each round. However, you might want to consider these steps at the end of each round:</p>
				<ul>
					<li>Use the "Meetings" menu at the top to save a snapshot after each round of caucusing. This will give you a good record of the whole process.</li>
					<li>Use the "Share" menu to email a report about each round to the chair of the meeting just so they also have a clear record of the process.</li>
				</ul>
				<p>You can always get these instructions back under the "About" menu at the top. Have fun!</p>
			</ValueCard>
		)
	}

}