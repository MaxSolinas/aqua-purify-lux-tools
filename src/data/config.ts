import { Config } from './types';

export const CONFIG: Config = {
    contact: {
        address: "296 Rte de Longwy, L-1940 Merl-Luxembourg",
        phone: "Tél : +352 20 33 80 01",
        web: "www.aquapurify.lu",
        email: "hello@aquapurify.lu"
    },
    apiGeoUrl: 'https://download.data.public.lu/resources/durete-de-leau/20251211-020257/wasserharte.geojson',
    constants: {
        vrPerApt: 0.72,
        coefA: 1.48,
        coefB: 0.19,
        coefC: 0.94,
        consumptionPerPerson: 135,
        personsPerApt: 2
    }
};
