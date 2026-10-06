# Liga Fall Guys 1v1

Marcador público de cuatro ligas separadas. Cualquiera puede ver la clasificación. Solo quien tiene la clave carga partidos, y al guardar un resultado la tabla se recalcula sola.

## Qué cuenta

- Victoria: 3 puntos
- Empate: 1 punto
- Derrota: 0
- Si hay empate a puntos, manda la diferencia de rondas y después las rondas a favor
- Un empate justo en el corte de ascenso o descenso se marca como **en disputa**

## Cortes provisionales

Todavía se pueden cambiar desde el panel, liga por liga. El valor de arranque es:

| Liga | Ascenso | Descenso |
| --- | --- | --- |
| Liga 1 | ninguno | 2 últimos |
| Liga 2 | 2 primeros | 2 últimos |
| Liga 3 | 2 primeros | 2 últimos |
| Liga 4 | 2 primeros | ninguno |

Pon `0` en un corte para apagar esa zona. Las zonas solo se pintan cuando la liga ya tiene al menos un partido.

## Arrancar

```bash
npm install
npm run dev
```

Abre [http://127.0.0.1:43123](http://127.0.0.1:43123). El panel está en `/admin`.

La clave local, si no defines otra, es `liga-fallguys`. Para cambiarla, copia `.env.example` a `.env.local` y edita `ADMIN_PASSWORD`.

Los resultados se guardan en `data/league.json` en el servidor. Ese archivo no se sube al repositorio.
