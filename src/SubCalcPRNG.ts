/**
 * SubCalcPRNG.ts
 *
 * Manages the generation of random numbers.
 *
 * Our random numbers, like most computed random numbers,
 * are not actually random, but rather "psedo-random".
 * We just need numbers that are random enough to be a
 * fair approximation of the coin flips in the walking
 * subcaucus process.
 *
 * We do this ourselves so that we know exactly how the
 * numbers were generated and can replicate the exact same
 * "random" results on other platforms or when we retrieve
 * caucus information in the future. We do not actually store
 * the computed caucus results, after all, so we need to be
 * able to reliably reproduce them in the future. This means
 * our random numbers need to be predictable and reproducable.
 * 
 * This class is based on http://stackoverflow.com/a/22313621/383737
 * but modified to accept strings and turn them into numbers.
 */;

/**
 * Manages the generation of random numbers.
 */
export class SubCalcPRNG {

	mod1 = 4294967087
	mul1 = 65539
	mod2 = 4294965887
	mul2 = 65537
	state1 = 0
	state2 = 0

	/**
	 * Can be called with no arguments in order to seed 
	 * the PRNG with the current time, or it can 
	 * be called with either 1 or 2 non-negative integers as arguments 
	 * in order to seed it with those integers. Due to float point 
	 * accuracy seeding with only 1 value will only allow the generator 
	 * to be initiated to one of 2^53 different states.
	 * 
	 * For convenience, strings supplied to parameters will be 
	 * converted to numbers and all numbers will be converted to
	 * positive integers.
	 * 
	 * @param state1 will default to seconds since Unix epoch
	 * @param state2 will default to value of seed1
	 */
	constructor(state1: string | number, state2?: string | number) {

		state1 = Math.abs(Math.floor(Number(state1)))
		state2 = Math.abs(Math.floor(Number(state2)))

		if (isNaN(state1) || state1 < 1) {
			state1 = Number(new Date())
		}
		if (isNaN(state2) || state2 < 1) {
			state2 = state1
		}
		state1 = state1 % (this.mod1 - 1) + 1
		state2 = state2 % (this.mod2 - 1) + 1
	}

	/**
	 * This PRNG function takes 1 integer limit argument which
	 * must be in the range 1 to 4294965886. It will return a 
	 * number in the range 0 to limit-1.
	 * 
	 * For convenience, all numbers will be converted to
	 * positive integers.
	 * 
	 * @param limit constrains the result between 0 and limit-1
	 */
	random = (limit: number): number => {

		limit = Math.abs(Math.floor(limit))

		this.state1 = (this.state1 * this.mul1) % this.mod1
		this.state2 = (this.state2 * this.mul2) % this.mod2

		if (
			this.state1 < limit
			&& this.state2 < limit
			&& this.state1 < this.mod1 % limit
			&& this.state2 < this.mod2 % limit
		) {
			return this.random(limit)
		}

		return (this.state1 + this.state2) % limit
	}

	/**
	 * This function "flips a coin" and returns either 
	 * heads (1) or tails (-1). It is designed for use
	 * in sorting to produce a random order.
	 */
	randomComparison = (): -1 | 1 => {
		return this.random(2) ? -1 : 1
	}

}