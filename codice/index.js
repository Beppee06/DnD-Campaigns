// Variabile globale per memorizzare l'intero database JSON
let db = {
    campaigns: [],
    settings: {
        lastOpenedCampaignId: null
    }
};

// Riferimenti agli elementi HTML
const jsonFileInput = document.getElementById('jsonFileInput');
const saveFileButton = document.getElementById('saveFileButton');
const appContent = document.getElementById('appContent');
const campaignSelect = document.getElementById('campaignSelect');
const addCampaignButton = document.getElementById('addCampaignButton');
const newCampaignForm = document.getElementById('newCampaignForm');
const newCampaignNameInput = document.getElementById('newCampaignName');
const confirmAddCampaignButton = document.getElementById('confirmAddCampaignButton');
const currentCampaignNameSpan = document.getElementById('currentCampaignName');
const addCharacterButton = document.getElementById('addCharacterButton');
const characterForm = document.getElementById('characterForm');
const characterIdInput = document.getElementById('characterId');
const charNameInput = document.getElementById('charName');
const charRaceInput = document.getElementById('charRace');
const charClassInput = document.getElementById('charClass');
const charNotesInput = document.getElementById('charNotes'); // Usiamo "Notes"
const saveCharacterButton = document.getElementById('saveCharacterButton');
const cancelCharacterButton = document.getElementById('cancelCharacterButton');
const charactersDisplay = document.getElementById('charactersDisplay');

// --- Event Listeners ---

// 1. Caricamento del file JSON
jsonFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                db = JSON.parse(e.target.result); // Parsifica il JSON nel nostro oggetto db
                if (!db.campaigns) db.campaigns = []; // Assicurati che campaigns esista
                if (!db.settings) db.settings = { lastOpenedCampaignId: null };

                populateCampaignSelect();
                // Tenta di selezionare l'ultima campagna aperta
                if (db.settings.lastOpenedCampaignId) {
                    campaignSelect.value = db.settings.lastOpenedCampaignId;
                }
                campaignSelect.dispatchEvent(new Event('change')); // Attiva l'evento change per caricare i personaggi

                appContent.style.display = 'block'; // Mostra l'interfaccia dell'app
                saveFileButton.style.display = 'block'; // Mostra il pulsante di salvataggio
            } catch (error) {
                alert("Errore nel caricamento del file JSON: " + error.message);
                console.error(error);
            }
        };
        reader.readAsText(file); // Legge il file come testo
    }
});

// 2. Salvataggio del file JSON
saveFileButton.addEventListener('click', () => {
    if (!db) {
        alert("Nessun database caricato da salvare.");
        return;
    }

    // Aggiorna l'ID dell'ultima campagna aperta prima di salvare
    db.settings.lastOpenedCampaignId = campaignSelect.value;

    const jsonData = JSON.stringify(db, null, 2); // Converte l'oggetto JS in JSON formattato
    const blob = new Blob([jsonData], { type: 'application/json' });
    const fileName = "dnd_database_aggiornato.json"; // Nome suggerito per il download

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Libera la risorsa
    alert("File scaricato! Ricorda di sostituirlo manualmente al file originale.");
});

// 3. Selezione Campagna
campaignSelect.addEventListener('change', (event) => {
    const selectedCampaignId = event.target.value;
    const selectedCampaign = db.campaigns.find(c => c.id === selectedCampaignId);
    if (selectedCampaign) {
        currentCampaignNameSpan.textContent = selectedCampaign.name;
        renderCharacters(selectedCampaign.id);
    } else {
        currentCampaignNameSpan.textContent = "Nessuna Campagna Selezionata";
        charactersDisplay.innerHTML = '';
    }
});

// 4. Aggiungi Campagna
addCampaignButton.addEventListener('click', () => {
    newCampaignForm.style.display = 'block';
});

confirmAddCampaignButton.addEventListener('click', () => {
    const newName = newCampaignNameInput.value.trim();
    if (newName && !db.campaigns.some(c => c.name === newName)) {
        const newCampaignId = generateUniqueId();
        db.campaigns.push({
            id: newCampaignId,
            name: newName,
            description: "", // Puoi aggiungere un campo descrizione alla campagna
            characters: [] // Nuova campagna con zero personaggi
        });
        populateCampaignSelect();
        campaignSelect.value = newCampaignId; // Seleziona la nuova campagna
        campaignSelect.dispatchEvent(new Event('change')); // Triggera il refresh
        newCampaignNameInput.value = '';
        newCampaignForm.style.display = 'none';
    } else {
        alert("Inserisci un nome valido o un nome non esistente per la campagna.");
    }
});

// 5. Aggiungi Personaggio (mostra form)
addCharacterButton.addEventListener('click', () => {
    if (!campaignSelect.value) {
        alert("Seleziona prima una campagna.");
        return;
    }
    showCharacterForm();
    characterIdInput.value = ''; // Pulisci ID per nuovo personaggio
    charNameInput.value = '';
    charRaceInput.value = '';
    charClassInput.value = '';
    charNotesInput.value = '';
});

// 6. Salva Personaggio (aggiungi/modifica)
saveCharacterButton.addEventListener('click', () => {
    const campaignId = campaignSelect.value;
    const currentCampaignObj = db.campaigns.find(c => c.id === campaignId);
    if (!currentCampaignObj) {
        alert("Errore: Campagna non trovata.");
        return;
    }

    const id = characterIdInput.value;
    const name = charNameInput.value.trim();
    const race = charRaceInput.value.trim();
    const charClass = charClassInput.value.trim();
    const notes = charNotesInput.value.trim();

    if (!name) {
        alert("Il nome del personaggio è obbligatorio.");
        return;
    }

    if (id) {
        // Modifica personaggio esistente
        const index = currentCampaignObj.characters.findIndex(c => c.id === id);
        if (index !== -1) {
            currentCampaignObj.characters[index].name = name;
            currentCampaignObj.characters[index].race = race;
            currentCampaignObj.characters[index].class = charClass;
            currentCampaignObj.characters[index].notes = notes;
        }
    } else {
        // Nuovo personaggio
        currentCampaignObj.characters.push({
            id: generateUniqueId(),
            name: name,
            race: race,
            class: charClass,
            notes: notes
        });
    }
    hideCharacterForm();
    renderCharacters(campaignId);
});

// 7. Annulla Aggiunta/Modifica Personaggio
cancelCharacterButton.addEventListener('click', hideCharacterForm);


// --- Funzioni di Supporto ---

// Genera un ID unico
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Popola il selettore delle campagne
function populateCampaignSelect() {
    campaignSelect.innerHTML = ''; // Pulisci le opzioni esistenti
    if (db.campaigns.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nessuna Campagna Disponibile";
        campaignSelect.appendChild(option);
        return;
    }

    db.campaigns.forEach(campaign => {
        const option = document.createElement('option');
        option.value = campaign.id;
        option.textContent = campaign.name;
        campaignSelect.appendChild(option);
    });
}

// Renderizza i personaggi della campagna selezionata
function renderCharacters(campaignId) {
    charactersDisplay.innerHTML = '';
    const campaign = db.campaigns.find(c => c.id === campaignId);

    if (!campaign || campaign.characters.length === 0) {
        charactersDisplay.innerHTML = '<p>Nessun personaggio in questa campagna.</p>';
        return;
    }

    campaign.characters.forEach(char => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${char.name}</strong> (${char.race} ${char.class})
            <p>${char.notes}</p>
            <button data-id="${char.id}" class="edit-char">Modifica</button>
            <button data-id="${char.id}" class="delete-char">Elimina</button>
        `;
        charactersDisplay.appendChild(li);
    });

    // Aggiungi event listener per i pulsanti modifica ed elimina
    document.querySelectorAll('.edit-char').forEach(button => {
        button.addEventListener('click', (e) => {
            const charId = e.target.dataset.id;
            editCharacter(charId, campaignId);
        });
    });

    document.querySelectorAll('.delete-char').forEach(button => {
        button.addEventListener('click', (e) => {
            const charId = e.target.dataset.id;
            deleteCharacter(charId, campaignId);
        });
    });
}

// Mostra il form per aggiungere/modificare un personaggio
function showCharacterForm() {
    characterForm.style.display = 'block';
    addCharacterButton.style.display = 'none';
}

// Nasconde il form
function hideCharacterForm() {
    characterForm.style.display = 'none';
    addCharacterButton.style.display = 'block';
}

// Funzione per popolare il form di modifica
function editCharacter(charId, campaignId) {
    const campaign = db.campaigns.find(c => c.id === campaignId);
    const char = campaign.characters.find(c => c.id === charId);
    if (char) {
        showCharacterForm();
        characterIdInput.value = char.id;
        charNameInput.value = char.name;
        charRaceInput.value = char.race;
        charClassInput.value = char.class;
        charNotesInput.value = char.notes;
    }
}

// Funzione per eliminare un personaggio
function deleteCharacter(charId, campaignId) {
    if (confirm("Sei sicuro di voler eliminare questo personaggio?")) {
        const campaign = db.campaigns.find(c => c.id === campaignId);
        campaign.characters = campaign.characters.filter(c => c.id !== charId);
        renderCharacters(campaignId);
    }
}

// Inizializzazione quando la pagina è pronta
document.addEventListener('DOMContentLoaded', () => {
    // Potresti voler mostrare un messaggio iniziale o lo stato del caricamento
    console.log("App D&D Tracker caricata. Carica il file JSON.");
});