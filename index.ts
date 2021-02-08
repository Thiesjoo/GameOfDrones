class Vector2 {
	constructor(public x: number, public y: number) {}

	equals(o: Vector2) {
		return o.x === this.x && o.y === this.y;
	}
}

class Drone {
	constructor(public pos: Vector2, public id: number, public team: number) {}
}

class Zone {
	constructor(
		public pos: Vector2,
		public owner: number,
		public targeting: Array<number>,
		public drones: Array<Drone>
	) {}
}

enum DroneStates {
	Defending = "defending",
	Idle = "idle",
}
enum ZoneStates {
	NeedHelp = "needhelp",
	Mine = "MINE",
	Broken = "BROKEN",
}

const sqDist = (a: Vector2, b: Vector2) =>
	Math.abs(b.x - a.x) + Math.abs(b.y - a.y);

var inputs: string[] = readline().split(" ");
const amountOfPlayers: number = parseInt(inputs[0]); // number of players in the game (2 to 4 players)
const myTEAM: number = parseInt(inputs[1]); // ID of your player (0, 1, 2, or 3)
const dronesPerTeam: number = parseInt(inputs[2]); // number of drones in each team (3 to 11)
const amountOfZones: number = parseInt(inputs[3]); // number of zones on the map (4 to 8)

let drones: {
	[id: number]: Array<Drone>;
} = [];
let zones: Array<Zone> = [];
for (let i = 0; i < amountOfZones; i++) {
	var inputs: string[] = readline().split(" ");
	const X: number = parseInt(inputs[0]); // corresponds to the position of the center of a zone. A zone is a circle with a radius of 100 units.
	const Y: number = parseInt(inputs[1]);
	zones.push(new Zone(new Vector2(X, Y), 0, [], []));
}

// game loop
while (true) {
	for (let i = 0; i < amountOfZones; i++) {
		const TID: number = parseInt(readline()); // ID of the team controlling the zone (0, 1, 2, or 3) or -1 if it is not controlled. The zones are given in the same order as in the initialization.
		zones[i].owner = TID;
		zones[i].targeting = [];
		zones[i].drones = [];
	}

	for (let i = 0; i < amountOfPlayers; i++) {
		for (let j = 0; j < dronesPerTeam; j++) {
			var inputs: string[] = readline().split(" ");
			const DX: number = parseInt(inputs[0]); // The first D lines contain the coordinates of drones of a player with the ID 0, the following D lines those of the drones of player 1, and thus it continues until the last player.
			const DY: number = parseInt(inputs[1]);
			const location = new Vector2(DX, DY);
			if (!drones[i]) drones[i] = [];

			if (drones[i].length !== dronesPerTeam) {
				drones[i].push(new Drone(location, j, i));
			} else {
				drones[i][j].pos = location;
			}

			const matchingZone: Zone = zones.find((x) => x.pos.equals(location));
			if (matchingZone) {
				matchingZone.drones.push(drones[i][j]);
			}
		}
	}

	const droneMap: { [id: number]: DroneStates } = {};
	const zoneMap: {
		[id: number]: { state: ZoneStates; num: number; enemies?: number };
	} = {};
	drones[myTEAM].forEach((x) => {
		droneMap[x.id] = DroneStates.Idle;
	});
	zones.forEach((currentZone, zoneIndex) => {
		let dronesOnZone: Drone[] = currentZone.drones.filter(
			(x) => x.team === myTEAM
		);

		let testin: { [id: string]: number } = currentZone.drones.reduce(
			(acc, val: Drone) => {
				if (val.team === myTEAM) return acc;
				if (!acc[val.team]) acc[val.team] = 0;
				acc[val.team] += 1;
				return acc;
			},
			{}
		);

		let enemiesDrones = Math.max(...Object.values(testin), 0);
		let delta = dronesOnZone.length - enemiesDrones;
		console.error(
			`ZOne: ${zoneIndex}, enemies: ${enemiesDrones}, delta: ${delta}`
		);
		if (dronesOnZone.length > 0) {
			//TODO: Only works with 2 players
			if (delta === 0) {
				switch (currentZone.owner) {
					case myTEAM:
						//We got em
						zoneMap[zoneIndex] = { state: ZoneStates.Mine, num: null };
						dronesOnZone.forEach((x) => {
							droneMap[x.id] = DroneStates.Defending;
						});
						break;
					default:
						//Defending and need another drone
						zoneMap[zoneIndex] = { state: ZoneStates.NeedHelp, num: 1 };
						dronesOnZone.forEach((x) => {
							droneMap[x.id] = DroneStates.Defending;
						});
						break;
				}
			} else if (delta > 0) {
				switch (currentZone.owner) {
					case myTEAM:
						//We won, and delta drones are idle
						zoneMap[zoneIndex] = { state: ZoneStates.Mine, num: null };
						droneMap[dronesOnZone[0].id] = DroneStates.Idle;
						dronesOnZone.forEach((x, i) => {
							droneMap[x.id] =
								i < delta ? DroneStates.Idle : DroneStates.Defending;
						});
						break;
					default:
						zoneMap[zoneIndex] = { state: ZoneStates.Broken, num: null };

						console.error("Zone is not mine, but delta says so?");
						break;
				}
			} else if (delta < 0) {
				switch (currentZone.owner) {
					case myTEAM:
						zoneMap[zoneIndex] = { state: ZoneStates.Broken, num: null };
						console.error("Zone is mine, but delta says otherwise?");
						break;
					default:
						zoneMap[zoneIndex] = {
							state: ZoneStates.NeedHelp,
							num: -delta + 1,
						};
						dronesOnZone.forEach((x) => {
							droneMap[x.id] = DroneStates.Idle;
						});
						break;
				}
			}
			zoneMap[zoneIndex].enemies = enemiesDrones;
		} else {
			switch (currentZone.owner) {
				case myTEAM:
					zoneMap[zoneIndex] = { state: ZoneStates.Mine, num: null };
					break;
				default:
					zoneMap[zoneIndex] = { state: ZoneStates.NeedHelp, num: -delta + 1 };
					break;
			}
		}
	});

	let goals = Object.entries(zoneMap).map((y) => {
		const zone = zones[+y[0]];
		return {
			id: y[0],
			zone,
			state: y[1].state,
			needed: y[1].num,
			enemies: y[1].enemies + y[1].state === ZoneStates.Mine ? 0 : 2,
		};
	});

	console.error(goals);

	//Find the optimal set of goals
	drones[myTEAM].forEach((x, i) => {
		let current = goals.find((x) => x.enemies > 0);
		if (!current) {
			console.error("fuck");
			let ownGoals = goals.map((y) => {
				return {
					...y,
					dist: sqDist(x.pos, y.zone.pos),
				};
			});
			ownGoals.sort((a, b) => a.dist - b.dist);

			current = ownGoals[0];
		}
		console.log(`${current.zone.pos.x} ${current.zone.pos.y}`);
		current.enemies--;
	});

	continue;

	drones[myTEAM].forEach((x) => {
		let state = droneMap[x.id];
		if (state === DroneStates.Idle) {
			let targetList = Object.entries(zoneMap)
				.map((y) => {
					return {
						id: y[0],
						zone: y[1],
						dist: sqDist(x.pos, zones[+y[0]].pos),
					};
				})
				.filter((y) => {
					return y.zone.state === ZoneStates.NeedHelp; // && y.zone.num > 0
				});
			targetList.sort((a, b) => a.dist - b.dist);
			let target: { id: string } = targetList.find((y) => y.zone.num > 0);
			if (!target) {
				console.error("fuck");
				target = {
					id: "0",
				};
			}
			if (zoneMap[+target.id]) zoneMap[+target.id].num -= 1;
			let zone = zones[+target.id].pos;
			console.log(`${zone.x} ${zone.y}`);
		} else if (state === DroneStates.Defending) {
			console.log(`${x.pos.x} ${x.pos.y}`);
		} else {
			console.log("we dun goofed");
		}
	});

	continue;
	for (let i = 0; i < dronesPerTeam; i++) {
		let distances: Array<{
			dist: number;
			zone: Zone;
			minPlayers: number;
		}> = zones.map((zone) => {
			return {
				dist: sqDist(zone.pos, drones[myTEAM][i].pos),
				zone,
				minPlayers: Math.max(
					...zone.drones.reduce((acc, val) => {
						if (val.id === myTEAM) return acc;
						if (!acc[val.id]) acc[val.id] = 0;
						acc[val.id] += 1;
						return acc;
					}, []),
					0
				),
			};
		});

		distances.sort((a, b) => a.dist - b.dist);

		let testing: Array<{ dist: number; zone: Zone }> = distances.filter(
			(x) =>
				x.zone.targeting.filter((y) => y !== myTEAM).length <
					x.minPlayers + 1 && x.zone.owner !== myTEAM
		);

		let picked: Zone = null;

		if (testing.length === 0) {
			picked = distances[0].zone;
		} else {
			picked = testing[0].zone;
		}
		picked.targeting.push(i);
		console.log(`${picked.pos.x} ${picked.pos.y}`);
	}
}
