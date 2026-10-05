import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
dotenv.config()

const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || '<YOUR_PROJECT_ID>',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN, // create a write token in sanity.io/manage
    apiVersion: '2026-09-18',
})

async function seedV2() {
    console.log('Seeding / updating jurisdictions (idempotent with createOrReplace)...')

    // 1. Spain: Domestic 183-day residency + strict territorial IRNR source taxation
    await client.createOrReplace({
        _id: 'jurisdiction-es',
        _type: 'jurisdiction',
        name: 'Spain',
        isoAlpha2: 'ES',
        taxYearCycle: 'calendar_year',
        statutoryPresenceRules: {
            daysLimit: 183,
            comparisonOperator: 'greater_than', // >183 days, effectively 184+ days
            calculationWindow: 'per_tax_year',
        },
        officialStatuteCitation:
            'Ley 35/2006 (LIRPF) Art. 9.1(a) requires presence strictly exceeding 183 days (>183) in a calendar year. Concurrently, Real Decreto Legislativo 5/2004 (IRNR) Art. 13.1(c) deems any work physically performed on Spanish territory as immediately taxable Spanish-source income from day 1, unless exempted by a ratified double tax treaty.',
    })

    // 2. Cyprus: 60-Day Accelerated Tax Residency Rule
    await client.createOrReplace({
        _id: 'jurisdiction-cy',
        _type: 'jurisdiction',
        name: 'Cyprus',
        isoAlpha2: 'CY',
        taxYearCycle: 'calendar_year',
        statutoryPresenceRules: {
            daysLimit: 60,
            comparisonOperator: 'greater_than_or_equal',
            calculationWindow: 'per_tax_year',
        },
        officialStatuteCitation:
            'Cyprus Income Tax Law 118(I)/2002 (as amended by Law 119(I)/2017): An individual is deemed tax resident under the 60-day rule if present in Cyprus for >= 60 days, maintains a permanent home, carries out local business/employment, and does not reside in another single state for >183 days.',
    })

    // 3. Germany: 6-Month Habitual Abode across Year Boundaries
    // Germany: 6-Month Habitual Abode across Year Boundaries
    await client.createOrReplace({
        _id: 'jurisdiction-de',
        _type: 'jurisdiction',
        name: 'Germany',
        isoAlpha2: 'DE',
        taxYearCycle: 'calendar_year',
        statutoryPresenceRules: {
            daysLimit: 183,
            comparisonOperator: 'greater_than', // Strictly > 183 days (effectively 184+ days / > 6 months)
            calculationWindow: 'consecutive_days',
        },
        officialStatuteCitation:
            'Abgabenordnung (AO) § 9 Satz 2: A habitual abode (Gewöhnlicher Aufenthalt) requires continuous physical presence strictly exceeding six months (>183 days, effectively triggering at 184 or more days). Presence of exactly 183 days or fewer does not satisfy this statutory rule. Short interruptions are disregarded, and presence straddling two calendar years applies retroactively from entry.',
    })

    // 4. India: 182-Day Commonwealth Fiscal Year Rule
    await client.createOrReplace({
        _id: 'jurisdiction-in',
        _type: 'jurisdiction',
        name: 'India',
        isoAlpha2: 'IN',
        taxYearCycle: 'commonwealth_fiscal',
        statutoryPresenceRules: {
            daysLimit: 182,
            comparisonOperator: 'greater_than_or_equal',
            calculationWindow: 'per_tax_year',
        },
        officialStatuteCitation:
            'Income-tax Act, 1961, Section 6(1)(a): An individual is a resident in India if physically present for 182 days or more during the previous fiscal year (April 1 to March 31).',
    })

    console.log('Seeding / updating bilateral tax treaties...')

    // Treaty 1: India - Spain DTAA
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
                'Remuneration is paid by or on behalf of an employer who is not a resident of Spain',
                'Remuneration is not borne by a permanent establishment or fixed base in Spain',
            ],
        },
        legalHierarchyStatus: 'supersedes_domestic',
        sourceTreatyUrl: 'https://incometaxindia.gov.in/DTAA/Spain.pdf',
    })

    // Treaty 2: India - Cyprus DTAA
    await client.createOrReplace({
        _id: 'treaty-in-cy',
        _type: 'bilateralTreaty',
        title: 'India-Cyprus Double Taxation Avoidance Agreement',
        signatoryA: { _type: 'reference', _ref: 'jurisdiction-in' },
        signatoryB: { _type: 'reference', _ref: 'jurisdiction-cy' },
        article15Terms: {
            exemptionDayLimit: 183,
            countingPeriod: 'host_fiscal_year',
            conditions: [
                'Recipient is present in Cyprus for <= 183 days in the fiscal year concerned',
                'Remuneration is paid by or on behalf of an employer not resident in Cyprus',
                'Remuneration is not borne by a permanent establishment in Cyprus',
            ],
        },
        legalHierarchyStatus: 'supersedes_domestic',
        sourceTreatyUrl: 'https://incometaxindia.gov.in/DTAA/Cyprus.pdf',
    })

    // Treaty 3: Germany - India DTAA
    await client.createOrReplace({
        _id: 'treaty-in-de',
        _type: 'bilateralTreaty',
        title: 'Agreement Between the Republic of India and the Federal Republic of Germany for the Avoidance of Double Taxation',
        signatoryA: { _type: 'reference', _ref: 'jurisdiction-in' },
        signatoryB: { _type: 'reference', _ref: 'jurisdiction-de' },
        article15Terms: {
            exemptionDayLimit: 183,
            countingPeriod: 'host_fiscal_year',
            conditions: [
                'Recipient is present in Germany for not exceeding 183 days in the fiscal year concerned (calendar year)',
                'Remuneration is paid by or on behalf of an employer who is not a resident of Germany',
                'Remuneration is not borne by a permanent establishment which the employer has in Germany',
            ],
        },
        legalHierarchyStatus: 'supersedes_domestic',
        sourceTreatyUrl: 'https://incometaxindia.gov.in/DTAA/Germany.pdf',
    })

    // Treaty 4: Germany - Spain DTAA (Resolves Triangular Corporate PE & Cross-border Relief)
    await client.createOrReplace({
        _id: 'treaty-de-es',
        _type: 'bilateralTreaty',
        title: 'Agreement Between the Federal Republic of Germany and the Kingdom of Spain for the Avoidance of Double Taxation',
        signatoryA: { _type: 'reference', _ref: 'jurisdiction-de' },
        signatoryB: { _type: 'reference', _ref: 'jurisdiction-es' },
        article15Terms: {
            exemptionDayLimit: 183,
            countingPeriod: 'rolling_12_months',
            conditions: [
                'Recipient is present in the host state for <= 183 days in any 12-month period',
                'Remuneration is paid by or on behalf of an employer not resident in the host state',
                'Remuneration is not borne by a permanent establishment in the host state',
            ],
        },
        legalHierarchyStatus: 'supersedes_domestic',
        sourceTreatyUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2012-9764',
    })

    console.log('Seeding completed successfully with zero duplicates!')
}

seedV2().catch(console.error)