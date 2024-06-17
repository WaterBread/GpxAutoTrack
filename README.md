# GPX Auto Track

Interpolates between points on a low quality GPX track by following OSM paths. Provides a "best guess" at where you were at a given time.

Example:

![example](https://files.catbox.moe/4j6joj.avif)

## Why

GPS tracking requires battery life. Which is a problem when away from power sources for extended periods of time. The trade off is to record a point for every 10+ minutes, and do post-processing when available.

## Usage

```bash
pnpm start -i low_quality.gpx -o output.gpx -p 1
```

Explanation of args:

|Arg|Shorthand|Description|
|-|-|-|
|input|i|Input file path|
|output|o|Output file path|
|interpolate|p|Number of points to insert between snapped points|

