/**
 * CreditCard.tsx
 *
 * A card that shows the user credits for the app
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
	save: (value?: string) => void
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
export class CreditCard extends React.Component<Props, State> {

	render() {
		const { app, version, build } = _u.getApp()
		return (
			<ValueCard key="by-card" id="by-card"
				title="Brought to you by Tenseg LLC"
				image="tenseg.jpg"
				onSave={this.props.save}
			>
				<p>We love the walking subcaucus process and it makes us a bit sad that the squirrelly math required to calculate who gets how many delegate discourages meetings and caucuses from using the process. We hope this calculator makes it easier for you to get to know your neighbors as you work together to change the world!</p>
				<p>Please check us out at <a href="https://tenseg.net">tenseg.net</a> if you need help building a website or making appropriate use of technology.</p>
				<h3>Licenses</h3>
				<p>Our code is available under the MIT License as <a href="https://github.com/tenseg/subcaucus-calculator">subcaucus-calculator at Github</a>.</p>
				<p>It makes use of <a href="https://reactjs.org/">ReactJS</a>, <a href="https://www.typescriptlang.org/">TypeScript</a>, <a href="https://www.primefaces.org/primereact">PrimeReact</a>, <a href="https://fontawesome.com">Font Awesome</a>, <a href="https://github.com/mojotech/json-type-validation">JSON Type Validation</a>, <a href="https://github.com/ClickSimply/typescript-map">typescript-map</a>, and many other open source projects.
				</p>
				<div className="fineprint">
					{app === 'ios'
						? <> a {version}</>
						: <> v {version}</>
					}
					{_u.isDebugging()
						? <> d {build}</>
						: ''
					}
				</div>
			</ValueCard>
		)
	}

}