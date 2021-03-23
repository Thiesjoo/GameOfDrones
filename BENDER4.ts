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

const locationBitLength = 6;
const statusBitLength = 11


const obst: Obstacle[] = [];
/** Array of all the fields, Orderd with same index as obst */
let minifiedFields: number[] = []
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
    //check if location is switch
    // If so, change the Z value of all children;
    const mapPoint = currentMap[stripZ(location)];
    // let currState = indexToPoint(location).z
    let currState = getBitRange(location, locationBitLength*2, statusBitLength)
    // let currState = dataFromBits(location, 2, height) //Z coordinate

    const foundTrigger = obst.findIndex(ob => ob.posTrigger.x === mapPoint.pos.x && ob.posTrigger.y === mapPoint.pos.y);
    if (foundTrigger > -1) {
        currState ^= (1 << foundTrigger)
    }

    //@ts-ignore
    const filterd: number[] = mapPoint.links.map(x => {
        //Check if it's an obstacle
        const ob = minifiedFields.findIndex(y => y === x);
        if (ob > -1) {
            if (getBitRange(currState, ob, 1) !== 0) {
                // if ((currState & (1 << ob)) !== 0) {
                return false
            }
        }
        return x
    }).filter(x => x !== false).map(x => {
        // Apply the newest state to the current position
        //@ts-ignore
        let samplePnt = indexToPoint(x)
        samplePnt.z = currState;
        return pointToIndex(samplePnt)
        // return dataToBits(x, currState, 2, height)

    })

    return filterd
}


function obstaclesToNumber(obstacles: Obstacle[]) {
    if (obstacles.length === 0) return 0;
    let obstBits = obstacles.map(x => x.state ? "1" : "0")
    obstBits.reverse()
    return parseInt(obstBits.join(''), 2)
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

const switchCount: number = parseInt(readline());
for (let i = 0; i < switchCount; i++) {
    var inputs: string[] = readline().split(' ');
    const switchX: number = parseInt(inputs[0]);
    const switchY: number = parseInt(inputs[1]);
    const blockX: number = parseInt(inputs[2]);
    const blockY: number = parseInt(inputs[3]);
    const initialState: number = parseInt(inputs[4]); // 1 if blocking, 0 otherwise

    let field = {
        x: blockX,
        y: blockY,
        z: 0
    }

    minifiedFields.push(pointToIndex(field))
    obst.push({
        posField: field,
        posTrigger: {
            x: switchX,
            y: switchY,
            z: 0
        },
        state: Boolean(initialState),
        index: i
    })
}

start.z = obstaclesToNumber(obst)

let dates = {
    pathfind: 0
}

dates.pathfind = Date.now()
const pathToFry = pathFind(map, start, end)
console.error("pathfind time: ", Date.now() - dates.pathfind)

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

const LN_2 = Math.log(2);

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
    return setBitRange(setBitRange(setBitRange(0, 0, locationBitLength, pnt.x), locationBitLength, locationBitLength, pnt.y), 2 * locationBitLength, statusBitLength, pnt.z)
    // return pnt.x | (pnt.y << bitHeight) | (pnt.z << bitHeight * 2)
}


/** Check the x & y of every object */
function checkPoints(bits1: number, bits2: number): boolean {
    const pnt1 = indexToPoint(bits1)
    const pnt2 = indexToPoint(bits2)
    return pnt1.x === pnt2.x && pnt1.y === pnt2.y
    // return dataFromBits(bits1, 0, bitHeight) === dataFromBits(bits2, 0, bitHeight) && dataFromBits(bits1, 1, bitHeight) === dataFromBits(bits2, 1, bitHeight)
}

function stripZ(bits: number): number {
    return clearBitRange(bits, 2 * locationBitLength, statusBitLength)
}
// function stripZ(bits: number): number {
//     let pnt = indexToPoint(bits)
//     pnt.z = 0;
//     return pointToIndex(pnt)
// }
