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
	clearData: () => void
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
export class SecurityCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="security-card" id="security-card"
				title="Data security"
				image="security.jpg"
				extraButtons={
					<Button id="clear-data -button"
						label="Clear All Data"
						icon="pi pi-exclamation-triangle"
						className="p-button-danger"
						onClick={this.props.clearData}
					/>
				}
				onSave={this.props.save}
			>
				{_u.isApp()
					? <>
						<p>SubCalc stores all of the data you enter on your device. None of your data is shared with other apps or sent off your device unless you choose to share it.</p>
						<p>One thing to be aware of is that anyone who can unlock this device will be able to use this app to see your meeting information, including saved snapshots and past meetings. While your device is locked the data is protected with your passcode. If you want to erase all data the calculator has stored tap the “Clear All Data” button. This action is unreversable.</p>
						<p>Since the data is stored on your device, also be aware that you will not be able to see your meeting information from any other device or on the web version of this calculator. This means that you won't be able to get at this data from other devices or browsers unless you use the sharing features.</p>
					</>
					: <>
						<p>The subcaucus calculator stores all of the data you enter on your own device. It uses a feature of web browsers called "local storage" to save all your meeting information within your web browser. None of your data gets off your device unless you choose to share it.</p>
						<p>Do note that this app is running on a web server, though, and that server will keep all the logs typical of web servers. This includes logs of your IP address and the documents you retrieve from the server. None of these logs will include your specific meeting information.</p>
						<p>One thing to be aware of is that anyone using this same browser on this same device will be able to see your meeting information, including saved snapshots and past meetings, when they come to this web site. If this is a public device and you want to clear out all the data the calculator has stored, click the "Clear All Data" button. This action is unreversable.</p>
						<p>Since the data is stored with your browser on this device, also be aware that you will not be able to see your meeting information from any other browser. This means that you won't be able to get at this data from other devices or browsers unless you use the sharing features.</p>
					</>
				}
				<p>You can use the "Share" menu to get data off your device when you need to do so. Once you share your meeting information this calculator is no longer in control of that data. Make good choices about sharing.</p>
				<p>The good news is that there really isn't any private information in the calculator in the first place. Most meetings that use the walking subcacus process are public meetings and the data you store in this calculator is not sensitive. Still, we thought you'd like to know we treat it as <em>your</em> data and do not share it unless you ask us to.</p>
			</ValueCard>
		)
	}

}