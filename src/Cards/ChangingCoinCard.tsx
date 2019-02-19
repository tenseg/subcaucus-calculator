/**
 * ChangingCoinCard.tsx
 *
 * A card that allows the user to change the 
 * random seed of the coin used to break ties
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
	value: string
	allowed: number
	save: (value?: string) => void
	generate: () => void
}

/**
 * React state for the card.
 */
interface State {
	value: string
}


/**
 * A card that allows the user to change the random seed of the coin used to break ties.
 */
export class ChangingCoinCard extends React.Component<Props, State> {

	render() {
		return (
			<ValueCard key="coin-value" id="coin-value"
				title={"Coin settings"}
				type="positive integer"
				value={this.props.value}
				valueLabel="Random seed for coin"
				allowEmpty={false}
				extraButtons={this.props.allowed
					? <Button id="random-coin-button"
						label="Generate random coin"
						icon="fa fa-fw fa-sync-alt"
						className="p-button-success"
						onClick={this.props.generate}
					/>
					: <></>
				}
				onSave={this.props.save}
			>
				<p>
					Traditionally, when there are delegates remaining to be assigned and
					two subcaucuses are "tied" with the same size delegations, the chair
					of the caucus will use some method of assigning those remaining delegates
					at random. These methods include coin-flips or drawing lots.
					</p>
				<p>
					In this calculator we accomplish the same randomness, but we do so by
					in essence, flipping a coin in secret ahead of time. The "coin" is
					really a "random seed" that ensures fair but unpredictable results.
					</p>
				<p>
					If you change the coin, this pattern of random flips will also change.
					If want the same results as someone else is getting in their copy of
					the calculator, then you must share the same coin value.
					</p>
			</ValueCard>
		)
	}

}