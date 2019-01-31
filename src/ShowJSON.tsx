import * as React from 'react'
// see https://www.npmjs.com/package/react-json-view
import ReactJson from 'react-json-view'
// see: https://www.npmjs.com/package/react-json-tree
// import JSONTree from 'react-json-tree'
// local to this app
import * as _u from './Utilities'

interface Props {
	name?: string
	data: any
}

interface State {
}

export class ShowJSON extends React.Component<Props, State> {

	render() {
		// react-json-view version
		return (
			<ReactJson
				src={this.props.data}
				name={this.props.name}
				enableClipboard={false}
				indentWidth={2}
			/>
		)
		// simple version...
		// const jsonString = JSON.stringify(this.props.data, null, 2)
		// return (
		// 	<div className="show-json">
		// 		<pre>
		// 			{this.props.name ? `${this.props.name} = ` : ''}
		// 			{jsonString}
		// 		</pre>
		// 	</div>
		// )
	}
}
