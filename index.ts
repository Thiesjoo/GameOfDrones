class Vector2 {
	constructor(public x: number, public y: number) {}
}

class Zone {
	constructor(
		public pos: Vector2,
		public owner: number,
		public targeting: Array<number>
	) {}
}

class Drone {
	constructor(public pos: Vector2, public id: number) {}
}

const sqDist = (a: Vector2, b: Vector2) =>
	Math.abs(b.x - a.x) + Math.abs(b.y - a.y);

var inputs: string[] = readline().split(" ");
const amountOfPlayers: number = parseInt(inputs[0]); // number of players in the game (2 to 4 players)
const myID: number = parseInt(inputs[1]); // ID of your player (0, 1, 2, or 3)
const dronesPerTeam: number = parseInt(inputs[2]); // number of drones in each team (3 to 11)
const amountOfZones: number = parseInt(inputs[3]); // number of zones on the map (4 to 8)

let myDrones: Array<Drone> = [];
let zones: Array<Zone> = [];
for (let i = 0; i < amountOfZones; i++) {
	var inputs: string[] = readline().split(" ");
	const X: number = parseInt(inputs[0]); // corresponds to the position of the center of a zone. A zone is a circle with a radius of 100 units.
	const Y: number = parseInt(inputs[1]);
	zones.push(new Zone(new Vector2(X, Y), 0, []));
}

console.error(zones);

// game loop
while (true) {
	for (let i = 0; i < amountOfZones; i++) {
		const TID: number = parseInt(readline()); // ID of the team controlling the zone (0, 1, 2, or 3) or -1 if it is not controlled. The zones are given in the same order as in the initialization.
		zones[i].owner = TID;
		zones[i].targeting = [];
	}

	for (let i = 0; i < amountOfPlayers; i++) {
		for (let j = 0; j < dronesPerTeam; j++) {
			var inputs: string[] = readline().split(" ");
			const DX: number = parseInt(inputs[0]); // The first D lines contain the coordinates of drones of a player with the ID 0, the following D lines those of the drones of player 1, and thus it continues until the last player.
			const DY: number = parseInt(inputs[1]);
			if (i === myID) {
				if (myDrones.length !== dronesPerTeam) {
					myDrones.push(new Drone(new Vector2(DX, DY), j));
				} else {
					myDrones[j].pos.x = DX;
					myDrones[j].pos.y = DY;
				}
			}
		}
	}
	// let prefferedPlayerForZone: {[id:number]: number  } = {}

	// for (let i = 0; i < amountOfZones; i++) {
	//     let dist = myDrones.map(x=> {
	//         return{dist: sqDist(x.pos, zones[i].pos), id: x.id}
	//     })
	//     dist.sort((a,b) => a.dist-b.dist);
	//     prefferedPlayerForZone[i] = dist[0].id
	// }

	// let testing = Object.entries(prefferedPlayerForZone);

	for (let i = 0; i < dronesPerTeam; i++) {
		let distances: Array<{ dist: number; zone: Zone }> = zones.map((zone) => {
			return { dist: sqDist(zone.pos, myDrones[i].pos), zone };
		});
		distances.sort((a, b) => a.dist - b.dist);

		let testing: Array<{ dist: number; zone: Zone }> = distances.filter(
			(x) => x.zone.targeting.length === 0
		);
		let picked: Zone = null;

		if (testing.length === 0) {
			picked = distances[Math.floor(Math.random() * distances.length)].zone;
		} else {
			picked = testing[0].zone;
		}
		picked.targeting.push(i);
		console.log(`${picked.pos.x} ${picked.pos.y}`);
	}
}
