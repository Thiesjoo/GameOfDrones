class Vector2 {
	constructor(public x: number, public y: number) {}

	equals(o: Vector2) {
		return o.x === this.x && o.y === this.y;
	}
}

class Drone {
	constructor(
		public pos: Vector2,
		public id: number, //The local id
		public team: number //Which team the drone belongs to
	) {}
}

class Zone {
	constructor(
		public pos: Vector2,
		public owner: number,
		public targeting: Array<number>,
		public drones: Array<Drone>
	) {}
}

const sqDist = (a: Vector2, b: Vector2) =>
	Math.abs(b.x - a.x) + Math.abs(b.y - a.y);

var inputs: string[] = readline().split(" ");
const amountOfPlayers: number = parseInt(inputs[0]); // number of players in the game (2 to 4 players)
const myTeam: number = parseInt(inputs[1]); // ID of your player (0, 1, 2, or 3)
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

	for (let i = 0; i < dronesPerTeam; i++) {
		let calc = getScore(drones[myTeam][i])[0];
		let picked = calc.zone;

		picked.targeting.push(i);
		console.log(`${picked.pos.x} ${picked.pos.y} ${calc.point}`);
	}
}

function getScore(drone: Drone): Array<{ point: number; zone: Zone }> {
	let info: Array<{
		dist: number;
		zone: Zone;
		players: Array<number>;
		minPlayers: number;
	}> = zones.map((zone) => {
		//Array with the index being the teamnumber and the value being the amount of drones of that team on the zone.
		const players = zone.drones.reduce((acc, val) => {
			if (val.id === drone.id) return acc;
			if (!acc[val.team]) acc[val.team] = 0;
			acc[val.team] += 1;
			return acc;
		}, []);

		return {
			zone, // Reference to the zone
			dist: sqDist(zone.pos, drone.pos), //Distance between zone and drone
			players, //All team on the zone
			minPlayers: Math.max(0, ...players.filter((x, i) => i !== drone.team)), //The minimum amount of players needed to tie the zone.
		};
	});

	let maxDist = Math.max(...info.map((x) => x.dist));

	/** Scoring:
	 * Distance normalized (0-1)
	 * Tile not owned by me, when there are no enemy's on the zone (+1)
	 * If we arrive and we cause a tie (+1)
	 * If we arrive and we have 2 drones too many (-1)
	 */
	let test = info.map((x) => {
		let amount = x.players[drone.team] + 1 + x.zone.targeting.length; //if we arrive
		let diff = x.minPlayers - amount; //0 means tie, negative means too many drones and positive is too few drones

		return {
			point:
				x.dist / maxDist +
				+(x.zone.owner !== myTeam && x.zone.drones.length === 0) +
				+(diff < 1) -
				+(diff < -1),
			zone: x.zone,
		};
	});
	test.sort((a, b) => a.point - b.point);
	return test;
}
