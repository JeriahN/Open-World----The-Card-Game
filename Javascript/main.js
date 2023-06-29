// This JavaScript file contains code for a menu and card system. The menu functionality allows the user to toggle the visibility of a menu by clicking on a menu button. The menu can also be opened automatically when the mouse enters the menu button. If the mouse leaves the menu container, and there is no interaction with the menu, it will automatically close after a brief delay. Additionally, when the menu is open and the user clicks outside the menu container, the menu will close.

// The file defines a class called Card, which represents a card object. Each card has various properties such as name, description, max quantity, rarity, and type. The Card class also contains methods for updating the card's quantity, getting the image path for the card, and handling mouse events for the card's tilt effect.

// The file includes functions for loading card data from a JSON file, displaying the cards on the page, and handling drag and drop functionality. The loadCardData function fetches card data from a JSON file and creates Card objects based on the data. The displayCards function generates HTML elements for each card and attaches event listeners for the tilt effect. The drop function handles the dropping of cards onto a designated area (the "world") and updates the card's quantity accordingly. The allowDrop function prevents default drag and drop behavior. The initializeApp function initializes the application by loading card data, displaying the cards, and setting up event listeners for drag and drop functionality.

const menuContainer = document.getElementById("menuContainer");
const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");
const cardContainer = document.getElementById("cardContainer");
const world = document.getElementById("world");
let isMenuOpen = false;
let isMouseOverMenu = false;
let cards;

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

class Card {
  constructor(name, description, maxQuantity, rarity, type) {
    this.name = name;
    this.description = description;
    this.maxQuantity = maxQuantity;
    this.rarity = rarity;
    this.type = type;
    this.quantity = 0;
    this.element = null;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
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

  handleMouseMove(event) {
    const cardRect = this.element.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    const tiltX = (event.clientX - cardCenterX) / 10;
    const tiltY = (event.clientY - cardCenterY) / 10;
    this.element.style.transform = `rotateX(${tiltY}deg) rotateY(${tiltX}deg)`;
  }

  handleMouseLeave() {
    this.element.style.transform = "none";
  }
}

function loadCardData(callback) {
  fetch("cards.json")
    .then((response) => response.json())
    .then((data) => {
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
    })
    .catch((error) => console.error("Error loading card data:", error));
}

function displayCards(cards) {
  cards.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card", card.name, card.rarity, card.type);
    cardElement.setAttribute("draggable", "true");

    if (card.maxQuantity <= 0) {
      cardElement.classList.add("disabled");
      cardElement.setAttribute("draggable", "false");
    }

    const displayName = card.name.replace(/-/g, " "); // Replace dashes with spaces
    cardElement.innerHTML = `
      <div class="card-specs">
        <div class="card-rarity ${card.rarity}">${card.rarity}</div>
        <div class="card-type ${card.type}">${card.type}</div>
      </div>
      <img src="${card.getImagePath()}" alt="${card.name}">
      <div class="card-content">
        <h3>${displayName}</h3> <!-- Display name with spaces -->
        <p>${card.description}</p>
        <div class="quantity">${card.maxQuantity - card.quantity}</div>
      </div>
    `;

    // Add event listeners for tilt effect
    cardElement.addEventListener("mouseenter", (event) => {
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

      // Calculate glare opacity based on tilt values
      const glareOpacity = Math.abs(tiltX) / 30;

      // Add highlights
      const highlightLeft = document.createElement("div");
      highlightLeft.classList.add("highlight-left");
      highlightLeft.style.opacity = glareOpacity;
      const highlightRight = document.createElement("div");
      highlightRight.classList.add("highlight-right");
      highlightRight.style.opacity = glareOpacity;
      cardElement.appendChild(highlightLeft);
      cardElement.appendChild(highlightRight);
    });

    cardElement.addEventListener("mouseleave", () => {
      cardElement.style.transform = "none";
      cardElement.style.boxShadow = "none";
      cardElement.style.transition = "transform 0.5s, box-shadow 0.5s";

      // Remove highlights
      const highlightLeft = cardElement.querySelector(".highlight-left");
      const highlightRight = cardElement.querySelector(".highlight-right");
      highlightLeft.parentNode.removeChild(highlightLeft);
      highlightRight.parentNode.removeChild(highlightRight);
    });

    cardElement.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.name);
      event.dataTransfer.effectAllowed = "move";
      event.currentTarget.classList.add("dragging");
      cardElement.classList.add("dragging");
      cardElement.style.zIndex = "999"; // Apply a higher z-index when dragging
      cardElement.parentElement.style.zIndex = "999"; // Apply a higher z-index to the parent container
      if (isMenuOpen) {
        toggleMenu();
      }
    });

    cardElement.addEventListener("dragend", (event) => {
      event.currentTarget.classList.remove("dragging");
      cardElement.style.zIndex = "auto"; // Reset the z-index when dragging ends
      cardElement.parentElement.style.zIndex = "auto"; // Reset the parent container's z-index
    });

    cardContainer.appendChild(cardElement);
    card.element = cardElement;
  });
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

    const cardElement = document.createElement("div");
    cardElement.classList.add("placed-card", card.name, card.rarity, card.type);
    cardElement.style.left = `${offsetX}px`;
    cardElement.style.top = `${offsetY}px`;
    cardElement.innerHTML = `
      <img src="${card.getImagePath()}" alt="${card.name}">
    `;

    // Reset transformations on the placed card element
    cardElement.style.transform = "none";

    world.appendChild(cardElement);

    card.updateQuantity(1);

    if (card.quantity >= card.maxQuantity) {
      card.element.classList.add("disabled");
      card.element.setAttribute("draggable", "false");
    }

    console.info("Dropped Card: ", card);

    world.addEventListener("drop", drop);

    event.stopPropagation();
  }
}

function allowDrop(event) {
  event.preventDefault();
}

function initializeApp() {
  loadCardData((cardData) => {
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

    world.addEventListener("dragover", allowDrop);
    world.addEventListener("drop", drop);
  });
}

initializeApp();
