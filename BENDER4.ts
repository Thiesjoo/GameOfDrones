interface Point {
    x: number,
    y: number,
    z: number
}

type Index = number;

interface MapPoint {
    links: Array<Index>;
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
    let queue: Index[] = [startIndex];

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


function getChildren(currentMap: MapPoint[], location: Index): number[] {
    const mapLocation = stripZ(location)
    const mapPoint = currentMap[mapLocation];

    let currState = getBitRange(location, locationBitLength * 2, statusBitLength)

    const foundTrigger = minifiedTriggers.findIndex(ob => ob === mapLocation)
    if (foundTrigger > -1) {
        currState ^= (1 << foundTrigger)
    }

    const filtered: number[] = mapPoint.links.map(x => {
        //Check if it's an obstacle
        const ob = minifiedFields.findIndex(y => y === x);
        if (ob > -1 && (currState & (1 << ob)) !== 0) {
            return false
        }
        return x
    }).filter(x => x !== false).map(x => {
        return setBitRange(x, 2 * locationBitLength, statusBitLength, currState)
    })

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

start.z = parseInt(obstStates.join(''), 2)

let runtimes = {
    pathfind: 0
}

runtimes.pathfind = Date.now()
const pathToFry = pathFind(map, start, end)
console.error("pathfind time: ", Date.now() - runtimes.pathfind)

const path = [...pathToFry, end];
let str = ""
let current = start
for (let i = 1; i < path.length; i++) {
    let pathPos = path[i]
    const absX = current.x - pathPos.x;
    const absY = current.y - pathPos.y;
    if (absX === 1) {
        str += "L"
    } else if (absX === -1) {
        str += "R"
    } else if (absY === 1) {
        str += "U"
    } else if (absY === -1) {
        str += "D"
    }
    current = path[i];
}
console.log(str);

function getBitRange(n, startIndex, size) {
    return (n >> startIndex) & ((1 << size) - 1);
}

function setBitRange(n, startIndex, size, value) {
    const mask = (1 << size) - 1;
    return (
        n & ~(mask << startIndex)
    ) | ((value & mask) << startIndex);
}

function clearBitRange(n, startIndex, size) {
    const mask = (1 << size) - 1;
    return n & ~(mask << startIndex);
}


function indexToPoint(index: Index): Point {
    return {
        x: getBitRange(index, 0, locationBitLength),
        y: getBitRange(index, locationBitLength, locationBitLength),
        z: getBitRange(index, 2 * locationBitLength, statusBitLength),
    }
}

function pointToIndex(pnt: Point): Index {
    // return setBitRange(setBitRange(setBitRange(0, 0, locationBitLength, pnt.x), locationBitLength, locationBitLength, pnt.y), 2 * locationBitLength, statusBitLength, pnt.z)
    return pnt.x | (pnt.y << locationBitLength) | (pnt.z << locationBitLength * 2)
}


/** Check the x & y of every object */
function checkPoints(bits1: number, bits2: number): boolean {
    return getBitRange(bits1, 0, locationBitLength) === getBitRange(bits2, 0, locationBitLength) && getBitRange(bits1, locationBitLength, locationBitLength) === getBitRange(bits2, locationBitLength, locationBitLength)
}

function stripZ(bits: number): number {
    return clearBitRange(bits, 2 * locationBitLength, statusBitLength)
}
