# Game of Drones

This is my implementation for the [codingame Game Of Drones](https://www.codingame.com/ide/puzzle/game-of-drones)

## How my code works

(dutch)
7 januari 2021: (Bronze t/m 300)

Momenteel een greedy oplossing:
Ga naar de eerste zone die niet door andere drones getarget wordt.
De drones die overblijven doen op het moment niks

Algorimte verbeterd (3 place in silver rank)
Nu worden alle drones ook opgeslagen, inclusief in de zones. Bot kijkt nu of het nodig is om naar een zone te gaan.

Nieuw score systeem (... place in ...)

```ts
/** Scoring:
 * Distance normalized (0-1)
 * Tile not owned by me, when there are no enemy's on the zone (+1)
 * If we arrive and we cause a tie (+1)
 * If we arrive and we have 2 drones too many (-1)
 */
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
