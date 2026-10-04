import 'dotenv/config'
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'

async function checkSanityMCP() {
    console.log('Connecting to the Sanity Context MCP...')

    const payload = {
        transport: {
            type: 'http',
            url: process.env.SANITY_CONTEXT_MCP_URL,
            headers: {
                Authorization: `Bearer ${process.env.SANITY_READ_TOKEN}`,
            },
        },
    }

    console.log(payload)

    const mcp = await createMCPClient(payload)

    const tools = await mcp.listTools()
    console.log(tools)
    console.log('Successfully connected!')
    console.log('Available MCP tools: ', Object.keys(tools))

    await mcp.close()
}

checkSanityMCP().catch(console.error)