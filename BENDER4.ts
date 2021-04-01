interface Point {
    x: number,
    y: number,
    z: number
}

interface MapPoint {
    links: Array<number>;
    pos: Point,
    parent?: number;
}

interface Obstacle {
    posTrigger: Point,
    posField: Point,
    state: boolean, index: number
}

const locationBitLength = 5; // Max heigth is 21. 21 in binary is `10101`. 5 bits are needed to store location
const statusBitLength = 11; // Max number of switches is 11. So we need 11 bits to represent the state


/** Array of all the fields, Ordered by ID*/
let minifiedFields: number[] = []
/** Array of all the triggers, Ordered by ID */
let minifiedTriggers: number[] = []


function pathFind(currentMap: MapPoint[], start: Point, end: Point): Point[] {
    let visited = {};
    let parentMap = {}

    const endIndex = pointToIndex(end);
    const startIndex = pointToIndex(start);
    let queue: number[] = [startIndex];

    visited[startIndex] = true

    while (queue.length > 0) {
        const currentNode = queue.shift();

        if (checkPoints(endIndex, currentNode)) {
            let path: number[] = []
            let currentPath = currentNode
            while (startIndex !== currentPath) {
                path.push(currentPath)
                currentPath = parentMap[currentPath]
            }
            path.push(currentPath)
            path.reverse();

            return path.map(x => {
                return indexToPoint(x)
            })
        }

        getChildren(currentMap, currentNode).forEach(x => {
            if (!visited[x]) {
                parentMap[x] = currentNode
                queue.push(x)
                visited[x] = true
            }
        })
    }
    return []
}


function getChildren(currentMap: MapPoint[], location: number): number[] {
    const mapLocation = stripZ(location)
    const mapPoint = currentMap[mapLocation];

    let currState = getBitRange(location, locationBitLength * 2, statusBitLength)

    const foundTrigger = minifiedTriggers.findIndex(ob => ob === mapLocation)
    if (foundTrigger > -1) {
        currState ^= (1 << foundTrigger)
    }

    const filtered = mapPoint.links.map(x => {
        //Check if it's an obstacle
        const ob = minifiedFields.findIndex(y => y === x);
        if (ob > -1 && (currState & (1 << ob)) !== 0) {
            return false
        }
        return x
    })
        //Filter out obstacles
        .filter(x => x !== false)
        //Apply new state
        .map((x: number) => x | currState << 2 * locationBitLength)

    return filtered
}

let stringMap: string[][] = [];
let map: MapPoint[] = [];

const mapInputs: string[] = readline().split(' ');
const width: number = parseInt(mapInputs[0]);
const height: number = parseInt(mapInputs[1]);
for (let yi = 0; yi < height; yi++) {
    const line: string[] = readline().split("");
    stringMap.push(line)
}

// This happens after init, because it needs all map information
stringMap.forEach((row, yi) => {
    row.forEach((item, xi) => {
        const pos = { x: xi, y: yi, z: 0 }
        switch (item) {
            case "+":
            case "#":
                map[pointToIndex(pos)] = {
                    links: [],
                    pos,
                }
                break;
            case ".":
                // Get all neighbors
                let res = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(z => {
                    if (stringMap[z[1] + yi][z[0] + xi] === ".") {
                        return pointToIndex({ x: z[0] + xi, y: z[1] + yi, z: 0 })
                    }
                }).filter(z => z)
                map[pointToIndex(pos)] = {
                    links: res,
                    pos,
                }
        }
    })
})

const startCoords: string[] = readline().split(' ');
let start: Point = {
    x: +startCoords[0],
    y: +startCoords[1],
    z: 0
}

const endCoords: string[] = readline().split(' ');
let end: Point = {
    x: +endCoords[0],
    y: +endCoords[1],
    z: 0
}

const obstStates = []
const switchCount: number = parseInt(readline());
for (let i = 0; i < switchCount; i++) {
    var inputs: string[] = readline().split(' ');
    const switchX: number = parseInt(inputs[0]);
    const switchY: number = parseInt(inputs[1]);
    const blockX: number = parseInt(inputs[2]);
    const blockY: number = parseInt(inputs[3]);
    const initialState: number = parseInt(inputs[4]); // 1 if blocking, 0 otherwise

    minifiedFields.push(pointToIndex({
        x: blockX,
        y: blockY,
        z: 0
    }))
    minifiedTriggers.push(pointToIndex({
        x: switchX,
        y: switchY,
        z: 0
    }))
    obstStates.unshift(initialState ? "1" : "0")
}

// Initial state
start.z = parseInt(obstStates.join(''), 2)

let runtimes = {
    pathfind: 0,
    stringCount: 0,
}

runtimes.pathfind = Date.now()
const pathToFry = pathFind(map, start, end)
console.error("pathfind time: ", Date.now() - runtimes.pathfind)

const path = [...pathToFry, end];
let resultSTR = ""
let current = start
for (let i = 1; i < path.length; i++) {
    let pathPos = path[i]
    const absX = current.x - pathPos.x;
    const absY = current.y - pathPos.y;
    if (absX === 1) {
        resultSTR += "L"
    } else if (absX === -1) {
        resultSTR += "R"
    } else if (absY === 1) {
        resultSTR += "U"
    } else if (absY === -1) {
        resultSTR += "D"
    }
    current = path[i];
}


function findRepetition(p: string) {
    let lookup: {
        [x: string]: number;
    } = {};

    while (p.length !== 0) {
        for (let i = 0; i < p.length; i++) {
            let tmp = p.substr(0, i);
            if (!lookup[tmp]) lookup[tmp] = 0;
            lookup[tmp] += 1;
        }
        p = p.substring(1);
    }
    return lookup;
}

function repeats(p: string): string {
    let a = findRepetition(p);
    let rs = Object.entries(a)
        .filter((x, i) => i !== 0 && x[1] > 1)
        .map((x) => x[0])
        // Check if length is larger than 2 and if the string appears at least twice
        .filter((x) => x.length > 3 && p.split(x).length - 1 > 4);
    rs?.sort((a, b) => p.split(b).length - 1 - (p.split(a).length - 1));

    let func: string[] = [];
    let newRes = p;
    rs.forEach((x, i) => {
        // Max 9 functions
        if (i < 9) {
            func.push(x);
            newRes = newRes.replace(new RegExp(`${x}`, "g"), func.length.toString());
        }
    });
    const test = `${newRes};${func.join(";")}`;
    return test;
}

function repeats2(s: string): string {
	let func = [];

	let p = s;

	while (func.length !== 9) {
		let a = findRepetition(p);
		let rs = Object.entries(a)
			.filter((x, i) => i !== 0 && x[1] > 1)
			.map((x) => x[0])
			// Check if length is larger than 2 and if the string appears at least twice
			.filter((x) => x.length > 3 && p.split(x).length - 1 > 4);

		if (rs.length === 0) {
			break;
		}

		// Current function number
		const curr = (func.length + 1).toString();

		// Sort based on length of string
		rs?.sort((a, b) => {
			let aTest = p.replace(new RegExp(`${a}`, "g"), curr);
			let bTest = p.replace(new RegExp(`${b}`, "g"), curr);
			return bTest.length + b.length - (aTest.length + a.length);
		});

		// console.log(p, func, rs[0]);

		// Replace our search string
		p = p.replace(new RegExp(`${rs[0]}`, "g"), curr);
		func.push(rs[0]);
	}

	// console.log(p)
	return `${p};${func.join(";")}`;
}


function repeats1(p: string): string {
    let func = [];

    while (func.length !== 9) {
        let a = findRepetition(p);
        let rs = Object.entries(a)
            // At least 3 occurences and string has to be at least 3 char's long
            .filter(
                (x, i) =>
                    i !== 0 &&
                    x[1] > 2 && //Count of occurenses
                    x[0].length > 3 // String
            )
            .map((x) => x[0]);
        if (rs.length === 0) {
            break;
        }

        // Current function number
        const curr = func.length.toString() + 1;

        // Sort based on length of string
        rs?.sort((a, b) => {
            let aTest = p.replace(new RegExp(`${a}`, "g"), curr);
            let bTest = p.replace(new RegExp(`${b}`, "g"), curr);
            return bTest.length + b.length - (aTest.length + a.length);
        });

        // Replace our search string
        p = p.replace(new RegExp(`${rs[0]}`, "g"), curr);
        func.push(rs[0]);
    }

    return `${p};${func.join(";")}`;
}


runtimes.stringCount = Date.now()

let res = repeats(resultSTR)

console.error("String: ", Date.now() - runtimes.stringCount)
console.error(`Unoptimzed path: `, resultSTR)
console.error("Total", Date.now() - runtimes.pathfind)
console.log(res)

function getBitRange(n, startIndex, size) {
    return (n >> startIndex) & ((1 << size) - 1);
}

function clearBitRange(n, startIndex, size) {
    const mask = (1 << size) - 1;
    return n & ~(mask << startIndex);
}

function indexToPoint(index: number): Point {
    return {
        x: getBitRange(index, 0, locationBitLength),
        y: getBitRange(index, locationBitLength, locationBitLength),
        z: getBitRange(index, 2 * locationBitLength, statusBitLength),
    }
}

function pointToIndex(pnt: Point): number {
    return pnt.x | (pnt.y << locationBitLength) | (pnt.z << locationBitLength * 2)
}

/** Check the x & y of every object */
function checkPoints(bits1: number, bits2: number): boolean {
    return getBitRange(bits1, 0, locationBitLength) === getBitRange(bits2, 0, locationBitLength) && getBitRange(bits1, locationBitLength, locationBitLength) === getBitRange(bits2, locationBitLength, locationBitLength)
}

function stripZ(bits: number): number {
    return clearBitRange(bits, 2 * locationBitLength, statusBitLength)
}
