import * as React from 'react'
import packageJson from '../../package.json'

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
export class CreditCard extends React.Component<Props, State> {

	render() {
		const app = _u.getApp()
		return (
			<ValueCard key="by-card" id="by-card"
				title="Brought to you by Tenseg LLC"
				image="tenseg.jpg"
				onSave={this.props.save}
			>
				<p>We love the walking subcaucus process and it makes us a bit sad that the squirrelly math required to calculate who gets how many delegate discourages meetings and caucuses from using the process. We hope this calculator makes it easier for you to get to know your neighbors as you work together to change the world!</p>
				<p>Please check us out at <a href="https://tenseg.net">tenseg.net</a> if you need help building a website or making appropriate use of technology.</p>
				<div className="fineprint">
					<>v {packageJson.version}</>
					{_u.isApp()
						? <> a {app.version}</>
						: ''
					}
					{_u.isDebugging()
						? <> d {app.build}</>
						: ''
					}
				</div>
			</ValueCard>
		)
	}

}