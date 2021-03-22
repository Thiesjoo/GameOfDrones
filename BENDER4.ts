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


const obst: Obstacle[] = [];
/** Array of all the fields, Orderd with same index as obst */
let minifiedObst: number[] = []


function pathFind(currentMap: MapPoint[], start: Point, end: Point): Point[] {
    let visited = {};
    let parentMap = {}

    const endIndex = pointToIndex(end);
    const startIndex = pointToIndex(start);
    let queue: Index[] = [startIndex];

    visited[startIndex] = true

    while (queue.length > 0) {
        const currentNode = queue.shift();
        // console.error(indexToPoint(currentNode))

        if (checkPoints(endIndex, currentNode)) {
            console.error("FOUND THA END")

            let path: number[] = []
            let currentPath = currentNode

            // Object.entries(parentMap).map(x => {
            //     console.error(indexToPoint(+x[0]), indexToPoint(+x[1]))
            // })

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
                // console.error("Children", indexToPoint(x))
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
    let currState = dataFromBits(location, 2, height) //Z coordinate

    const foundTrigger = obst.findIndex(ob => ob.posTrigger.x === mapPoint.pos.x && ob.posTrigger.y === mapPoint.pos.y);
    if (foundTrigger > -1) {
        currState ^= (1 << foundTrigger)
    }

    if (mapPoint.pos.x === 3 && mapPoint.pos.y === 8) {
        console.error(mapPoint, currState.toString(2))
    }

    //@ts-ignore
    const filterd: number[] = mapPoint.links.map(x => {
        //Check if it's an obstacle
        const ob = minifiedObst.findIndex(y => y === stripZ(x));

        if (mapPoint.pos.x === 3 && mapPoint.pos.y === 8) {
            console.error(ob,minifiedObst[ob] ,currState.toString(2))
        }

        if (ob > -1) {
            // console.error("Found a ob", ob, currState, (currState & 1 << ob) != 0)
            // Check if obstacle is active
            if ((currState & (1 << ob)) !== 0) {
                // console.error("not including obst")
                return false
            } else {
                // console.error(indexToPoint(location), " passing through", currState)
            }
        }
        return x
    }).filter(x => x !== false).map(x => {
        // Apply the newest state to the current position
        //@ts-ignore
        return dataToBits(x, currState, 2, height)
    })

    return filterd
}


function obstaclesToNumber(obstacles: Obstacle[]) {
    return parseInt(obstacles.map(x => x.state ? "1" : "0").join(''), 2)
}

let start: Point;
let end: Point;
let stringMap: string[][] = [];
let map: MapPoint[] = [];


const mapInputs: string[] = readline().split(' ');
const width: number = parseInt(mapInputs[0]);
const height: number = parseInt(mapInputs[1]);
for (let i = 0; i < height; i++) {
    const line: string[] = readline().split("");
    stringMap.push(line)
}

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
start = {
    x: +startCoords[0],
    y: +startCoords[1],
    z: 0
}

const endCoords: string[] = readline().split(' ');
end = {
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

    minifiedObst.push(pointToIndex(field))
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

console.error(obst, start.z)
const pathToFry = pathFind(map, start, end)
console.error(pathToFry);

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


function indexToPoint(index: Index): Point {
    return {
        x: dataFromBits(index, 0, height),
        y: dataFromBits(index, 1, height),
        z: dataFromBits(index, 2, height),
    }
}

function pointToIndex(pnt: Point): Index {
    return pnt.x | (pnt.y << height) | (pnt.z << height * 2)
}

function dataToBits(bits: number, data: number, index: number, cutoff: number = 1) {
    return data << index * cutoff | bits
}

function dataFromBits(bits: number, index: number, cutoff: number): number {
    return bits >> index * cutoff & 0xFF
}

/** Check the x & y of every object */
function checkPoints(bits1: number, bits2: number): boolean {
    return dataFromBits(bits1, 0, height) === dataFromBits(bits2, 0, height) && dataFromBits(bits1, 1, height) === dataFromBits(bits2, 1, height)
}

function stripZ(bits: number): number {
    let pnt = indexToPoint(bits)
    pnt.z = 0;
    return pointToIndex(pnt)
}
