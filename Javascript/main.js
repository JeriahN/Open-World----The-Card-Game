const menuContainer = document.getElementById("menuContainer");
const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");
const cardContainer = document.getElementById("cardContainer");
let world = document.getElementById("world");
let isMenuOpen = false;
let isMouseOverMenu = false;
let cards;

// Initialize Fuse for searching cards
let fuse;

const recipes = [
  {
    result: "Pickaxe",
    ingredients: ["Rock", "Stick"],
  },
];

// Apply focused class to the .searchBox while #searchBox is focused
document.getElementById("searchBox").addEventListener("focus", () => {
  document.querySelector(".searchBox").classList.add("searchBoxFocused");
});

// Remove focused class from the .searchBox while #searchBox is not focused
document.getElementById("searchBox").addEventListener("blur", () => {
  document.querySelector(".searchBox").classList.remove("searchBoxFocused");
});

const toggleMenu = () => {
  isMenuOpen = !isMenuOpen;
  menu.classList.toggle("show", isMenuOpen);
  menuButton.style.transform = isMenuOpen
    ? "translateX(220px)"
    : "translateX(0)";

  menuButton.classList.toggle("closed", isMenuOpen);
};

menuButton.addEventListener("click", toggleMenu);

document.querySelector(".searchBox").addEventListener("click", () => {
  document.getElementById("searchBox").focus();
});

menuButton.addEventListener("mouseenter", () => {
  if (!isMenuOpen) {
    toggleMenu();
    document.getElementById("searchBox").focus();
  } else {
    document.activeElement.blur();
  }
});

menuContainer.addEventListener("mouseleave", () => {
  isMouseOverMenu = false;
  if (isMenuOpen) {
    document.activeElement.blur();
  }
  setTimeout(() => {
    if (!isMouseOverMenu && isMenuOpen) {
      toggleMenu();
    }
  }, 200);
});

document.addEventListener("click", (event) => {
  if (isMenuOpen && !menuContainer.contains(event.target)) {
    isMenuOpen = false;
    menu.classList.remove("show");
    menuButton.style.transform = "translateX(0)";
  }
});

class Card {
  constructor(name, description, maxQuantity, rarity, type) {
    this.name = name;
    this.description = description;
    this.maxQuantity = maxQuantity;
    this.rarity = rarity;
    this.type = type;
    this.quantity = 0;
    this.element = null;
  }

  updateQuantity(change) {
    this.quantity += change;
    const quantityElement = this.element.querySelector(".quantity");
    quantityElement.textContent = this.maxQuantity - this.quantity;
    this.element.setAttribute("draggable", this.quantity > 0);

    if (this.quantity === 0) {
      this.element.classList.add("disabled");
      this.element.setAttribute("draggable", "false");
    } else {
      this.element.classList.remove("disabled");
      this.element.setAttribute("draggable", "true");
    }
  }

  getImagePath() {
    const sanitizedName = this.name.replace(/\s+/g, "-");
    return `Images/${sanitizedName}.jpeg`;
  }
}

function filterCards() {
  const typeFilter = document.getElementById("typeFilter").value;
  const rarityFilter = document.getElementById("rarityFilter").value;

  const filteredCards = cards.filter((card) => {
    if (typeFilter && card.type !== typeFilter) {
      return false;
    }
    if (rarityFilter && card.rarity !== rarityFilter) {
      return false;
    }
    return true;
  });

  displayCards(filteredCards);
}

async function loadCardData(callback) {
  try {
    const response = await fetch("cards.json");
    const data = await response.json();
    const cards = data.map((card) => {
      const sanitizedName = card.name.replace(/\s+/g, "-");
      return new Card(
        sanitizedName,
        card.description,
        card.maxQuantity,
        card.rarity,
        card.type
      );
    });
    callback(cards);

    // Generate filter options for card types
    const cardTypes = [...new Set(cards.map((card) => card.type))];
    const typeFilterContainer = document.getElementById("typeFilter");
    // cardTypes.forEach((type) => {
    //   const option = document.createElement("option");
    //   option.textContent = type;
    //   option.value = type;
    //   typeFilterContainer.appendChild(option);
    // });

    // Generate filter options for card rarities
    // const cardRarities = [...new Set(cards.map((card) => card.rarity))];
    // const rarityFilterContainer = document.getElementById("rarityFilter");
    // cardRarities.forEach((rarity) => {
    //   const option = document.createElement("option");
    //   option.textContent = rarity;
    //   option.value = rarity;
    //   rarityFilterContainer.appendChild(option);
    // });
  } catch (error) {
    console.error("Error loading card data:", error);
  }
}

function generateGradientFromImage(image) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = image.width;
  canvas.height = image.height;
  context.drawImage(image, 0, 0, image.width, image.height);

  // Get the pixel data from the image
  const imageData = context.getImageData(0, 0, image.width, image.height).data;

  // Calculate the average color from the image data
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    sumR += imageData[i];
    sumG += imageData[i + 1];
    sumB += imageData[i + 2];
  }

  const averageR = Math.round(sumR / (image.width * image.height));
  const averageG = Math.round(sumG / (image.width * image.height));
  const averageB = Math.round(sumB / (image.width * image.height));

  // Create a gradient from the average color to a slightly darker shade
  const gradient = `linear-gradient(to bottom, rgb(${averageR},${averageG},${averageB}), rgb(${
    averageR - 20
  },${averageG - 20},${averageB - 20}))`;

  return gradient;
}

function displayCards(cards) {
  const fragment = document.createDocumentFragment();

  cards.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.className = `card ${card.name} ${card.rarity} ${card.type}`;
    cardElement.draggable = true;
    VanillaTilt.init(cardElement, {
      reverse: true, // reverse the tilt direction
      max: 10, // max tilt rotation (degrees)
      glare: true, // if it should have a "glare" effect
    });

    if (card.maxQuantity <= 0) {
      cardElement.classList.add("disabled");
      cardElement.draggable = false;
    }

    const displayName = card.name.replace(/-/g, " ");
    const imagePath = card.getImagePath();

    cardElement.innerHTML = `
      <div class="card-specs">
        <div class="card-rarity ${card.rarity}">${card.rarity}</div>
        <div class="card-type ${card.type}">${card.type}</div>
      </div>
      <img src="${imagePath}" alt="${card.name}">
      <div class="card-content">
        <h3>${displayName}</h3>
        <p>${card.description}</p>
        <div class="quantity">${card.maxQuantity - card.quantity}</div>
      </div>
    `;

    // Generate the gradient from the image and set it as the background
    const cardImage = cardElement.querySelector("img");
    cardImage.onload = () => {
      const gradient = generateGradientFromImage(cardImage);
      cardElement.style.background = gradient;
    };

    cardElement.addEventListener("dragstart", handleCardDragStart);
    cardElement.addEventListener("dragend", handleCardDragEnd);

    card.element = cardElement;
    fragment.appendChild(cardElement);
  });

  // Clear existing cards
  cardContainer.innerHTML = "";

  // Append sorted cards to the card container
  cardContainer.appendChild(fragment);
}

// Sort cards by name in ascending order
function sortByName(cards) {
  cards.sort((a, b) => a.name.localeCompare(b.name));
  displayCards(cards);
}

// Sort cards by rarity in ascending order
function sortByRarity(cards) {
  cards.sort((a, b) => a.rarity.localeCompare(b.rarity));
  displayCards(cards);
}

// Sort cards by type in ascending order
function sortByType(cards) {
  cards.sort((a, b) => a.type.localeCompare(b.type));
  displayCards(cards);
}

function handleCardDragStart(event) {
  const cardElement = event.currentTarget;
  const card = cards.find(
    (c) => c.name === cardElement.getAttribute("class").split(" ")[1]
  );

  event.dataTransfer.setData("text/plain", card.name);
  event.dataTransfer.effectAllowed = "move";
  cardElement.classList.add("dragging");
  cardElement.style.zIndex = "999";
  cardElement.parentElement.style.zIndex = "999";

  if (isMenuOpen) {
    toggleMenu();
  }
}

function handleCardDragEnd(event) {
  const cardElement = event.currentTarget;
  cardElement.classList.remove("dragging");
  cardElement.style.zIndex = "auto";
  cardElement.parentElement.style.zIndex = "auto";
}

function drop(event) {
  event.preventDefault();
  const cardName = event.dataTransfer.getData("text/plain");
  const card = cards.find((c) => c.name === cardName);

  if (!isMenuOpen) {
    const worldRect = world.getBoundingClientRect();
    const offsetX = event.clientX - worldRect.left;
    const offsetY = event.clientY - worldRect.top;

    world.removeEventListener("drop", drop);

    const cardElement = createPlacedCardElement(card, offsetX, offsetY);
    world.appendChild(cardElement);

    card.updateQuantity(1);

    if (card.quantity >= card.maxQuantity) {
      disableCard(card);
    }

    const placedCards = Array.from(document.querySelectorAll(".placed-card"));
    const overlappingCards = findOverlappingCards(cardElement, placedCards);

    placedCards.push(cardElement);

    if (overlappingCards.length > 0) {
      const matchingRecipe = findMatchingRecipe(overlappingCards);

      if (matchingRecipe) {
        const resultCard = cards.find((c) => c.name === matchingRecipe.result);
        resultCard.updateQuantity(1);

        if (resultCard.quantity >= resultCard.maxQuantity) {
          disableCard(resultCard);
        }

        const resultCardElement = createPlacedCardElement(
          resultCard,
          offsetX,
          offsetY
        );
        world.appendChild(resultCardElement);

        console.log("Crafted Result Card:", resultCard);
      }

      console.log(overlappingCards);
    }

    const recipe = recipes.find((r) => r.result === card.name);
    if (recipe) {
      const canCraft = checkCanCraft(recipe.ingredients);

      if (canCraft) {
        craftResultCard(recipe.ingredients, recipe.result, offsetX, offsetY);
      }
    }
  }
}

function createPlacedCardElement(card, offsetX, offsetY) {
  const cardElement = document.createElement("div");
  cardElement.classList.add("placed-card", card.name, card.rarity, card.type);
  cardElement.style.cssText = `left: ${offsetX}px; top: ${offsetY}px;`;
  cardElement.innerHTML = `
    <img src="${card.getImagePath()}" alt="${card.name}">
  `;

  return cardElement;
}

function disableCard(card) {
  card.element.classList.add("disabled");
  card.element.setAttribute("draggable", "false");
}

let AABB = {
  collide: function (el1, el2) {
    var rect1 = el1.getBoundingClientRect();
    var rect2 = el2.getBoundingClientRect();

    return !(
      rect1.top > rect2.bottom ||
      rect1.right < rect2.left ||
      rect1.bottom < rect2.top ||
      rect1.left > rect2.right
    );
  },

  inside: function (el1, el2) {
    var rect1 = el1.getBoundingClientRect();
    var rect2 = el2.getBoundingClientRect();

    return (
      rect1.top <= rect2.bottom &&
      rect1.bottom >= rect2.top &&
      rect1.left <= rect2.right &&
      rect1.right >= rect2.left
    );
  },
};

function findOverlappingCards(cardElement, placedCards) {
  const overlappingCards = [];

  for (const placedCard of placedCards) {
    if (AABB.collide(cardElement, placedCard)) {
      overlappingCards.push(placedCard);
    }
  }

  return overlappingCards;
}

function findMatchingRecipe(overlappingCards) {
  const overlappingCardNames = overlappingCards.map(
    (card) => card.classList[1]
  );

  return recipes.find((recipe) =>
    recipe.ingredients.every((ingredient) =>
      overlappingCardNames.includes(ingredient)
    )
  );
}

function checkCanCraft(ingredients) {
  return ingredients.every((ingredient) => {
    const ingredientCard = cards.find((c) => c.name === ingredient);
    return ingredientCard.quantity > 0;
  });
}

function craftResultCard(ingredients, result, offsetX, offsetY) {
  const overlappingCardNames = ingredients;

  const overlappingCards = Array.from(
    document.getElementsByClassName("placed-card")
  ).filter((placedCard) =>
    overlappingCardNames.includes(placedCard.classList[1])
  );

  overlappingCards.forEach((ingredientCard) => {
    ingredientCard.parentNode.removeChild(ingredientCard);

    const ingredientCardObj = cards.find(
      (c) => c.name === ingredientCard.classList[1]
    );
    ingredientCardObj.updateQuantity(-1);

    if (ingredientCardObj.quantity < ingredientCardObj.maxQuantity) {
      enableCard(ingredientCardObj);
    }
  });

  const resultCard = cards.find((c) => c.name === result);
  resultCard.updateQuantity(1);

  if (resultCard.quantity >= resultCard.maxQuantity) {
    disableCard(resultCard);
  }

  const resultCardElement = createPlacedCardElement(
    resultCard,
    offsetX,
    offsetY
  );
  world.appendChild(resultCardElement);

  console.log("Crafted Result Card:", resultCard);
}

function enableCard(card) {
  card.element.classList.remove("disabled");
  card.element.draggable = true;
}

function disableCard(card) {
  card.element.classList.add("disabled");
  card.element.draggable = false;
}

function allowDrop(event) {
  event.preventDefault();
}

function initializeApp() {
  function cardDataLoaded(cardData) {
    cards = cardData.map(
      (data) =>
        new Card(
          data.name,
          data.description,
          data.maxQuantity,
          data.rarity,
          data.type
        )
    );
    displayCards(cards);

    // Create a Fuse instance for searching cards
    const fuseOptions = {
      keys: ["name", "description", "type", "rarity"],
      threshold: 0.3, // Adjust the threshold as needed
    };
    fuse = new Fuse(cards, fuseOptions);

    world.addEventListener("dragover", allowDrop); // Add the 'dragover' event listener
    world.addEventListener("drop", drop);

    // Add an event listener for the search box
    const searchBox = document.getElementById("searchBox");
    searchBox.addEventListener("input", handleSearch);
  }

  loadCardData(cardDataLoaded);
}

function applyFiltersAndSort() {
  const typeFilter = document.getElementById("typeFilter").value;
  const rarityFilter = document.getElementById("rarityFilter").value;
  const searchBox = document.getElementById("searchBox");
  const searchTerm = searchBox.value.toLowerCase(); // Convert search term to lowercase for case-insensitive search

  let filteredCards = cards;

  // Apply sorting based on the selected sorting method
  const sortMethod = document.querySelector(".sortButton.active").id;
  switch (sortMethod) {
    case "sortByNameBtn":
      filteredCards.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "sortByRarityBtn":
      filteredCards.sort((a, b) => a.rarity.localeCompare(b.rarity));
      break;
    case "sortByTypeBtn":
      filteredCards.sort((a, b) => a.type.localeCompare(b.type));
      break;
  }

  // Apply filters
  if (typeFilter) {
    filteredCards = filteredCards.filter((card) => card.type === typeFilter);
  }

  if (rarityFilter) {
    filteredCards = filteredCards.filter(
      (card) => card.rarity === rarityFilter
    );
  }

  // Apply search only if there's a non-empty search term
  if (searchTerm !== "") {
    const fuseOptions = {
      keys: ["name", "description", "type", "rarity"],
      threshold: 0.3, // Adjust the threshold as needed
    };
    const fuse = new Fuse(filteredCards, fuseOptions);
    const searchResults = fuse.search(searchTerm);
    filteredCards = searchResults.map((result) => result.item);
  }

  displayCards(filteredCards);
}

function handleSearch() {
  const searchBox = document.getElementById("searchBox");
  const searchTerm = searchBox.value.trim().toLowerCase(); // Remove leading/trailing spaces and convert to lowercase

  if (!fuse) {
    // Exit the function if fuse is not initialized
    return;
  }

  if (searchTerm === "") {
    // If the search term is empty, reset the display to show all cards
    displayCards(cards);
  } else {
    const searchResults = fuse.search(searchTerm);

    if (searchResults.length > 0) {
      const filteredCards = searchResults.map((result) => result.item);
      displayCards(filteredCards);
    } else {
      // Handle no results found
      displayCards([]); // Clear the card container
    }
  }

  applyFiltersAndSort(); // Apply filters and sorting if necessary
}

initializeApp();
