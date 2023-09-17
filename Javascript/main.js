const menuContainer = document.getElementById("menuContainer");
const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");
const cardContainer = document.getElementById("cardContainer");
const world = document.getElementById("world");
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

try {
  document.getElementById("sortByNameBtn").addEventListener("click", () => {
    sortByName(cards);
    applyFiltersAndSort(); // Add this line to apply filters and sort after changing the sorting method
  });

  document.getElementById("sortByRarityBtn").addEventListener("click", () => {
    sortByRarity(cards);
    applyFiltersAndSort(); // Add this line to apply filters and sort after changing the sorting method
  });

  document.getElementById("sortByTypeBtn").addEventListener("click", () => {
    sortByType(cards);
    applyFiltersAndSort(); // Add this line to apply filters and sort after changing the sorting method
  });
} catch (error) {
  console.error(
    "Could not get sorting elements or could not apply event listeners.",
    error
  );
}

const toggleMenu = () => {
  isMenuOpen = !isMenuOpen;
  menu.classList.toggle("show", isMenuOpen);
  menuButton.style.transform = isMenuOpen
    ? "translateX(220px)"
    : "translateX(0)";

  menuButton.classList.toggle("closed", isMenuOpen);
};

menuButton.addEventListener("click", toggleMenu);

menuButton.addEventListener("mouseenter", () => {
  if (!isMenuOpen) {
    toggleMenu();
  }
});

menuContainer.addEventListener("mouseleave", () => {
  isMouseOverMenu = false;
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

function handleMouseMove(event) {
  const cardRect = this.element.getBoundingClientRect();
  const cardCenterX = cardRect.left + cardRect.width / 2;
  const cardCenterY = cardRect.top + cardRect.height / 2;
  const tiltX = (event.clientX - cardCenterX) / 10;
  const tiltY = (event.clientY - cardCenterY) / 10;
  this.element.style.transform = `rotateX(${tiltY}deg) rotateY(${tiltX}deg)`;
}

function handleMouseLeave() {
  this.element.style.transform = "none";
}

class Card {
  constructor(name, description, maxQuantity, rarity, type) {
    this.name = name;
    this.description = description;
    this.maxQuantity = maxQuantity;
    this.rarity = rarity;
    this.type = type;
    this.quantity = 0;
    this.element = null;
    this.handleMouseMove = handleMouseMove.bind(this);
    this.handleMouseLeave = handleMouseLeave.bind(this);
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
    cardTypes.forEach((type) => {
      const option = document.createElement("option");
      option.textContent = type;
      option.value = type;
      typeFilterContainer.appendChild(option);
    });

    // Generate filter options for card rarities
    const cardRarities = [...new Set(cards.map((card) => card.rarity))];
    const rarityFilterContainer = document.getElementById("rarityFilter");
    cardRarities.forEach((rarity) => {
      const option = document.createElement("option");
      option.textContent = rarity;
      option.value = rarity;
      rarityFilterContainer.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading card data:", error);
  }
}

function displayCards(cards) {
  const fragment = document.createDocumentFragment();

  cards.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.className = `card ${card.name} ${card.rarity} ${card.type}`;
    cardElement.draggable = true;

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

    // Add event listeners for tilt effect
    cardElement.addEventListener("mouseenter", handleCardMouseEnter);
    cardElement.addEventListener("mouseleave", handleCardMouseLeave);
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

function handleCardMouseEnter(event) {
  const cardElement = event.currentTarget;
  const cardRect = cardElement.getBoundingClientRect();
  const mouseX = event.clientX - cardRect.left;
  const mouseY = event.clientY - cardRect.top;
  const tiltX = (mouseX / cardRect.width - 0.5) * 30;
  const tiltY = (mouseY / cardRect.height - 0.5) * 30;
  const depth = 10;
  cardElement.style.transform = `perspective(1000px) rotateX(${-tiltY}deg) rotateY(${tiltX}deg) translateZ(${depth}px)`;
  cardElement.style.boxShadow = `${-tiltX / 2}px ${
    -tiltY / 2
  }px ${depth}px rgba(0, 0, 0, 0.2)`;
  cardElement.style.transition = "transform 0.5s, box-shadow 0.5s";

  const glareOpacity = Math.abs(tiltX) / 30;

  const highlightLeft = document.createElement("div");
  highlightLeft.classList.add("highlight-left");
  highlightLeft.style.opacity = glareOpacity;
  const highlightRight = document.createElement("div");
  highlightRight.classList.add("highlight-right");
  highlightRight.style.opacity = glareOpacity;
  cardElement.appendChild(highlightLeft);
  cardElement.appendChild(highlightRight);
}

function handleCardMouseLeave(event) {
  const cardElement = event.currentTarget;
  cardElement.style.transform = "none";
  cardElement.style.boxShadow = "none";
  cardElement.style.transition = "transform 0.5s, box-shadow 0.5s";

  const highlightLeft = cardElement.querySelector(".highlight-left");
  const highlightRight = cardElement.querySelector(".highlight-right");
  highlightLeft.parentNode.removeChild(highlightLeft);
  highlightRight.parentNode.removeChild(highlightRight);
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

  // Reset transformations on the placed card element
  cardElement.style.transform = "none";

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
