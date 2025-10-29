// Riferimenti agli elementi HTML (vecchi e nuovi)
const campaignsDiv = document.getElementById('campaignsDiv');
const newCampaignDiv = document.getElementById('newCampaignDiv');
const addNewCampaignButton = document.getElementById('addNewCampaignButton');
const saveNewCampaignButton = document.getElementById('saveNewCampaignButton');
const newCampaignName = document.getElementById('newCampaignName');
const cancelButtonNewCampaign = document.getElementById('cancelButtonNewCampaign');
const campaignList = document.getElementById('campaignList');

// Elementi per l'autenticazione
const authDiv = document.getElementById('authDiv');
const authStatus = document.getElementById('authStatus');
const authInputs = document.getElementById('authInputs'); // Il div che contiene input e bottoni login/signup
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const logoutButton = document.getElementById('logoutButton');

let currentUser = null; // Per tenere traccia dell'utente loggato
let dbData = { "campaigns": [] }; // I dati verranno caricati da Firebase

// --- Costanti per IndexedDB (NON USEREMO PIÙ, MA LE LASCIAMO COMMENTATE PER CONFRONTO) ---
// const DB_NAME = 'DndCampaignTrackerDB';
// const DB_VERSION = 1;
// const STORE_NAME = 'campaigns';

// --- Gestione Autenticazione Firebase ---

// onAuthStateChanged viene fornito da window.firebaseFunctions
window.firebaseFunctions.onAuthStateChanged(window.auth, (user) => {
    if (user) {
        currentUser = user;
        authStatus.textContent = `Loggato come: ${user.email}`;
        authInputs.style.display = 'none'; // Nasconde input e bottoni login/signup
        logoutButton.style.display = 'inline-block';
        campaignsDiv.style.display = 'block'; // Mostra l'UI delle campagne
        loadTheCampaignsUI(); // Carica le campagne dell'utente loggato
    } else {
        currentUser = null;
        authStatus.textContent = 'Non loggato';
        authInputs.style.display = 'block'; // Mostra input e bottoni login/signup
        logoutButton.style.display = 'none';
        campaignsDiv.style.display = 'none'; // Nascondi l'UI delle campagne
        campaignList.innerHTML = '<p>Effettua il login per vedere le tue campagne.</p>';
        dbData.campaigns = []; // Pulisci i dati locali se l'utente si è sloggato
    }
});

loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        // signInWithEmailAndPassword viene fornito da window.firebaseFunctions
        await window.firebaseFunctions.signInWithEmailAndPassword(window.auth, email, password);
        console.log('Login avvenuto con successo!');
    } catch (error) {
        console.error('Errore login:', error.message);
        alert('Errore login: ' + error.message);
    }
});

signupButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        // createUserWithEmailAndPassword viene fornito da window.firebaseFunctions
        await window.firebaseFunctions.createUserWithEmailAndPassword(window.auth, email, password);
        console.log('Registrazione avvenuta con successo!');
    } catch (error) {
        console.error('Errore registrazione:', error.message);
        alert('Errore registrazione: ' + error.message);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        // signOut viene fornito da window.firebaseFunctions
        await window.firebaseFunctions.signOut(window.auth);
        console.log('Logout avvenuto con successo!');
    } catch (error) {
        console.error('Errore logout:', error.message);
        alert('Errore logout: ' + error.message);
    }
});


// --- Funzioni per Firebase Realtime Database ---

// Sostituisce la vecchia openDb (non più necessaria per Firebase)
// e loadCampaignsFromDb (ora usa Firebase)
async function loadCampaignsFromDbFirebase() {
    if (!currentUser) {
        console.log("Nessun utente loggato, impossibile caricare campagne.");
        campaignList.innerHTML = '<p>Effettua il login per vedere le tue campagne.</p>';
        return;
    }

    // Path per le campagne dell'utente loggato: users/UID_UTENTE/campaigns
    const userCampaignsRef = window.firebaseFunctions.ref(window.database, `users/${currentUser.uid}/campaigns`);

    // Utilizziamo onValue per ottenere aggiornamenti in tempo reale
    // Questa funzione verrà chiamata ogni volta che i dati cambiano in Firebase
    window.firebaseFunctions.onValue(userCampaignsRef, (snapshot) => {
        const campaignsData = snapshot.val(); // Ottieni i dati come oggetto
        dbData.campaigns = []; // Pulisci i dati locali

        if (campaignsData) {
            // Firebase RTDB restituisce un oggetto. Lo convertiamo in array,
            // assegnando l'ID di Firebase come 'id' della campagna.
            Object.keys(campaignsData).forEach(key => {
                dbData.campaigns.push({ id: key, ...campaignsData[key] });
            });
        }
        console.log('Campagne caricate da Firebase RTDB:', dbData.campaigns);
        renderCampaignList(); // Aggiorna la UI con i nuovi dati
    }, (error) => {
        console.error("Errore nel caricamento delle campagne da Firebase RTDB:", error);
        campaignList.innerHTML = '<p>Errore nel caricamento delle campagne.</p>';
    });
}

// Sostituisce la vecchia saveCampaignsToDb (ora usa Firebase)
async function saveCampaignToDbFirebase(campaign) {
    if (!currentUser) {
        alert("Devi essere loggato per salvare le campagne!");
        return;
    }

    const userCampaignsRef = window.firebaseFunctions.ref(window.database, `users/${currentUser.uid}/campaigns`);

    if (campaign.id) {
        // Se la campagna ha già un ID, aggiornala
        const campaignRef = window.firebaseFunctions.ref(window.database, `users/${currentUser.uid}/campaigns/${campaign.id}`);
        await window.firebaseFunctions.set(campaignRef, { name: campaign.name });
        console.log('Campagna aggiornata su Firebase RTDB:', campaign);
    } else {
        // Se non ha un ID, è una nuova campagna, pushala e Firebase genererà un ID
        const newCampaignRef = window.firebaseFunctions.push(userCampaignsRef);
        await window.firebaseFunctions.set(newCampaignRef, { name: campaign.name });
        console.log('Nuova campagna aggiunta su Firebase RTDB:', { id: newCampaignRef.key, name: campaign.name });
    }
}

// Funzione per eliminare una campagna da Firebase
async function deleteCampaignFromDbFirebase(campaignId) {
    if (!currentUser) {
        alert("Devi essere loggato per eliminare le campagne!");
        return;
    }
    const campaignRef = window.firebaseFunctions.ref(window.database, `users/${currentUser.uid}/campaigns/${campaignId}`);
    await window.firebaseFunctions.remove(campaignRef);
    console.log('Campagna eliminata da Firebase RTDB:', campaignId);
    // onValue si occuperà di ri-renderizzare la lista
}


// --- Funzioni di gestione UI (modificate per Firebase) ---

function renderCampaignList() {
    if (campaignList) {
        campaignList.innerHTML = ''; // Pulisci la lista esistente

        if (dbData.campaigns.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'Nessuna campagna aggiunta. Clicca "Add new campaign" per iniziare!';
            campaignList.appendChild(message);
        } else {
            dbData.campaigns.forEach(campaign => {
                const campaignElement = document.createElement('div');
                campaignElement.classList.add('campaign-item');
                campaignElement.innerHTML = `
                    <span>${campaign.name}</span>
                    <button class="edit-campaign" data-id="${campaign.id}">Modifica</button>
                    <button class="delete-campaign" data-id="${campaign.id}">Elimina</button>
                `;
                campaignList.appendChild(campaignElement);
            });
            // Aggiungi listener per i nuovi bottoni "Modifica" ed "Elimina"
            document.querySelectorAll('.edit-campaign').forEach(button => {
                button.addEventListener('click', (event) => {
                    const campaignId = event.target.dataset.id;
                    const campaign = dbData.campaigns.find(c => c.id === campaignId);
                    if (campaign) {
                        const newName = prompt('Inserisci il nuovo nome per la campagna:', campaign.name);
                        if (newName && newName.trim() !== '' && newName !== campaign.name) {
                            campaign.name = newName.trim();
                            saveCampaignToDbFirebase(campaign); // Salva la modifica su Firebase
                        }
                    }
                });
            });
            document.querySelectorAll('.delete-campaign').forEach(button => {
                button.addEventListener('click', (event) => {
                    const campaignId = event.target.dataset.id;
                    if (confirm('Sei sicuro di voler eliminare questa campagna?')) {
                        deleteCampaignFromDbFirebase(campaignId); // Elimina da Firebase
                    }
                });
            });
        }
    } else {
        console.warn("Elemento con id 'campaignList' non trovato. Impossibile visualizzare le campagne.");
    }
}

// --- Funzione Principale di Caricamento UI (punto di ingresso per i dati) ---
// Questa funzione ora si limita a chiamare la funzione di caricamento da Firebase.
async function loadTheCampaignsUI() {
    await loadCampaignsFromDbFirebase();
}


// --- Event Listeners Esistenti (adattati per Firebase) ---

addNewCampaignButton.addEventListener('click', () => {
    newCampaignDiv.style.display = 'block';
    newCampaignName.value = '';
    newCampaignName.focus();
});

cancelButtonNewCampaign.addEventListener('click', () => {
    newCampaignDiv.style.display = 'none';
})

saveNewCampaignButton.addEventListener('click', async () => {
    const newName = newCampaignName.value.trim();
    if (newName) {
        const newCampaign = { name: newName }; // L'ID sarà generato da Firebase
        await saveCampaignToDbFirebase(newCampaign); // Salva i dati su Firebase
        newCampaignName.value = '';
        newCampaignDiv.style.display = 'none';
        // Non serve chiamare loadTheCampaignsUI qui, onValue lo farà per noi.
    } else {
        alert('Il nome della campagna non può essere vuoto.');
    }
});

// --- Inizializzazione ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("App D&D Tracker caricata.");
    newCampaignDiv.style.display = 'none';
    // campaignsDiv.style.display viene gestito da onAuthStateChanged
    // loadTheCampaignsUI() viene gestito da onAuthStateChanged
});

// --- Funzioni per Export/Import (da adattare per Firebase se necessario) ---
// Attualmente, queste funzioni si basano su dbData.campaigns, che ora è popolato da Firebase.
// L'esportazione funzionerà con i dati correnti.
// L'importazione andrà a popolare dbData.campaigns e poi potresti volerli salvare su Firebase.
// Questo è un punto da considerare per un'implementazione più completa con Firebase.

const exportDbButton = document.getElementById('exportDbButton');
const importDbButton = document.getElementById('importDbButton');
const importFileInput = document.getElementById('importFileInput');

exportDbButton.addEventListener('click', () => {
    if (dbData.campaigns.length === 0) {
        alert('Non ci sono campagne da esportare.');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData.campaigns, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dnd_campaigns.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

importDbButton.addEventListener('click', () => {
    importFileInput.click(); // Triggera il click sull'input file nascosto
});

importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedCampaigns = JSON.parse(e.target.result);
            if (!Array.isArray(importedCampaigns)) {
                alert('Il file non contiene un formato valido di campagne.');
                return;
            }

            // Chiedi all'utente se vuole sovrascrivere o aggiungere
            const confirmImport = confirm('Vuoi sovrascrivere le campagne esistenti su Firebase con quelle importate, o aggiungerle? (OK per sovrascrivere, Annulla per aggiungere)');

            if (confirmImport) {
                // Sovrascrivi: prima eliminiamo tutte le campagne esistenti su Firebase per l'utente
                if (currentUser) {
                    const userCampaignsRef = window.firebaseFunctions.ref(window.database, `users/${currentUser.uid}/campaigns`);
                    await window.firebaseFunctions.remove(userCampaignsRef);
                }
                // Poi aggiungiamo quelle importate
                for (const campaign of importedCampaigns) {
                    // Rimuoviamo l'ID se presente, Firebase ne genererà uno nuovo
                    const { id, ...campaignData } = campaign;
                    await saveCampaignToDbFirebase(campaignData);
                }
                alert('Campagne importate e sovrascritte con successo su Firebase!');
            } else {
                // Aggiungi: semplicemente aggiungiamo le nuove campagne
                for (const campaign of importedCampaigns) {
                    const { id, ...campaignData } = campaign;
                    await saveCampaignToDbFirebase(campaignData);
                }
                alert('Campagne importate e aggiunte con successo a Firebase!');
            }

            // La UI si aggiornerà automaticamente grazie a onValue
            // loadTheCampaignsUI(); // Non strettamente necessario se onValue funziona

        } catch (error) {
            console.error('Errore durante l\'importazione:', error);
            alert('Errore durante l\'importazione del file: ' + error.message);
        }
    };
    reader.readAsText(file); 
});


// Opzionale: Registra un Service Worker per funzionalità PWA complete (offline, installazione)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Assicurati che questo percorso sia corretto
        navigator.serviceWorker.register('/DnD-Campaigns/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrato con successo:', registration);
            })
            .catch(error => {
                console.error('Registrazione ServiceWorker fallita:', error);
            });
    });
}