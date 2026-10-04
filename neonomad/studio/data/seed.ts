import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
dotenv.config()

// console.log(process.env.SANITY_STUDIO_PROJECT_ID);
// console.log(process.env.SANITY_STUDIO_DATASET);
// console.log(process.env.SANITY_WRITE_TOKEN);

const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || '<YOUR_PROJECT_ID>',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN, // create a write token in sanity.io/manage
    apiVersion: '2026-09-18',
})

async function seed() {
    console.log('Seeding real-world jurisdictions...')

    const spain = await client.createOrReplace({
        _id: 'jurisdiction-es',
        _type: 'jurisdiction',
        name: 'Spain',
        isoAlpha2: 'ES',
        taxYearCycle: 'calendar_year',
        statutoryPresenceRules: {
            daysLimit: 183,
            calculationWindow: 'per_tax_year',
        },
        officialStatuteCitation:
            'Ley 35/2006 (LIRPF), Artículo 9.1(a) - Physical presence exceeding 183 days in a single calendar year.',
    })

    const india = await client.createOrReplace({
        _id: 'jurisdiction-in',
        _type: 'jurisdiction',
        name: 'India',
        isoAlpha2: 'IN',
        taxYearCycle: 'commonwealth_fiscal',
        statutoryPresenceRules: {
            daysLimit: 182,
            calculationWindow: 'per_tax_year',
        },
        officialStatuteCitation:
            'Income-tax Act, 1961, Section 6(1)(a) - Physical presence of 182 days or more during the previous fiscal year.',
    })

    const germany = await client.createOrReplace({
        _id: 'jurisdiction-de',
        _type: 'jurisdiction',
        name: 'Germany',
        isoAlpha2: 'DE',
        taxYearCycle: 'calendar_year',
        statutoryPresenceRules: {
            daysLimit: 183,
            calculationWindow: 'consecutive_days',
        },
        officialStatuteCitation:
            'Abgabenordnung (AO) § 9 - Gewöhnlicher Aufenthalt established by continuous 6-month presence straddling years.',
    })

    console.log('Seeding real-world bilateral tax treaties...')

    await client.createOrReplace({
        _id: 'treaty-in-es',
        _type: 'bilateralTreaty',
        title: 'India-Spain Double Taxation Avoidance Agreement',
        signatoryA: { _type: 'reference', _ref: 'jurisdiction-in' },
        signatoryB: { _type: 'reference', _ref: 'jurisdiction-es' },
        article15Terms: {
            exemptionDayLimit: 183,
            countingPeriod: 'rolling_12_months',
            conditions: [
                'Recipient is present in Spain for <= 183 days in any 12-month period commencing or ending in the fiscal year',
                'Remuneration is paid by/on behalf of an employer who is not a resident of Spain',
                'Remuneration is not borne by a permanent establishment or fixed base in Spain',
            ],
        },
        legalHierarchyStatus: 'supersedes_domestic',
        sourceTreatyUrl: 'https://incometaxindia.gov.in/DTAA/Spain.pdf',
    })

    console.log('Seeding completed successfully!')
}

seed().catch(console.error)