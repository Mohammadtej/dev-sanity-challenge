import 'dotenv/config'
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

async function runAutonomousAgent() {
    console.log('Connecting to Sanity Context MCP...')

    const mcp = await createMCPClient({
        transport: {
            type: 'http',
            url: process.env.SANITY_CONTEXT_MCP_URL,
            headers: {
                Authorization: `Bearer ${process.env.SANITY_READ_TOKEN}`,
            },
        },
    })

    // 1. Discover registered tools directly from Sanity MCP
    const tools = await mcp.listTools()
    console.log('Available MCP Tools:', tools)
    console.log(typeof (tools))
    console.log('Available MCP Tools:', tools?.['tools'].map((t) => t.name))

    // Convert MCP tool schemas into Gemini Function Declarations
    const functionDeclarations = tools?.['tools']?.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
    }))

    const systemInstruction = `
You are NeoNomad, an autonomous legal & tax arbiter.
Your goal is to arbitrate cross-border tax residency and Permanent Establishment (PE) risk.

WORKFLOW:
1. You MUST call "initial_context" first to retrieve the Knowledge Base ID and available entry paths.
2. Next, identify the relevant legal entry paths for the countries/treaties involved.
3. Call "knowledge_base_read" with the kbId and paths to fetch the full statutory and treaty text.
4. Adjudicate according to strict legal precedence:
   - Bilateral Tax Treaties (DTAA Art. 15) supersede domestic tax statutes.
   - Respect calendar-year boundary resets vs rolling 12-month periods.
   - For Spain, domestic presence requires strictly more than 183 days (>183, i.e., 184+ days) per calendar year.
5. Provide a deterministic, definitive ruling citing the exact statutory articles and treaty links retrieved.
`

    const userQuery = `
Trip Evaluation Scenario:
- Traveler: Indian resident software engineer employed by an Indian firm (Bengaluru).
- Remote Work Destination: Spain.
- Travel Dates: 15 October 2026 to 28 February 2027 (137 days total).
  * 2026 Calendar Year: 78 days (Oct 15 - Dec 31)
  * 2027 Calendar Year: 59 days (Jan 1 - Feb 28)
  * Rolling 12-month period: 137 days

Does this trip trigger:
1. Spanish domestic tax residency under Spanish law?
2. Personal income tax liability in Spain under the India-Spain DTAA?
3. Permanent Establishment (PE) corporate tax risk for the Indian employer?
`

    // Initialize conversation history
    const contents = [
        { role: 'user', parts: [{ text: userQuery }] }
    ]

    console.log('\n--- Starting Agent Execution Loop ---')

    let turns = 0
    const maxTurns = 6

    while (turns < maxTurns) {
        turns++

        // Invoke Gemini with function calling enabled
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                tools: [{ functionDeclarations }],
            },
        })

        const candidate = response.candidates?.[0]
        const content = candidate?.content

        if (!content) {
            console.log('No content returned from model.')
            break
        }

        // Add model turn to conversation history
        contents.push(content)

        // Check if the model wants to call an MCP tool
        const functionCalls = content.parts?.filter((p) => p.functionCall)

        if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
                const { name, args } = call.functionCall
                console.log(`\n[Agent Action] Calling Tool: ${name}`)
                console.log(`[Arguments]:`, JSON.stringify(args, null, 2))

                // Execute the tool call directly against the Sanity MCP server
                const toolResult = await mcp.callTool({
                    name,
                    arguments: args,
                })

                console.log(`[Tool Output Received from Sanity MCP]`)

                // Return tool output to the model
                contents.push({
                    role: 'user',
                    parts: [
                        {
                            functionResponse: {
                                name,
                                response: { output: toolResult },
                            },
                        },
                    ],
                })
            }
        } else {
            // No more tool calls; final answer reached
            console.log('\n================ FINAL ARBITRATION RULING ================')
            console.log(response.text)
            console.log('==========================================================')
            break
        }
    }

    await mcp.close()
}

runAutonomousAgent().catch(console.error)