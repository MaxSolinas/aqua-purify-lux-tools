import { Produit } from '../data/types';

export function calculateSizing(apts: number, constants: any) {
    const totalVolM3 = (apts * constants.personsPerApt * constants.consumptionPerPerson) / 1000;
    const sigmaVR = apts * constants.vrPerApt; 
    const peakFlowLS = constants.coefA * Math.pow(sigmaVR, constants.coefB) - constants.coefC;
    const peakFlowM3H = peakFlowLS * 3.6;

    return { peakFlowM3H, totalVolM3, sigmaVR };
}

export function findBestModel(flowM3H: number, volM3: number, currentTH: number, productDB: Produit[]): Produit {
    const match = productDB.find(p => {
        const flowOk = p.limit >= flowM3H;
        const hardnessOk = p.maxSelectTH !== undefined ? currentTH <= p.maxSelectTH : true;
        const volOk = (p.volLimit !== undefined && volM3 !== undefined) ? volM3 <= p.volLimit : true;
        return flowOk && hardnessOk && volOk;
    });
    
    return match || {
        limit: 999,
        name: "KineticoPRO Hydrus sur mesure",
        resin: "Sur étude",
        flow1b: "-",
        flow2b: "-",
        hardness: "-",
        conn: "-",
        dims: "-",
        pressure: "-",
        temp: "-"
    };
}
