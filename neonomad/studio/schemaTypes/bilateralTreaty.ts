import { defineType, defineField } from 'sanity'

export const bilateralTreaty = defineType({
    name: 'bilateralTreaty',
    title: 'Bilateral Tax Treaty (DTAA)',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            type: 'string',
            title: 'Treaty Title',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'signatoryA',
            type: 'reference',
            to: [{ type: 'jurisdiction' }],
            title: 'Signatory State A (e.g. Resident Home)'
        }),
        defineField({
            name: 'signatoryB',
            type: 'reference',
            to: [{ type: 'jurisdiction' }],
            title: 'Signatory State B (e.g. Host Destination)'
        }),
        defineField({
            name: 'article15Terms',
            type: 'object',
            title: 'Dependent Personal Services (Article 15)',
            fields: [
                defineField({
                    name: 'exemptionDayLimit',
                    type: 'number',
                    title: 'Treaty Exemption Day Limit',
                    description: 'Maximum allowable days'
                }),
                defineField({
                    name: 'countingPeriod',
                    type: 'string',
                    title: 'Period Interpretation',
                    options: {
                        list: [
                            { title: 'In the Fiscal Year of the Host Country', value: 'host_fiscal_year' },
                            { title: 'In any Twelve-Month Period Commencing or Ending in the Fiscal Year', value: 'rolling_12_months' },
                            { title: 'In the Calendar Year', value: 'calendar_year' }
                        ]
                    },
                    validation: (Rule) => Rule.required()
                }),
                defineField({
                    name: 'conditions',
                    type: 'array',
                    title: 'Cumulative Exemption Criteria',
                    of: [{ type: 'string' }],
                    description: 'e.g. Employer is non-resident; Salary no borne by permanent establishment'
                })
            ]
        }),
        defineField({
            name: 'legalHierarchyStatus',
            type: 'string',
            title: 'Statutory Precedence',
            options: {
                list: [
                    { title: 'Treaty Overrides Domestic Law', value: 'supersedes_domestic' },
                    { title: 'Subject to Domestic GAAR Override', value: 'subject_to_gaar' }
                ]
            },
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'sourceTreatyUrl',
            type: 'url',
            title: 'Official Treaty Gazette URL'
        })
    ]
})