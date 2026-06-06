import Alpine from 'alpinejs';
import { CONFIG } from '../data/config';
import { calculateSizing, findBestModel } from './calculator';
import { generatePDF } from './pdf-export';
import { Produit, MasterData, SearchItem } from '../data/types';

// Import local des bases de données générées par GSheets
import produitsRaw from '../data/produits.json';
import communesRaw from '../data/communes.json';

const PRODUCT_DB = produitsRaw as Produit[];
const MASTER_DATA = communesRaw as MasterData;

document.addEventListener('alpine:init', () => {
    Alpine.data('widget', () => ({
        projectRef: '',
        searchQuery: '',
        searchIndex: [] as SearchItem[],
        suggestions: [] as SearchItem[],
        showSuggestions: false,
        techDisplay: false,
        stepProject: false,
        buildingType: '',
        showCollectifForm: false,
        numApts: 1,
        
        currentTH: 0,
        selectedCommuneName: '',
        
        resultBox: false,
        resultModel: '',
        resultFlow: '--',
        resultVol: '--',
        currentSpecs: null as Produit | null,

        init() {
            this.buildSearchIndex();
            this.loadLiveGeoData();
        },

        buildSearchIndex() {
            const index: SearchItem[] = [];
            Object.entries(MASTER_DATA).forEach(([commune, data]) => {
                if (data.city === "Luxembourg") {
                    index.push({ displayName: `${commune} (Luxembourg)`, searchName: `${commune.toLowerCase()} luxembourg`, commune, th: data.th });
                } else {
                    index.push({ displayName: commune, searchName: commune.toLowerCase(), commune, th: data.th });
                    if (data.localities) {
                        data.localities.forEach(loc => {
                            if (loc.toLowerCase() !== commune.toLowerCase()) {
                                index.push({ displayName: loc, searchName: loc.toLowerCase(), commune, th: data.th });
                            }
                        });
                    }
                }
            });
            this.searchIndex = index.sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));
        },

        async loadLiveGeoData() {
            try {
                const response = await fetch(CONFIG.apiGeoUrl);
                if (!response.ok) return;
                const geoData = await response.json();
                if (geoData.features) {
                    const props = geoData.features[0].properties;
                    const keys = Object.keys(props);
                    const keyName = keys.find(k => k.toLowerCase().includes('commune'));
                    const keyVal = keys.find(k => k.toLowerCase().includes('wsz') || k.toLowerCase().includes('durete'));
                    
                    if (keyName && keyVal) {
                        const lookup: { [key: string]: string } = {};
                        Object.keys(MASTER_DATA).forEach(k => lookup[k.toLowerCase().trim()] = k);
                        
                        geoData.features.forEach((f: any) => {
                            const n = f.properties[keyName];
                            const v = f.properties[keyVal];
                            if (n && typeof n === 'string') {
                                const clean = n.trim().toLowerCase();
                                const realKey = lookup[clean];
                                const val = parseFloat(v);
                                if (realKey && MASTER_DATA[realKey] && !isNaN(val) && val > 0.1) {
                                    MASTER_DATA[realKey].th = Math.max(MASTER_DATA[realKey].th, val);
                                }
                            }
                        });
                        this.buildSearchIndex();
                    }
                }
            } catch (e) {
                console.warn("API GeoLuxembourg indisponible, repli sur la DB Sheets locale.", e);
            }
        },

        handleInput() {
            const val = this.searchQuery.toLowerCase();
            if (val.length < 2) {
                this.suggestions = [];
                this.showSuggestions = false;
                return;
            }
            this.suggestions = this.searchIndex.filter(i => i.searchName.includes(val)).slice(0, 10);
            this.showSuggestions = this.suggestions.length > 0;
        },

        selectCommune(item: SearchItem) {
            this.currentTH = item.th;
            this.selectedCommuneName = item.displayName;
            this.searchQuery = item.displayName;
            this.showSuggestions = false;
            this.techDisplay = true;
            this.stepProject = true;
            this.buildingType = '';
            this.showCollectifForm = false;
            this.resultBox = false;
        },

        handleTypeChange() {
            this.showCollectifForm = this.buildingType === 'collectif';
            this.resultBox = false;

            if (this.buildingType && this.buildingType !== 'collectif') {
                if (this.buildingType === 'appt') this.resultModel = (this.currentTH <= 40) ? "Kinetico Premier Compact XP" : "Kinetico Premier Plus XP";
                if (this.buildingType === 'maison') this.resultModel = "Kinetico Premier Plus XP";
                if (this.buildingType === 'pro') this.resultModel = "Gamme Pro (Contactez-nous)";
                
                this.currentSpecs = null;
                this.resultFlow = '--';
                this.resultVol = '--';
                this.resultBox = true;
            }
        },

        calculate() {
            if (!this.numApts || this.numApts < 1) return;
            
            const sizing = calculateSizing(this.numApts, CONFIG.constants);
            const specs = findBestModel(sizing.peakFlowM3H, sizing.totalVolM3, this.currentTH, PRODUCT_DB);
            
            this.resultModel = specs.name;
            this.resultFlow = sizing.peakFlowM3H.toFixed(2);
            this.resultVol = sizing.totalVolM3.toFixed(2);
            this.currentSpecs = specs;
            this.resultBox = true;
        },

        downloadPdf() {
            const currentResult = {
                type: this.buildingType,
                model: this.resultModel,
                flow: this.resultFlow,
                vol: this.resultVol,
                apts: this.numApts,
                specs: this.currentSpecs
            };
            generatePDF(this.projectRef, this.selectedCommuneName, this.currentTH, currentResult);
        }
    }));
});

Alpine.start();
