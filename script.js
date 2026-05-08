// App State Variables
let pokemonDatabase = [];
const POOL_LIMIT = 200; // Generate first 200 Pokemon
let currentActiveSlot = 'A'; // 'A' or 'B'
let parentA_Data = null;
let parentB_Data = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchPokemonDatabase();
    setupSearch();
});

// Fetch 200 Pokemon from Official API
async function fetchPokemonDatabase() {
    const gridContainer = document.getElementById('pokemon-grid');
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${POOL_LIMIT}`);
        const data = await response.json();
        
        // Map data to include image URLs (using official artwork for better quality)
        pokemonDatabase = data.results.map((poke, index) => {
            const id = index + 1;
            return {
                id: id,
                name: poke.name,
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
            };
        });

        renderGrid(pokemonDatabase);
    } catch (error) {
        gridContainer.innerHTML = '<div class="loading-text" style="color:red;">Error loading database. Check internet connection.</div>';
    }
}

// Render the 200 Pokemon Grid
function renderGrid(pokemonList) {
    const gridContainer = document.getElementById('pokemon-grid');
    gridContainer.innerHTML = ''; // Clear loading text

    pokemonList.forEach(poke => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        div.innerHTML = `
            <span class="grid-id">#${poke.id.toString().padStart(3, '0')}</span>
            <img src="${poke.image}" alt="${poke.name}" class="grid-img" loading="lazy">
            <span class="grid-name">${poke.name}</span>
        `;
        // On click, assign this pokemon to the active slot
        div.onclick = () => assignPokemonToSlot(poke);
        gridContainer.appendChild(div);
    });
}

// Set Active Slot for Selection (Clicking the top cards)
window.setActiveSlot = function(slotType) {
    currentActiveSlot = slotType;
    document.getElementById('slotA').classList.remove('active-slot');
    document.getElementById('slotB').classList.remove('active-slot');
    
    if(slotType === 'A') {
        document.getElementById('slotA').classList.add('active-slot');
    } else {
        document.getElementById('slotB').classList.add('active-slot');
    }
};

// Assign selected Pokemon from grid to the active top card
function assignPokemonToSlot(pokemon) {
    if (currentActiveSlot === 'A') {
        parentA_Data = pokemon;
        updateSlotDisplay('A', pokemon);
        // Automatically switch to slot B for convenience
        if (!parentB_Data) setActiveSlot('B');
    } else {
        parentB_Data = pokemon;
        updateSlotDisplay('B', pokemon);
    }

    calculateChild();
}

// Update UI of the top cards
function updateSlotDisplay(slot, pokemon) {
    const content = document.getElementById(`content${slot}`);
    content.innerHTML = `
        <img src="${pokemon.image}" class="selected-img" alt="${pokemon.name}">
        <span class="selected-name">${pokemon.name}</span>
    `;
}

// Breeding Logic (Deterministic calculation based on IDs)
function calculateChild() {
    const childSlot = document.getElementById('slotChild');
    const childContent = document.getElementById('contentChild');

    if (parentA_Data && parentB_Data) {
        // Simple deterministic math logic for demo
        // (ID of A + ID of B) / 2 = Child ID (Wrap around if it exceeds 200)
        let childId = Math.floor((parentA_Data.id + parentB_Data.id) / 2);
        if(childId < 1) childId = 1;
        
        // Find the child in database based on ID
        const childPokemon = pokemonDatabase.find(p => p.id === childId);

        if(childPokemon) {
            childSlot.classList.add('has-result');
            childContent.innerHTML = `
                <img src="${childPokemon.image}" class="selected-img" style="filter: drop-shadow(0 0 10px var(--accent-orange));" alt="${childPokemon.name}">
                <span class="selected-name" style="color: var(--accent-orange);">${childPokemon.name}</span>
            `;
        }
    }
}

// Reset Everything
window.resetBreeding = function() {
    parentA_Data = null;
    parentB_Data = null;
    
    document.getElementById('contentA').innerHTML = '<span class="placeholder-icon">?</span>';
    document.getElementById('contentB').innerHTML = '<span class="placeholder-icon">?</span>';
    
    const childSlot = document.getElementById('slotChild');
    childSlot.classList.remove('has-result');
    document.getElementById('contentChild').innerHTML = '<span class="placeholder-icon">?</span>';
    
    setActiveSlot('A');
};

// Search Filter functionality
function setupSearch() {
    const searchBar = document.getElementById('globalSearch');
    searchBar.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = pokemonDatabase.filter(p => p.name.toLowerCase().includes(term));
        renderGrid(filtered);
    });
}

// Navbar Section Switching Logic
window.showSection = function(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active-section'));
    // Show target section
    document.getElementById(`${sectionId}-section`).classList.add('active-section');
    
    // Update active nav link
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active-nav'));
    // Fixed: accessibility to event object
    if (window.event) {
        window.event.target.classList.add('active-nav');
    }
};
