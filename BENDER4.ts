interface Point {
    x: number,
    y: number
}

type Index = number;

interface MapPoint {
    links: Array<Index>;
    pos: Point,
    visited: boolean;
    parent?: number;
}

interface Obstacle {
    posTrigger: Point,
    posField: Point,
    state: boolean
}

function pathFind(currentMap: MapPoint[], start: Point, end: Point, obstacles: Obstacle[]): MapPoint[] {
    currentMap.forEach(x => {
        x.visited = false;
    })
    const endIndex = pointToIndex(end);
    const startIndex = pointToIndex(start);

    const obstIndeces = obstacles.map(x => {
        return {
            fieldIndex: pointToIndex(x.posField),
            triggerIndex: pointToIndex(x.posTrigger),
            obst: x
        }
    })

    let queue: Index[] = [startIndex];


    currentMap[queue[0]].visited = true

    while (queue.length > 0) {
        const currentNode = queue.shift();

        if (currentNode === endIndex) {
            let path: MapPoint[] = []
            let currentPath = endIndex
            while (currentPath !== startIndex) {
                path.push(currentMap[currentPath])
                currentPath = currentMap[currentPath].parent
            }
            path.push(currentMap[currentPath])
            path.reverse()
            return path
        }

        currentMap[currentNode].links.forEach(x => {
            let neighborNode = currentMap[x];
            
            if (!neighborNode.visited && !obstIndeces.find(z => z.fieldIndex === x && z.obst.state)) {
                neighborNode.parent = currentNode
                queue.push(x)
            }
            neighborNode.visited = true
        })
    }
    return []
}


const obst: Obstacle[] = [];
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
        const pos = { x: xi, y: yi }
        switch (item) {
            case "+":
            case "#":
                map[pointToIndex(pos)] = {
                    links: [],
                    visited: false,
                    pos,
                }
                break;
            case ".":
                let res = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(z => {
                    if (stringMap[z[1] + yi][z[0] + xi] === ".") {
                        return pointToIndex({ x: z[0] + xi, y: z[1] + yi })
                    }
                }).filter(z => z)
                map[pointToIndex(pos)] = {
                    links: res,
                    visited: false,
                    pos,
                }
        }
    })
})


const startCoords: string[] = readline().split(' ');
start = {
    x: +startCoords[0],
    y: +startCoords[1]
}

const endCoords: string[] = readline().split(' ');
end = {
    x: +endCoords[0],
    y: +endCoords[1]
}

const switchCount: number = parseInt(readline());
for (let i = 0; i < switchCount; i++) {
    var inputs: string[] = readline().split(' ');
    const switchX: number = parseInt(inputs[0]);
    const switchY: number = parseInt(inputs[1]);
    const blockX: number = parseInt(inputs[2]);
    const blockY: number = parseInt(inputs[3]);
    const initialState: number = parseInt(inputs[4]); // 1 if blocking, 0 otherwise

    obst.push({
        posField: {
            x: blockX,
            y: blockY
        },
        posTrigger: {
            x: switchX,
            y: switchY
        },
        state: Boolean(initialState)
    })
}

const pathToFry = pathFind(map, start, end, obst)

console.error(pathToFry);



// const path = [..., { pos: end }];
// let str = ""
// let current = start
// for (let i = 1; i < path.length; i++) {
//     let pathPos = path[i].pos
//     const absX = current.x - pathPos.x;
//     const absY = current.y - pathPos.y;
//     if (absX === 1) {
//         str += "L"
//     } else if (absX === -1) {
//         str += "R"
//     } else if (absY === 1) {
//         str += "U"
//     } else if (absY === -1) {
//         str += "D"
//     }
//     current = path[i].pos;
// }
// console.error(obst)
// console.log(str);


function indexToPoint(index: Index): Point {
    return {
        x: index % height,
        y: Math.floor((index - index % height) / height)
    }
}
function pointToIndex(pnt: Point): Index {
    return pnt.x * height + pnt.y
}
