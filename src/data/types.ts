export interface Produit {
    limit: number;
    name: string;
    maxSelectTH?: number;
    volLimit?: number;
    resin: string;
    flow1b: string;
    flow2b: string;
    hardness: string;
    conn: string;
    dims: string;
    pressure: string;
    temp: string;
}

export interface CommuneData {
    th: number;
    city?: string;
    localities?: string[];
}

export interface MasterData {
    [key: string]: CommuneData;
}

export interface Config {
    contact: {
        address: string;
        phone: string;
        web: string;
        email: string;
    };
    apiGeoUrl: string;
    constants: {
        vrPerApt: number;
        coefA: number;
        coefB: number;
        coefC: number;
        consumptionPerPerson: number;
        personsPerApt: number;
    };
}

export interface SearchItem {
    displayName: string;
    searchName: string;
    commune: string;
    th: number;
}
