// App State Variables
let pokemonDatabase = [];
const POOL_LIMIT = 500; // Generate first 500 Pokemon
let currentActiveSlot = 'A'; // 'A' or 'B'
let parentA_Data = null;
let parentB_Data = null;

// Filter State for Directory
let directoryFilters = {
    search: '',
    rarity: 'all',
    sort: 'name',
    order: 'asc',
    element: null,
    work: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchPokemonDatabase();
    setupSearch();
    setupDirectoryFilters();
});

// Type Symbols & Work Symbols
const typeSymbols = {
    fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', ice: '❄️',
    fighting: '👊', poison: '☣️', ground: '⛰️', flying: '🕊️',
    psychic: '👁️', bug: '🐛', rock: '💎', ghost: '👻',
    dragon: '🐲', dark: '🌙', steel: '⚙️', fairy: '✨', normal: '⚪'
};

const workIcons = {
    kindling: '🔥', watering: '💧', planting: '🌿', generating: '⚡',
    handiwork: '✋', gathering: '🧺', logging: '🪵', mining: '⛏️',
    producing: '📦', transporting: '🚚', farming: '🌾', cooling: '❄️'
};

// Fetch 200 Pokemon from Official API
async function fetchPokemonDatabase() {
    const gridContainer = document.getElementById('pokemon-grid');
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${POOL_LIMIT}`);
        const data = await response.json();
        
        // Fetch detailed data for each pokemon to get types and stats
        const detailedPromises = data.results.map(p => fetch(p.url).then(res => res.json()));
        const detailedData = await Promise.all(detailedPromises);

        pokemonDatabase = detailedData.map(data => {
            const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
            const bst = data.stats.reduce((acc, s) => acc + s.base_stat, 0);
            let rarity = rarities[0];
            if (bst > 600) rarity = rarities[3];
            else if (bst > 500) rarity = rarities[2];
            else if (bst > 400) rarity = rarities[1];

            // Mock some work suitability levels
            const works = Object.keys(workIcons);
            const suitability = {};
            const numWorks = Math.floor(Math.random() * 3) + 1;
            for(let i=0; i<numWorks; i++) {
                const w = works[Math.floor(Math.random() * works.length)];
                suitability[w] = Math.floor(Math.random() * 4) + 1;
            }

            return {
                id: data.id,
                name: data.name,
                image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
                type: data.types.map(t => t.type.name),
                rarity: rarity,
                bst: bst,
                workSuitability: suitability
            };
        });

        renderGrid(pokemonDatabase);
        renderDirectory(); // Also render the directory
        initializeFilterIcons();
    } catch (error) {
        console.error(error);
        if (gridContainer) gridContainer.innerHTML = '<div class="loading-text" style="color:red;">Error loading database. Check internet connection.</div>';
    }
}

function createPokeCard(poke, isSelectionCard = false) {
    const div = document.createElement('div');
    div.className = `poke-card ${poke.rarity.toLowerCase()}`;
    
    const typeIcons = poke.type.map(t => `<div class="mini-type-icon ${t}">${typeSymbols[t] || '●'}</div>`).join('');
    
    // Work suitability icons for the right side
    const workItems = Object.entries(poke.workSuitability).map(([name, level]) => `
        <div class="work-mini-item" title="${name}">
            <span>${workIcons[name]}</span>
            <span>${level}</span>
        </div>
    `).join('');

    div.innerHTML = `
        <div class="card-header">
            <div class="type-icons-left">${typeIcons}</div>
            <div class="work-icons-right">${workItems}</div>
        </div>
        <img src="${poke.image}" alt="${poke.name}" class="card-img" loading="lazy">
        <div class="poke-info">
           <span class="poke-name">${poke.name}</span>
           <span class="poke-number">#${poke.id.toString().padStart(3, '0')}</span>
        </div>
        <div class="card-footer">
            <div class="rarity-badge ${poke.rarity.toLowerCase()}">
                <span class="rarity-value">${Math.floor(poke.bst / 30)}</span>
                <span class="rarity-text">${poke.rarity}</span>
            </div>
        </div>
    `;
    
    if (isSelectionCard) {
        div.onclick = () => assignPokemonToSlot(poke);
    }
    
    return div;
}

// Render the Breeding Selection Grid
function renderGrid(pokemonList) {
    const gridContainer = document.getElementById('pokemon-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = ''; 

    pokemonList.forEach(poke => {
        gridContainer.appendChild(createPokeCard(poke, true));
    });
}

// Render the Directory Grid
function renderDirectory() {
    const directoryGrid = document.getElementById('directory-grid');
    if (!directoryGrid) return;
    
    let filtered = pokemonDatabase.filter(poke => {
        const matchesSearch = poke.name.toLowerCase().includes(directoryFilters.search.toLowerCase());
        const matchesRarity = directoryFilters.rarity === 'all' || poke.rarity === directoryFilters.rarity;
        const matchesElement = !directoryFilters.element || poke.type.includes(directoryFilters.element);
        const matchesWork = !directoryFilters.work || poke.workSuitability[directoryFilters.work];
        return matchesSearch && matchesRarity && matchesElement && matchesWork;
    });

    // Sorting
    filtered.sort((a, b) => {
        let valA = a[directoryFilters.sort];
        let valB = b[directoryFilters.sort];
        
        if (typeof valA === 'string') {
            return directoryFilters.order === 'asc' 
                ? valA.localeCompare(valB) 
                : valB.localeCompare(valA);
        }
        
        return directoryFilters.order === 'asc' ? valA - valB : valB - valA;
    });

    directoryGrid.innerHTML = '';
    filtered.forEach(poke => {
        directoryGrid.appendChild(createPokeCard(poke, false));
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
    
    document.getElementById('contentA').innerHTML = '<span class="placeholder-text">Select</span>';
    document.getElementById('contentB').innerHTML = '<span class="placeholder-text">Select</span>';
    
    const childSlot = document.getElementById('slotChild');
    childSlot.classList.remove('has-result');
    document.getElementById('contentChild').innerHTML = '<span class="placeholder-icon">?</span>';
    
    setActiveSlot('A');
};



// Search Filter functionality
function setupSearch() {
    const searchBar = document.getElementById('globalSearch');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = pokemonDatabase.filter(p => p.name.toLowerCase().includes(term));
            renderGrid(filtered);
        });
    }
}

// Setup Directory Filters
function setupDirectoryFilters() {
    const search = document.getElementById('directorySearch');
    const rarity = document.getElementById('rarityFilter');
    const sort = document.getElementById('sortField');
    const order = document.getElementById('sortOrder');

    if (search) search.addEventListener('input', (e) => {
        directoryFilters.search = e.target.value;
        renderDirectory();
    });

    if (rarity) rarity.addEventListener('change', (e) => {
        directoryFilters.rarity = e.target.value;
        renderDirectory();
    });

    if (sort) sort.addEventListener('change', (e) => {
        directoryFilters.sort = e.target.value;
        renderDirectory();
    });

    if (order) order.addEventListener('change', (e) => {
        directoryFilters.order = e.target.value;
        renderDirectory();
    });
}

function initializeFilterIcons() {
    const elementContainer = document.getElementById('elementFilterIcons');
    const workContainer = document.getElementById('workFilterIcons');

    if (elementContainer) {
        Object.keys(typeSymbols).forEach(type => {
            const btn = document.createElement('div');
            btn.className = 'filter-icon';
            btn.innerHTML = typeSymbols[type];
            btn.title = type;
            btn.onclick = () => {
                const isActive = btn.classList.contains('active');
                document.querySelectorAll('#elementFilterIcons .filter-icon').forEach(i => i.classList.remove('active'));
                if (!isActive) {
                    btn.classList.add('active');
                    directoryFilters.element = type;
                } else {
                    directoryFilters.element = null;
                }
                renderDirectory();
            };
            elementContainer.appendChild(btn);
        });
    }

    if (workContainer) {
        Object.keys(workIcons).forEach(work => {
            const btn = document.createElement('div');
            btn.className = 'filter-icon';
            btn.innerHTML = workIcons[work];
            btn.title = work;
            btn.onclick = () => {
                const isActive = btn.classList.contains('active');
                document.querySelectorAll('#workFilterIcons .filter-icon').forEach(i => i.classList.remove('active'));
                if (!isActive) {
                    btn.classList.add('active');
                    directoryFilters.work = work;
                } else {
                    directoryFilters.work = null;
                }
                renderDirectory();
            };
            workContainer.appendChild(btn);
        });
    }
}

// Navbar Section Switching Logic
window.showSection = function(sectionId) {
    const event = window.event;
    if (event) event.preventDefault();

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active-section'));
    
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active-nav'));
    
    // If we have an event, try to find the target link
    if (event) {
        // The click might be on a child element, find the closest <a>
        const link = event.target.closest('a');
        if (link) {
            link.classList.add('active-nav');
        }
    }
};
