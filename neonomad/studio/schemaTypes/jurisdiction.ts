import { defineType, defineField } from 'sanity'

export const jurisdiction = defineType({
    name: 'jurisdiction',
    title: 'Jurisdiction',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            type: 'string',
            title: 'Jurisdiction Name',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'isoAlpha2',
            type: 'string',
            title: 'ISO Alpha-2 Code',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'taxYearCycle',
            type: 'string',
            title: 'Tax Year Cycle',
            options: {
                list: [
                    { title: 'Calendar Year (January 1 - December 31)', value: 'calendar_year' },
                    { title: 'UK Fiscal Year (April 6 - April 5)', value: 'uk_fiscal' },
                    { title: 'Commmonwealth Fiscal Year (April 1 - March 31, e.g. India)', value: 'commonwealth_fiscal' },
                    { title: 'Australian Fiscal Year (July 1 - June 30)', value: 'australian_fiscal' }
                ]
            },
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'statutoryPresenceRules',
            type: 'object',
            title: 'Statutory Presence Rules',
            fields: [
                defineField({
                    name: 'dayLimit',
                    type: 'number',
                    title: 'Day Threshold Limit',
                    description: 'Numer of physical days triggering residency (e.g. 90 or 183). Leave empty if purely non-day-based.'
                }),
                defineField({
                    name: 'calculationWindow',
                    type: 'string',
                    title: 'Calculation Window',
                    options: {
                        list: [
                            { title: 'Per Tax Year (Resets at end of Tax Year Cycle)', value: 'per_tax_year' },
                            { title: 'Any Rolling 12-month Period', value: 'rolling_12_months' },
                            { title: 'Consecutive Days Across Boundaries', value: 'consecutive_days' }
                        ]
                    },
                    validation: (Rule) => Rule.required()
                })
            ]
        }),
        defineField({
            name: 'officialStatuteCitation',
            type: 'text',
            title: 'Official Legal Citation'
        })
    ]
})