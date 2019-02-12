/**
 * ShowJSON.tsx
 *
 * A ReactJS component that JSON stringifies a data value
 * and diplays it in a div using simply pre for formatting.
 *
 * I put this into its own component so that I could experiment
 * with alternative fancier presentations.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react'

// see https://www.npmjs.com/package/react-json-view
// import ReactJson from 'react-json-view'
// see: https://www.npmjs.com/package/react-json-tree
// import JSONTree from 'react-json-tree'

// local to this app
import * as _u from './Utilities'

/**
 * Properties for the component.
 */
interface Props {
	name?: string
	data: any
}

/**
 * This component has no state.
 */
interface State { }

/**
 * A ReactJS component that JSON stringifies a data value
 * and diplays it in a div using simply pre for formatting.
 */
export class ShowJSON extends React.Component<Props, State> {

	render() {
		// fancy version...
		// this react-json-view version proved buggy after recalculations
		// return (
		// 	<ReactJson
		// 		src={this.props.data}
		// 		name={this.props.name}
		// 		enableClipboard={false}
		// 		indentWidth={2}
		// 	/>
		// )

		// simple version...
		const jsonString = JSON.stringify(this.props.data, null, 2)
		return (
			<div className="show-json">
				<pre>
					{this.props.name ? `${this.props.name} = ` : ''}
					{jsonString}
				</pre>
			</div>
		)
	}
}
