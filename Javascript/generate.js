const worldContainer = $("#world");
const worldWidth = worldContainer.width();
const worldHeight = worldContainer.height();
const amountOfTilesPerRow = 64;

const tileWidth = worldWidth / amountOfTilesPerRow;

let amountOfTilesGenerated = 0;
let amountOfTilesGeneratedX = 0;

function generateHeightMap(width, height, heightSettings) {
  const heightMap = [];
  for (let y = 0; y < height; y++) {
    heightMap.push([]);
    for (let x = 0; x < width; x++) {
      heightMap[y].push(
        Math.round(
          (noise.perlin2(x / 10, y / 10) *
            (heightSettings[1] - heightSettings[0])) /
            5
        ) * 5
      );
    }
  }
  return heightMap;
}

function generateBackgroundColor(tileType, height, tileTypes) {
  const typeInfo = tileTypes.find((types) => types[tileType]);
  const {
    color,
    height: [minHeight, maxHeight],
  } = typeInfo[tileType];

  const averageHeight = (minHeight + maxHeight) / 2;
  const heightDifference = calculateHeightDifference(height, averageHeight);
  const deviation = Math.random() * 40 - 20;

  const [r, g, b] = color.match(/\d+/g).map((component) => parseInt(component));
  const adjustedR = Math.max(
    0,
    Math.min(255, r + heightDifference + deviation)
  );
  const adjustedG = Math.max(
    0,
    Math.min(255, g + heightDifference + deviation)
  );
  const adjustedB = Math.max(
    0,
    Math.min(255, b + heightDifference + deviation)
  );

  return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
}

const tileTypes = [
  {
    water: {
      height: [-30, 0],
      color: "rgb(36, 42, 219)",
    },
    sand: {
      height: [0, 20],
      color: "rgb(255, 255, 100)",
    },
    terra: {
      height: [20, 40],
      color: "rgb(106, 62, 30)",
    },
    grass: {
      height: [40, 60],
      color: "rgb(22, 205, 34)",
    },
    stone: {
      height: [60, 80],
      color: "rgb(128, 128, 128)",
    },
    snow: {
      height: [100, 120],
      color: "rgb(241, 238, 236)",
    },
  },
];

const heightSettings = [-60, 180];

// Create heightmap using perlin noise from noise.js, math.js, and generate tiles based on heightSettings, and tileTypes, the array width should be the same as the world width, and the array height should be the same as the world height divided by the tile width
const heightMap = generateHeightMap(
  Math.floor(worldWidth / tileWidth), // Corrected width calculation
  Math.floor(worldHeight / tileWidth), // Corrected height calculation
  heightSettings
);

console.log(
  "Heightmap generated with " + amountOfTilesGenerated + " tiles: ",
  heightMap
);

// Map height to tile type if it is undefined, find closest tile type
function mapHeightToTileType(height) {
  let closestTileType;
  let closestTileTypeDiffer;
  for (let i = 0; i < tileTypes.length; i++) {
    for (const tileType in tileTypes[i]) {
      if (closestTileType === undefined) {
        closestTileType = tileType;
        closestTileTypeDiffer = Math.abs(
          height - tileTypes[i][tileType].height[0]
        );
      } else {
        if (
          Math.abs(height - tileTypes[i][tileType].height[0]) <
          closestTileTypeDiffer
        ) {
          closestTileType = tileType;
          closestTileTypeDiffer = Math.abs(
            height - tileTypes[i][tileType].height[0]
          );
        }
      }
    }
  }
  return closestTileType;
}

function calculateHeightDifference(height1, height2) {
  return Math.abs(height1 - height2);
}

function generateTile(x, y, heightMap, tileTypes, heightSettings, tileWidth) {
  const tile = document.createElement("div");
  const tileType = mapHeightToTileType(heightMap[y][x]);
  const bgColor = generateBackgroundColor(tileType, heightMap[y][x], tileTypes);

  const shadowStrength =
    (heightMap[y][x] - heightSettings[0]) /
    (heightSettings[1] - heightSettings[0]);

  tile.classList.add("tile", tileType);
  tile.style.width = tileWidth + "px";
  tile.style.height = tileWidth + "px";
  tile.style.left = x * tileWidth + "px";
  tile.style.backgroundColor = bgColor;

  tile.style.boxShadow = `0px 0px ${
    shadowStrength * 10
  }px rgba(0, 0, 0, ${shadowStrength})`;

  const neighborHeight = heightMap[y][x - 1] || heightMap[y][x];
  const heightDifference = calculateHeightDifference(
    heightMap[y][x],
    neighborHeight
  );
  const gradientColor = generateBackgroundColor(
    tileType,
    neighborHeight,
    tileTypes
  );

  tile.style.backgroundImage = `linear-gradient(${bgColor}, ${gradientColor})`;

  return tile;
}

function generateRow(y, heightMap, tileTypes, heightSettings, tileWidth) {
  const newRow = document.createElement("div");
  newRow.classList.add("row"); // Add the "row" class to the row element

  for (let x = 0; x < amountOfTilesPerRow; x++) {
    const tile = generateTile(
      x,
      y,
      heightMap,
      tileTypes,
      heightSettings,
      tileWidth
    );
    newRow.appendChild(tile);
    amountOfTilesGenerated++;
  }

  return newRow;
}

async function generateTerrain() {
  let currentRow = null; // Track the current row div
  // Function to update heightMap
  function updateHeightMap(newRows) {
    for (let i = 0; i < newRows; i++) {
      // Generate a new row and add it to the beginning of the heightMap
      const newRow = [];
      for (let x = 0; x < Math.floor(worldWidth / tileWidth); x++) {
        newRow.push(
          Math.round(
            (noise.perlin2(x / 10, (heightMap.length + i) / 10) *
              (heightSettings[1] - heightSettings[0])) /
              5
          ) * 5
        );
      }
      heightMap.unshift(newRow);
    }
  }

  // Update this code here to support the updateHeightMap function
  for (let y = 0; y < heightMap.length; y++) {
    if (amountOfTilesGeneratedX === 0) {
      // Create a new row div when starting a new row
      currentRow = generateRow(
        y,
        heightMap,
        tileTypes,
        heightSettings,
        tileWidth
      );
    }

    worldContainer.append(currentRow);
    amountOfTilesGeneratedX = 0;
  }

  // Add event listener to check if the user has reached the bottom of the world
  document.getElementById("world").addEventListener("scroll", (event) => {
    const { scrollHeight, scrollTop, clientHeight } = event.target;

    if (Math.abs(scrollHeight - clientHeight - scrollTop) < 1) {
      // Calculate how many new rows need to be generated
      const rowsToGenerate = 1;
      updateHeightMap(rowsToGenerate);

      // Generate and append the new rows
      for (let i = 0; i < rowsToGenerate; i++) {
        const newRow = generateRow(
          i,
          heightMap,
          tileTypes,
          heightSettings,
          tileWidth
        );
        worldContainer.append(newRow);
      }
    }
  });

  // Initialize the world with the first two rows for scrolling room
  for (let i = 0; i < 2; i++) {
    const initialRow = generateRow(
      i,
      heightMap,
      tileTypes,
      heightSettings,
      tileWidth
    );
    worldContainer.append(initialRow);
  }
}

generateTerrain();
