# SubCalc

SubCalc is a progressive web application built on the [Create React App framework](README-CRA.md). This web application runs as the Minnesota DFL Subcaucus Calculator at [subcalc.tenseg.net](https://subcalc.tenseg.net). This project is also the submodule at the heard of the [SubCalc iPhone app](https://itunes.apple.com/us/app/subcalc/id352454097?mt=8).

SubCalc assists convenors of precinct caucuses and conventions in Minnesota. The Minnesota Democratic Farmer Labor (DFL) party uses a wonderful, but bit arcane, “walking subcaucus” process that is simple enough to do, but rather difficult to tabulate. This app calculates the number of delegates each subcaucus gets when you enter the total number of delegates your precinct or convention is allowed and how many members are in each subcaucus. The rules it follows appeared on page 4 of the [DFL 2018-2019 Official Call](https://www.dfl.org/wp-content/uploads/2018/04/2017-12-14-Call-Amended-2-December-2017-Final2c-Rev-B.pdf), including the proper treatment of remainders. It makes the math involved in a walking subcaucus disappear. The app could be used to facilitate a “walking subcaucus” or “[proportional representation](http://en.wikipedia.org/wiki/Proportional_representation)” system for any group.

## How to use SubCalc

When starting a new caucus or convention you will be asked to provide a name for your meeting and the number of delegates your meeting is allowed to elect. You can then put a count of all the participants in the room into a single subcaucus so that the calculator can provide a "viability number." Announce this viability number to the room so they know how many members will be required to make their own subcaucus viable, or capable of electing delegates.

After subcaucuses have organized and counted their members (or completed a "walk"), create an entry for each one and record their membership. The calculator will keep a running tab of delegates each subcaucus will be able to elect, but this will be meaningless until you have completed the entry of all subcaucuses. 

It is a good practice to save a snapshot of the meeting after completing the data entry for each "walk." You may also want to use the share functions to send yourself or others a record of what happened at the meeting. This is a great way to report your results.

### A note about coin flips and randomness

When two or more subcaucuses have the same number of members, SubCalc will automatically do a “coin flip” to determine which, if any, should get remainder delegates.

Randomness is a funny thing on a computer. While in the real world we would get together the leaders of tied subcaucuses and ask them to yell heads or tails while we flip a coin, we don’t actually have that opportunity in a computer program. SubCalc won’t hear anyone yelling heads or tails. What we really want, though, is simply a random decision about which of the tied subcaucuses will get remainder delegates. We’ve come up with a very different process in SubCalc, but we still call it a “coin flip” so that people understand it serves the same role.

In SubCalc we actually assign every subcaucus what we call a “random rank” as we calculate the distribution of delegates. Imagine this as asking each subcaucus leader to draw a straw as you begin the distribution process. Each straw is a different length, and the subcaucus with the longest straw will get the first remainder in the event of a tie with another subcaucus. No “coin flips” to speak of, just a pre-assigned random rank (straw) handed out at the beginning.

When you ask SubCalc to “change the coin” it actually just assigns new random ranks to each subcaucus. This is as if you had asked each one to draw a new straw. Sometimes that results in the same order, sometimes the order of the random ranks (the straws) will change. When you see reports of “coin tosses” from SubCalc, the winner of the “toss” is always the subcaucus that had the better (lower) random rank.

SubCalc only has to save the “coin’s” random seed in order to reproduce the same random ranks (and coin “tosses”) the next time around. So when you quit SubCalc (or get a phone call on your iPhone, interrupting SubCalc) it won’t forget the order of the “straws” for the next time it has to distribute delegates. If someone insists on redoing this coin flip, you can use the coin settings to reset this random seed. Remember, sometimes the new coin settings will have the exact same result as the old, so don’t be surprised if nothing changes (it is random, after all).

## Building SubCalc

You can find a lot more detail about building this React app in the [Create React App readme](README-CRA.md), but here are a few basics. You will need [npm](https://www.npmjs.com/) to build and use this app. (Feel free to use [yarn](https://yarnpkg.com) as an alternative to npm, but the instructions below are based on npm.)

Once you clone this repository you will have to make sure all the dependencies are loaded to your copy with:

```
npm install
```

To build the app for distribution to a production environment, use:

```
npm run build
```

To build the app for development and launch a local web server to show you the development version on [localhost:3000](http://localhost:3000), use:

```
npm run start
```
